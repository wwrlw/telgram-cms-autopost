<template>
    <div class="min-h-screen bg-gray-50">
        <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <StatsCards
                v-if="!loading || posts.length > 0"
                :totalCount="totalCount"
                :data="posts"
                type="posts"
            />

            <Search
                :loading="loading"
                :posts="posts"
                @update:searchQuery="handleSearchChange"
            />

            <Filters
                :loading="loading"
                :posts="posts"
                :categories="categories"
                @update:searchQuery="handleSearchChange"
                @update:statusFilter="handleStatusFilterChange"
                @update:categoryFilter="handleCategoryFilterChange"
                @update:dateFilters="handleDateFiltersChange"
                @update:sortOptions="handleSortOptionsChange"
                @clearFilters="handleClearFilters"
            />

            <Thumbs
                :posts="posts"
                :categories="categories"
                :loading="loading"
                @publish="handlePublish"
                @delete="deletePost"
            />

            <!-- Infinite Scroll Trigger -->
            <div
                v-if="hasMore && !loading"
                ref="infiniteScrollTrigger"
                class="h-20 flex items-center justify-center bg-blue-50 border-2 border-dashed border-blue-200 rounded-lg my-4"
            >
                <div class="text-blue-600 font-medium">Прокрутите вниз для загрузки еще постов</div>
            </div>

            <!-- Loading indicator for infinite scroll -->
            <div
                v-if="infiniteScrollLoading"
                class="flex justify-center py-8"
            >
                <LoadingSpinner 
                    size="medium" 
                    text="Загружаем еще посты..." 
                />
            </div>

            <PublishModal
                v-model:show="showPublishModal"
                :post="selectedPostForPublish"
                @published="handlePublished"
            />

            <ConfirmModal
                :show="showConfirmModal"
                :message="confirmMessage"
                @confirm="onConfirm"
                @cancel="onCancelConfirm"
            />
        </main>
    </div>
</template>

<script setup>
import { ref, onMounted, inject, watch, nextTick } from "vue";
import http from "@/js/http";
import StatsCards from "@/components/StatsCards.vue";
import Filters from "@/components/Shared/Filters.vue";
import PublishModal from "@/components/Modal/PublishModal.vue";
import Thumbs from "@/components/Thumbs.vue";
import ConfirmModal from "@/components/Modal/ConfirmModal.vue";
import Search from "@/components/Shared/Search.vue";
import LoadingSpinner from "@/components/LoadingSpinner.vue";
import { useInfiniteScroll } from "@/composables/useInfiniteScroll";
import { useOptimizedApi } from "@/composables/useOptimizedApi";
import { useFavorites } from "@/composables/useFavorites.js";
import mediaPreloader from "@/utils/mediaPreloader";

const refreshTrigger = inject("refreshTrigger");
const setLoading = inject("setLoading");
const { removePublishedFromFavorites, initializeFavorites } = useFavorites();

const posts = ref([]);
const searchQuery = ref("");
const statusFilter = ref("");
const categoryFilter = ref("");
const dateFromFilter = ref("");
const dateToFilter = ref("");
const sortField = ref("created_at");
const sortOrder = ref("desc");
const showPublishModal = ref(false);
const selectedPostForPublish = ref(null);
const loading = ref(false);
const infiniteScrollLoading = ref(false);
const totalCount = ref(0);
const categories = ref([]);
const infiniteScrollTrigger = ref(null);

// Infinite scroll
const { createObserver, observeElement, startLoading, stopLoading, setHasMore } = useInfiniteScroll();

// Optimized API
const { optimizedRequest, debouncedSearch } = useOptimizedApi();

const currentPage = ref(1);
const hasMore = ref(true);
const pageSize = 24;

const postsService = async (params = {}, isInfiniteScroll = false) => {
    if (isInfiniteScroll) {
        infiniteScrollLoading.value = true;
    } else {
        loading.value = true;
        if (setLoading) setLoading(true);
    }

    try {
        const requestParams = {
            page: params.page || currentPage.value,
            limit: params.limit || pageSize,
            lastId: params.lastId || undefined,
            text: searchQuery.value || undefined,
            is_unique: statusFilter.value
                ? statusFilter.value === "unique"
                    ? true
                    : false
                : undefined,
            category_id: categoryFilter.value || undefined,
            date_from: dateFromFilter.value
                ? new Date(dateFromFilter.value).toISOString()
                : undefined,
            date_to: dateToFilter.value
                ? new Date(dateToFilter.value + "T23:59:59").toISOString()
                : undefined,
            sort_field: sortField.value,
            sort_order: sortOrder.value,
        };

        Object.keys(requestParams).forEach((key) => {
            if (requestParams[key] === undefined) {
                delete requestParams[key];
            }
        });

        // Используем новый endpoint для infinite scroll
        const apiMethod = isInfiniteScroll ? http.postsInfiniteScroll : http.posts;
        console.log('Making API request with params:', requestParams);
        const response = await optimizedRequest(apiMethod, requestParams);
        console.log('API response:', response);
        
        if (isInfiniteScroll) {
            // Добавляем новые посты к существующим
            const newPosts = response.data || [];
            posts.value = [...posts.value, ...newPosts];
            currentPage.value++;
            
            // Обновляем hasMore из ответа API
            hasMore.value = response.params?.hasMore || false;
            console.log('Updated hasMore to:', hasMore.value, 'response params:', response.params);
            
            // Предзагружаем медиа для новых постов в фоне
            if (newPosts.length > 0) {
                // Запускаем предзагрузку асинхронно, не блокируя основной поток
                setTimeout(() => {
                    mediaPreloader.preloadPostsMedia(newPosts);
                }, 0);
            }
        } else {
            // Заменяем посты полностью
            posts.value = response.data || [];
            currentPage.value = 1;
            
            // Предзагружаем медиа для всех постов в фоне
            if (posts.value.length > 0) {
                // Запускаем предзагрузку асинхронно, не блокируя основной поток
                setTimeout(() => {
                    mediaPreloader.preloadPostsMedia(posts.value);
                }, 0);
            }
        }

        // Автоматически удаляем опубликованные посты из избранного
        await removePublishedFromFavorites(posts.value);

        const paginationData = response.pagination || response.params;
        totalCount.value = paginationData.total || 0;

        if (isInfiniteScroll) {
            infiniteScrollLoading.value = false;
        } else {
            loading.value = false;
            if (setLoading) setLoading(false);
        }

        return response.data;
    } catch (error) {
        console.error("Error loading posts:", error);
        if (isInfiniteScroll) {
            infiniteScrollLoading.value = false;
        } else {
            loading.value = false;
            if (setLoading) setLoading(false);
        }
        throw error;
    }
};

// Infinite scroll handler
const loadMorePosts = async () => {
    console.log('loadMorePosts called', { hasMore: hasMore.value, loading: infiniteScrollLoading.value });
    
    if (!hasMore.value || infiniteScrollLoading.value) {
        console.log('Skipping loadMorePosts - hasMore:', hasMore.value, 'loading:', infiniteScrollLoading.value);
        return;
    }
    
    try {
        // Получаем ID последнего поста для курсорной пагинации
        const lastPost = posts.value[posts.value.length - 1];
        const lastId = lastPost?._id;
        
        console.log('Loading more posts with lastId:', lastId, 'page:', currentPage.value);
        
        await postsService({ 
            page: currentPage.value, 
            lastId: lastId 
        }, true);
        
        console.log('More posts loaded successfully');
    } catch (error) {
        console.error("Error loading more posts:", error);
    }
};

// Debounced search
const handleSearchChange = async (query) => {
    searchQuery.value = query;
    await debouncedSearch(async () => {
        currentPage.value = 1;
        hasMore.value = true;
        await postsService({ page: 1 });
    }, 500);
};

const handleStatusFilterChange = async (status) => {
    statusFilter.value = status;
    currentPage.value = 1;
    hasMore.value = true;
    await postsService({ page: 1 });
};

const handleCategoryFilterChange = async (categoryId) => {
    categoryFilter.value = categoryId;
    currentPage.value = 1;
    hasMore.value = true;
    await postsService({ page: 1 });
};

const handleDateFiltersChange = async (dateFilters) => {
    dateFromFilter.value = dateFilters.dateFrom;
    dateToFilter.value = dateFilters.dateTo;
    currentPage.value = 1;
    hasMore.value = true;
    await postsService({ page: 1 });
};

const handleSortOptionsChange = async (sortOptions) => {
    sortField.value = sortOptions.sortField;
    sortOrder.value = sortOptions.sortOrder;
    currentPage.value = 1;
    hasMore.value = true;
    await postsService({ page: 1 });
};

const handleClearFilters = async () => {
    searchQuery.value = "";
    statusFilter.value = "";
    categoryFilter.value = "";
    dateFromFilter.value = "";
    dateToFilter.value = "";
    sortField.value = "created_at";
    sortOrder.value = "desc";
    currentPage.value = 1;
    hasMore.value = true;
    await postsService({ page: 1 });
};

const handlePublish = (post) => {
    selectedPostForPublish.value = post;
    showPublishModal.value = true;
};

const handlePublished = async (result) => {
    if (result.success) {
        window.$toast.success("Пост успешно опубликован в Telegram канал!");
        currentPage.value = 1;
        hasMore.value = true;
        await postsService({ page: 1 });
    } else {
        window.$toast.error("Ошибка при публикации: " + result.message);
    }
    selectedPostForPublish.value = null;
};

const showConfirmModal = ref(false);
const confirmMessage = ref("");
let confirmAction = null;
let confirmPayload = null;

function showConfirm(message, action, payload = null) {
    confirmMessage.value = message;
    confirmAction = action;
    confirmPayload = payload;
    showConfirmModal.value = true;
}

function onConfirm() {
    showConfirmModal.value = false;
    if (confirmAction) confirmAction(confirmPayload);
}
function onCancelConfirm() {
    showConfirmModal.value = false;
    confirmAction = null;
    confirmPayload = null;
}

const deletePost = (post) => {
    showConfirm(
        "Вы уверены, что хотите удалить этот пост?" +
            (post.is_published && post.telegram_message_id
                ? " (Пост также будет удалён из Telegram)"
                : ""),
        (postObj) => {
            if (postObj.is_published && postObj.telegram_message_id) {
                http.deletePostFromTelegram(postObj._id.toString(), (tgRes) => {
                    if (!tgRes.success) {
                        window.$toast.error(
                            "Ошибка при удалении из Telegram: " + tgRes.message
                        );
                        // Можно прервать дальнейшее удаление, если нужно
                        // return;
                    }
                    http.deletePost({ id: postObj._id }, async (response) => {
                        if (response.success) {
                            window.$toast.success(
                                "Пост успешно удалён (и из Telegram, если был опубликован)"
                            );
                            currentPage.value = 1;
                            hasMore.value = true;
                            await postsService({ page: 1 });
                        } else {
                            window.$toast.error(
                                "Ошибка при удалении поста: " + response.message
                            );
                        }
                    });
                });
                            } else {
                    http.deletePost({ id: postObj._id }, async (response) => {
                        if (response.success) {
                            window.$toast.success("Пост успешно удалён");
                            currentPage.value = 1;
                            hasMore.value = true;
                            await postsService({ page: 1 });
                        } else {
                            window.$toast.error(
                                "Ошибка при удалении поста: " + response.message
                            );
                        }
                    });
                }
        },
        post
    );
};

const loadCategories = async () => {
    try {
        const response = await optimizedRequest(http.categories);
        if (response.success && response.data) {
            categories.value = response.data;
        }
    } catch (error) {
        console.error("Error loading categories:", error);
    }
};

// Initialize infinite scroll
const initializeInfiniteScroll = () => {
    console.log('Initializing infinite scroll');
    
    const observer = createObserver(loadMorePosts);
    if (observer && infiniteScrollTrigger.value) {
        console.log('Observer created and observing trigger element');
        observer.observe(infiniteScrollTrigger.value);
    } else {
        console.warn('Failed to initialize infinite scroll - observer:', !!observer, 'trigger:', !!infiniteScrollTrigger.value);
    }
};

watch(refreshTrigger, async () => {
    if (refreshTrigger && refreshTrigger.value > 0) {
        currentPage.value = 1;
        hasMore.value = true;
        await postsService({ page: 1 });
        await loadCategories();
    }
});

onMounted(async () => {
    await initializeFavorites(); // Инициализируем избранное
    await postsService({ page: 1 });
    await loadCategories();
    
    // Initialize infinite scroll after component is mounted
    await nextTick();
    initializeInfiniteScroll();
});

// Watch for changes in hasMore to reinitialize observer
watch(hasMore, async () => {
    if (hasMore.value) {
        await nextTick();
        initializeInfiniteScroll();
    }
});
</script>
