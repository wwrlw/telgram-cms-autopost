<template>
    <div class="min-h-screen bg-gray-50" data-posts-component>
        <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <StatsCards
                v-if="!loading || posts.length > 0"
                :totalCount="totalCount"
                :data="posts"
                type="posts"
                :todayCount="todayCount"
            />

            <Search
                :loading="loading"
                :posts="posts"
                :model-value="searchQuery"
                @update:searchQuery="handleSearchChange"
            />

            <Filters
                :loading="loading"
                :posts="posts"
                :categories="categories"
                :showChannelFilter="false"
                :status-filter-value="statusFilter"
                :category-filter-value="categoryFilter"
                :channel-filter-value="channelFilter"
                :date-from-filter-value="dateFromFilter"
                :date-to-filter-value="dateToFilter"
                :sort-field-value="sortField"
                :sort-order-value="sortOrder"
                @update:searchQuery="handleSearchChange"
                @update:statusFilter="handleStatusFilterChange"
                @update:categoryFilter="handleCategoryFilterChange"
                @update:channelFilter="handleChannelFilterChange"
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

            <div
                v-if="hasMore && !loading"
                ref="infiniteScrollTrigger"
                class="h-20 flex items-center justify-center"
            ></div>

            <div v-if="infiniteScrollLoading" class="flex justify-center py-8">
                <LoadingSpinner size="medium" text="Загружаем еще посты..." />
            </div>
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
import {
    ref,
    onMounted,
    onUnmounted,
    inject,
    watch,
    nextTick,
    onActivated,
    onDeactivated,
} from "vue";
import http from "@/js/http";
import StatsCards from "@/components/StatsCards.vue";
import Filters from "@/components/Shared/Filters.vue";
import Thumbs from "@/components/Thumb/Thumbs.vue";
import Search from "@/components/Shared/Search.vue";
import LoadingSpinner from "@/components/Shared/LoadingSpinner.vue";
import ConfirmModal from "@/components/Modal/ConfirmModal.vue";
import { useInfiniteScroll } from "@/composables/useInfiniteScroll";
import { useApiCache } from "@/composables/useApiCache";
import { useFavorites } from "@/composables/useFavorites.js";
import { useEventBus, EVENTS } from "@/composables/useEventBus";
import { useUrlParams } from "@/composables/useUrlParams.js";

const refreshTrigger = inject("refreshTrigger", ref(0));
const setLoading = inject("setLoading");
const { removePublishedFromFavorites, initializeFavorites } = useFavorites();
const { on: onEvent, emit: emitEvent } = useEventBus();

// Используем URL параметры
const {
    searchQuery,
    statusFilter,
    categoryFilter,
    channelFilter,
    dateFromFilter,
    dateToFilter,
    sortField,
    sortOrder,
    page,
    updateParam,
    clearAllFilters,
    getApiParams,
    hasActiveFilters
} = useUrlParams();

const posts = ref([]);
const showPublishModal = ref(false);
const selectedPostForPublish = ref(null);
const loading = ref(false);
const infiniteScrollLoading = ref(false);
const totalCount = ref(0);
const categories = ref([]);
const todayCount = ref(0);

const force = ref(false);
const infiniteScrollTrigger = ref(null);

const { createObserver, destroy } = useInfiniteScroll();

const { optimizedRequest, debouncedSearch } = useApiCache();

const currentPage = ref(1);
const hasMore = ref(true);
const pageSize = 24;

const savedScrollTop = ref(0);
const getScroller = () => document.getElementById("app-scroller");

const loadTodayCount = async () => {
    try {
        return new Promise((resolve, reject) => {
            http.getPostsStatsToday(
                (response) => {
                    if (response.success) {
                        todayCount.value = response.data;
                    }
                    resolve(response);
                },
                (error) => {
                    console.error("Error loading today posts count:", error);
                    reject(error);
                }
            );
        });
    } catch (error) {
        console.error("Error loading today posts count:", error);
    }
};

const postsService = async (
    params = {},
    isInfiniteScroll = false,
    options = {}
) => {
    if (isInfiniteScroll) {
        infiniteScrollLoading.value = true;
    } else {
        loading.value = true;
        if (setLoading) setLoading(true);
    }

    try {
        // Получаем параметры из URL
        const urlParams = getApiParams();
        
        const requestParams = {
            ...urlParams,
            page: params.page || urlParams.page || currentPage.value,
            limit: params.limit || pageSize,
            lastId: params.lastId || undefined,
        };

        Object.keys(requestParams).forEach((key) => {
            if (requestParams[key] === undefined) {
                delete requestParams[key];
            }
        });

        const apiMethod = isInfiniteScroll
            ? http.postsInfiniteScroll
            : http.posts;
        const response = await optimizedRequest(
            apiMethod,
            requestParams,
            options
        );

        if (isInfiniteScroll) {
            const newPosts = response.data || [];
            posts.value = [...posts.value, ...newPosts];
            currentPage.value++;

            hasMore.value = response.params?.hasMore || false;
        } else {
            posts.value = response.data || [];
            currentPage.value = (requestParams.page || 1) + 1;
        }

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
        if (isInfiniteScroll) {
            infiniteScrollLoading.value = false;
        } else {
            loading.value = false;
            if (setLoading) setLoading(false);
        }
        throw error;
    }
};

const loadMorePosts = async () => {
    if (!hasMore.value || infiniteScrollLoading.value) {
        return;
    }

    try {
        const lastPost = posts.value[posts.value.length - 1];
        const lastId = lastPost?._id;

        await postsService(
            {
                page: currentPage.value,
                lastId: lastId,
            },
            true
        );
    } catch (error) {
        console.error("Error loading more posts:", error);
    }
};

const handleSearchChange = async (query) => {
    updateParam('search', query);
    await debouncedSearch(async () => {
        currentPage.value = 1;
        hasMore.value = true;
        await postsService({ page: 1 });
        const el = getScroller();
        if (el) el.scrollTop = 0;
    }, 500);
};

const handleStatusFilterChange = async (status) => {
    updateParam('status', status);
    currentPage.value = 1;
    hasMore.value = true;
    await postsService({ page: 1 });
    const el = getScroller();
    if (el) el.scrollTop = 0;
};

const handleCategoryFilterChange = async (categoryId) => {
    updateParam('category', categoryId);
    currentPage.value = 1;
    hasMore.value = true;
    await postsService({ page: 1 });
    const el = getScroller();
    if (el) el.scrollTop = 0;
};

const handleChannelFilterChange = async (channelId) => {
    updateParam('channel', channelId);
    currentPage.value = 1;
    hasMore.value = true;
    await postsService({ page: 1 });
    const el = getScroller();
    if (el) el.scrollTop = 0;
};

const handleDateFiltersChange = async (dateFilters) => {
    updateParam('date_from', dateFilters.dateFrom);
    updateParam('date_to', dateFilters.dateTo);
    debouncedSearch(async () => {
        currentPage.value = 1;
        hasMore.value = true;
        await postsService({ page: 1 });
        const el = getScroller();
        if (el) el.scrollTop = 0;
    }, 3000);
};

const handleSortOptionsChange = async (sortOptions) => {
    updateParam('sort_field', sortOptions.sortField);
    updateParam('sort_order', sortOptions.sortOrder);
    currentPage.value = 1;
    hasMore.value = true;
    await postsService({ page: 1 });
    const el = getScroller();
    if (el) el.scrollTop = 0;
};

const handleClearFilters = async () => {
    clearAllFilters();
    currentPage.value = 1;
    hasMore.value = true;
    await postsService({ page: 1 });
    const el = getScroller();
    if (el) el.scrollTop = 0;
};

const handlePublish = (post) => {
    selectedPostForPublish.value = post;
    showPublishModal.value = true;
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
        async (postObj) => {
            try {
                if (postObj.is_published && postObj.telegram_message_id) {
                    const tgRes = await new Promise((resolve) => {
                        http.deletePostFromTelegram(
                            postObj._id.toString(),
                            resolve
                        );
                    });

                    if (!tgRes.success) {
                        window.$toast.error(
                            "Ошибка при удалении из Telegram: " + tgRes.message
                        );
                    }
                }

                const response = await new Promise((resolve) => {
                    http.deletePost({ id: postObj._id }, resolve);
                });

                if (response.success) {
                    window.$toast.success(
                        postObj.is_published && postObj.telegram_message_id
                            ? "Пост успешно удалён (и из Telegram, если был опубликован)"
                            : "Пост успешно удалён"
                    );

                    const index = posts.value.findIndex(
                        (p) => p._id === postObj._id
                    );
                    if (index !== -1) {
                        posts.value.splice(index, 1);
                    }

                    totalCount.value = Math.max(0, totalCount.value - 1);

                    emitEvent(EVENTS.POST_DELETED, postObj);

                    currentPage.value = 1;
                    hasMore.value = true;
                    await postsService({ page: 1 });
                } else {
                    window.$toast.error(
                        "Ошибка при удалении поста: " + response.message
                    );
                }
            } catch (error) {
                console.error("Error deleting post:", error);
                window.$toast.error("Произошла ошибка при удалении поста");
            }
        },
        post
    );
};

const loadCategories = async () => {
    try {
        const response = await optimizedRequest(
            http.categories,
            {},
            force.value ? { force: true, useCache: false } : {}
        );
        if (response.success && response.data) {
            categories.value = response.data;
        }
        console.log(categories.value);
    } catch (error) {
        console.error("Error loading categories:", error);
    }
};

const initializeInfiniteScroll = () => {
    destroy();
    const observer = createObserver(loadMorePosts);
    if (observer && infiniteScrollTrigger.value) {
        observer.observe(infiniteScrollTrigger.value);
    }
};

watch(
    refreshTrigger,
    async () => {
        currentPage.value = 1;
        hasMore.value = true;
        await postsService({ page: 1 }, false, {
            forceRefresh: refreshTrigger.value > 0,
            useCache: refreshTrigger.value === 0,
        });
        await loadTodayCount();
        initializeInfiniteScroll();
    },
    { immediate: true }
);

onMounted(async () => {
    await initializeFavorites();
    await loadCategories();
    await nextTick();

    const autoRefreshInterval = setInterval(async () => {
        try {
            if (!document.hidden && !loading.value) {
                await postsService({ page: 1 }, false, {
                    forceRefresh: false,
                    useCache: true,
                });
            }
        } catch (error) {
            console.error("Auto refresh error:", error);
        }
    }, 60000);

    onEvent(EVENTS.POST_CREATED, async () => {
        currentPage.value = 1;
        hasMore.value = true;
        await postsService({ page: 1 });
    });

    onEvent(EVENTS.POST_UPDATED, async () => {
        currentPage.value = 1;
        hasMore.value = true;
        await postsService({ page: 1 });
    });

    onEvent(EVENTS.POST_DELETED, async () => {
        currentPage.value = 1;
        hasMore.value = true;
        await postsService({ page: 1 });
    });

    onEvent(EVENTS.POST_PUBLISHED, async () => {
        currentPage.value = 1;
        hasMore.value = true;
        await postsService({ page: 1 });
    });

    onEvent(EVENTS.REFRESH_POSTS, async () => {
        currentPage.value = 1;
        hasMore.value = true;
        await postsService({ page: 1 });
        await loadTodayCount();
    });

    onUnmounted(() => {
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval);
        }
    });
});

watch(loading, async (val) => {
    if (!val && hasMore.value) {
        await nextTick();
        initializeInfiniteScroll();
    }
});

onDeactivated(() => {
    const el = getScroller();
    if (el) savedScrollTop.value = el.scrollTop;
    destroy();
});

onActivated(async () => {
    const el = getScroller();
    if (el) el.scrollTop = savedScrollTop.value || 0;
    await nextTick();
    initializeInfiniteScroll();
});
</script>
