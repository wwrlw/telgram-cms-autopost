<template>
  <div class="min-h-screen bg-gray-50">
    <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <StatsCards 
        v-if="!loading || posts.length > 0"
        :totalCount="totalCount" :posts="posts" />

      <Filters 
        :loading="loading" 
        :posts="posts"
        @update:searchQuery="handleSearchChange"
        @update:statusFilter="handleStatusFilterChange"
        @update:sourceChannelFilter="handleSourceChannelFilterChange"
        @update:dateFilters="handleDateFiltersChange"
        @update:sortOptions="handleSortOptionsChange"
        @clearFilters="handleClearFilters" />

      <PostTableSkeleton v-if="loading && posts.length === 0" :item-count="10" />

      <PostsTable 
        v-else
        :posts="posts"
        :pagination="pagination"
        :loading="loading"
        :selected-posts="selectedPosts"
        @update:selectedPosts="selectedPosts = $event"
        @publish="handlePublish"
        @delete="deletePost"
        @page-change="changePage"
        @items-per-page-change="changeItemsPerPage" />

      <Actions 
        :selected-posts="selectedPosts"
        @bulk-publish="bulkPublish"
        @bulk-delete="bulkDelete"
        @clear-selection="clearSelection" />

      <PublishModal 
        v-model:show="showPublishModal"
        :post="selectedPostForPublish"
        @published="handlePublished" />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject, watch } from "vue";
import http from '@/js/http';
import PostTableSkeleton from '@/components/PostTableSkeleton.vue';
import StatsCards from '@/components/StatsCards.vue';
import Filters from '@/components/Filters.vue';
import PostsTable from '@/components/PostsTable.vue';
import Actions from '@/components/Actions.vue';
import PublishModal from '@/components/Modal/PublishModal.vue';

const globalLoading = inject('loading');
const refreshTrigger = inject('refreshTrigger');
const setLoading = inject('setLoading');

const posts = ref([]);
const searchQuery = ref('');
const statusFilter = ref('');
const sourceChannelFilter = ref('');
const dateFromFilter = ref('');
const dateToFilter = ref('');
const sortField = ref('created_at');
const sortOrder = ref('desc');
const selectedPosts = ref([]);
const showPublishModal = ref(false);
const selectedPostForPublish = ref(null);
const loading = ref(false);
const totalCount = ref(0);

const pagination = ref({
  page: 1,
  limit: 25,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false
});

const postsService = async (params = {}) => {
  loading.value = true;
  if (setLoading) setLoading(true);
  
  try {
    return new Promise((resolve, reject) => {
      const requestParams = {
        page: params.page || pagination.value.page,
        limit: params.limit || pagination.value.limit,
        text: searchQuery.value || undefined,
        is_unique: statusFilter.value ? (statusFilter.value === 'unique' ? true : false) : undefined,
        source_channel: sourceChannelFilter.value || undefined,
        date_from: dateFromFilter.value ? new Date(dateFromFilter.value).toISOString() : undefined,
        date_to: dateToFilter.value ? new Date(dateToFilter.value + 'T23:59:59').toISOString() : undefined,
        sort_field: sortField.value,
        sort_order: sortOrder.value
      };

      Object.keys(requestParams).forEach(key => {
        if (requestParams[key] === undefined) {
          delete requestParams[key];
        }
      });

      http.posts(requestParams, (res) => {
        posts.value = res.data || [];
        const paginationData = res.pagination || res.params;
        pagination.value = {
          page: paginationData.page,
          limit: paginationData.limit,
          total: paginationData.total,
          totalPages: paginationData.totalPages,
          hasNext: paginationData.hasNext,
          hasPrev: paginationData.hasPrev
        };
        totalCount.value = paginationData.total;
        loading.value = false;
        if (setLoading) setLoading(false);
        resolve(res.data);
      }, (err) => {
        console.error('Error loading posts:', err);
        loading.value = false;
        if (setLoading) setLoading(false);
        reject(err);
      });
    });
  } catch (error) {
    console.error('Error loading posts:', error);
    loading.value = false;
    if (setLoading) setLoading(false);
    throw error;
  }
};

const changePage = (page) => {
  if (page >= 1 && page <= pagination.value.totalPages) {
    pagination.value.page = page;
    postsService({ page });
  }
};

const changeItemsPerPage = (limit) => {
  pagination.value.limit = limit;
  pagination.value.page = 1;
  postsService({ page: 1, limit });
};

// Добавляем debounce для поиска
let searchTimeout;
const handleSearchChange = (query) => {
  searchQuery.value = query;
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    pagination.value.page = 1;
    postsService({ page: 1 });
  }, 500);
};

const handleStatusFilterChange = (status) => {
  statusFilter.value = status;
  pagination.value.page = 1;
  postsService({ page: 1 });
};

const handleSourceChannelFilterChange = (sourceChannel) => {
  sourceChannelFilter.value = sourceChannel;
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    pagination.value.page = 1;
    postsService({ page: 1 });
  }, 500);
};

const handleDateFiltersChange = (dateFilters) => {
  dateFromFilter.value = dateFilters.dateFrom;
  dateToFilter.value = dateFilters.dateTo;
  pagination.value.page = 1;
  postsService({ page: 1 });
};

const handleSortOptionsChange = (sortOptions) => {
  sortField.value = sortOptions.sortField;
  sortOrder.value = sortOptions.sortOrder;
  pagination.value.page = 1;
  postsService({ page: 1 });
};

const handleClearFilters = () => {
  searchQuery.value = '';
  statusFilter.value = '';
  sourceChannelFilter.value = '';
  dateFromFilter.value = '';
  dateToFilter.value = '';
  sortField.value = 'created_at';
  sortOrder.value = 'desc';
  pagination.value.page = 1;
  postsService({ page: 1 });
};

const handlePublish = (post) => {
  selectedPostForPublish.value = post;
  showPublishModal.value = true;
};

const handlePublished = (result) => {
  if (result.success) {
    window.$toast.success('Пост успешно опубликован в Telegram канал!');
    postsService();
  } else {
    window.$toast.error('Ошибка при публикации: ' + result.message);
  }
  selectedPostForPublish.value = null;
};

const bulkPublish = () => {
  if (selectedPosts.value.length > 0) {
    window.$toast.error('Для публикации выберите один пост');
  }
};

const deletePost = (postId) => {
  if (confirm('Вы уверены, что хотите удалить этот пост?')) {
    http.deletePost({ id: postId }, (response) => {
      if (response.success) {
        window.$toast.success('Пост успешно удален');
        postsService();
      } else {
        window.$toast.error('Ошибка при удалении поста: ' + response.message);
      }
    });
  }
};

const bulkDelete = () => {
  if (selectedPosts.value.length === 0) {
    window.$toast.error('Выберите посты для удаления');
    return;
  }

  if (confirm(`Вы уверены, что хотите удалить ${selectedPosts.value.length} постов?`)) {
    // Удаляем посты по одному
    let deletedCount = 0;
    const totalToDelete = selectedPosts.value.length;
    
    selectedPosts.value.forEach((postId, index) => {
      http.deletePost({ id: postId }, (response) => {
        if (response.success) {
          deletedCount++;
        }
        
        // Если все посты обработаны, обновляем список
        if (deletedCount + index + 1 >= totalToDelete) {
          clearSelection();
          postsService();
          if (deletedCount > 0) {
            window.$toast.success(`Успешно удалено ${deletedCount} из ${totalToDelete} постов`);
          }
        }
      });
    });
  }
};

const clearSelection = () => {
  selectedPosts.value = [];
};

watch(refreshTrigger, () => {
  if (refreshTrigger && refreshTrigger.value > 0) {
    postsService();
  }
});

onMounted(() => {
  postsService();
});
</script>