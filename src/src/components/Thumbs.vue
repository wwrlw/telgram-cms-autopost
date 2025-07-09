<template>
  <div class="space-y-6">
    <div v-if="!loading || posts.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <PostThumb
        v-for="post in posts"
        :key="post._id"
        :post="post"
        :categories="categories"
        @publish="$emit('publish', $event)"
        @delete="$emit('delete', $event)"
        @quickview="handleQuickview"
      />
    </div>

    <MediaViewer 
      :show="showQuickviewer"
      :media="currentQuickviewMedia"
      :current-index="currentQuickviewIndex"
      :total-count="quickviewPost?.media?.length || 0"
      :can-go-previous="currentQuickviewIndex > 0"
      :can-go-next="currentQuickviewIndex < (quickviewPost?.media?.length || 0) - 1"
      @close="closeQuickview"
      @previous="previousQuickviewMedia"
      @next="nextQuickviewMedia"
    />

    <div v-if="loading && posts.length === 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div 
        v-for="i in 12" 
        :key="i"
        class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-pulse"
      >
        <div class="aspect-video bg-gray-200"></div>
        <div class="p-4 space-y-3">
          <div class="h-4 bg-gray-200 rounded w-3/4"></div>
          <div class="space-y-2">
            <div class="h-3 bg-gray-200 rounded"></div>
            <div class="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
          <div class="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    </div>

    <div v-if="!loading && posts.length === 0" class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">Нет постов</h3>
      <p class="mt-1 text-sm text-gray-500">Попробуйте изменить фильтры или добавить новые посты.</p>
      <div class="mt-6">
        <router-link 
          :to="{ name: 'create-post' }"
          class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Создать пост
        </router-link>
      </div>
    </div>

    <div v-if="pagination.totalPages > 1" class="bg-white border border-gray-200 rounded-lg">
      <div class="px-4 py-3 flex items-center justify-between sm:px-6">
        <div class="flex-1 flex justify-between sm:hidden">
          <button 
            @click="$emit('page-change', pagination.page - 1)"
            :disabled="pagination.page === 1"
            class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Назад
          </button>
          <button 
            @click="$emit('page-change', pagination.page + 1)"
            :disabled="pagination.page === pagination.totalPages"
            class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Вперед
          </button>
        </div>

        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div class="flex items-center space-x-4">
            <p class="text-sm text-gray-700">
              Показано 
              <span class="font-medium">{{ startItem }}</span>
              -
              <span class="font-medium">{{ endItem }}</span>
              из 
              <span class="font-medium">{{ pagination.total }}</span>
            </p>
            <div class="flex items-center space-x-2">
              <label class="text-sm text-gray-500">Показать:</label>
              <select 
                :value="pagination.limit" 
                @change="$emit('items-per-page-change', parseInt($event.target.value))"
                class="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="12">12</option>
                <option value="24">24</option>
                <option value="48">48</option>
              </select>
            </div>
          </div>
          
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button 
                @click="$emit('page-change', pagination.page - 1)"
                :disabled="pagination.page === 1"
                class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </button>
              
              <button 
                v-for="page in visiblePages" 
                :key="page"
                @click="page !== '...' && $emit('page-change', page)"
                :disabled="page === '...'"
                :class="[
                  'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                  page === pagination.page 
                    ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                    : page === '...'
                    ? 'bg-white border-gray-300 text-gray-300 cursor-default'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                ]"
              >
                {{ page }}
              </button>
              
              <button 
                @click="$emit('page-change', pagination.page + 1)"
                :disabled="pagination.page === pagination.totalPages"
                class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import PostThumb from './PostThumb.vue'
import MediaViewer from './MediaViewer.vue'

const props = defineProps({
  posts: {
    type: Array,
    default: () => []
  },
  categories: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  pagination: {
    type: Object,
    default: () => ({
      page: 1,
      limit: 12,
      total: 0,
      totalPages: 0
    })
  }
})

defineEmits(['publish', 'delete', 'page-change', 'items-per-page-change'])

const startItem = computed(() => {
  return (props.pagination.page - 1) * props.pagination.limit + 1
})

const endItem = computed(() => {
  return Math.min(props.pagination.page * props.pagination.limit, props.pagination.total)
})

const visiblePages = computed(() => {
  const pages = []
  const total = props.pagination.totalPages
  const current = props.pagination.page
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i)
      }
      pages.push('...', total)
    } else if (current >= total - 3) {
      pages.push(1, '...')
      for (let i = total - 4; i <= total; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1, '...')
      for (let i = current - 1; i <= current + 1; i++) {
        pages.push(i)
      }
      pages.push('...', total)
    }
  }
  
  return pages
})

const showQuickviewer = ref(false)
const currentQuickviewMedia = ref(null)
const currentQuickviewIndex = ref(0)
const quickviewPost = ref(null)

const handleQuickview = (post) => {
  if (!post.media || !post.media.length) return
  
  quickviewPost.value = post
  currentQuickviewIndex.value = 0
  currentQuickviewMedia.value = post.media[0]
  showQuickviewer.value = true
}

const closeQuickview = () => {
  showQuickviewer.value = false
  quickviewPost.value = null
  currentQuickviewMedia.value = null
  currentQuickviewIndex.value = 0
}

const previousQuickviewMedia = () => {
  if (currentQuickviewIndex.value > 0) {
    currentQuickviewIndex.value--
    currentQuickviewMedia.value = quickviewPost.value.media[currentQuickviewIndex.value]
  }
}

const nextQuickviewMedia = () => {
  if (currentQuickviewIndex.value < quickviewPost.value.media.length - 1) {
    currentQuickviewIndex.value++
    currentQuickviewMedia.value = quickviewPost.value.media[currentQuickviewIndex.value]
  }
}
</script>
