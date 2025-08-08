<template>
    <div class="min-h-screen bg-gray-50" data-posts-component>
        <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div v-if="canManagePosts" class="mb-6 p-4 bg-white shadow rounded">
                <h3 class="text-lg font-semibold mb-3">
                    Очистка старых постов
                </h3>
                <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                    <div>
                        <label class="block text-sm text-gray-600 mb-1"
                            >Порог (threshold)</label
                        >
                        <input
                            type="number"
                            v-model.number="cleanupThreshold"
                            class="w-full border rounded px-3 py-2"
                            min="0"
                        />
                    </div>
                    <div>
                        <label class="block text-sm text-gray-600 mb-1"
                            >Удалить (removeCount)</label
                        >
                        <input
                            type="number"
                            v-model.number="cleanupRemoveCount"
                            class="w-full border rounded px-3 py-2"
                            min="1"
                        />
                    </div>
                    <div class="flex items-center space-x-2">
                        <input
                            id="dryrun"
                            type="checkbox"
                            v-model="cleanupDryRun"
                        />
                        <label for="dryrun" class="text-sm text-gray-700"
                            >Dry run</label
                        >
                    </div>
                    <div>
                        <button
                            @click="confirmCleanup"
                            class="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                        >
                            Запустить очистку
                        </button>
                    </div>
                </div>
            </div>
            <StatsCards
                v-if="!loading || posts.length > 0"
                :totalCount="totalCount"
                :data="posts"
                type="posts"
                :stats="postsStats"
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
import { ref, onMounted, inject, watch, nextTick, computed } from "vue";
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
import { getToken } from "@/js/http";

const refreshTrigger = inject("refreshTrigger", ref(0));
const setLoading = inject("setLoading");
const { removePublishedFromFavorites, initializeFavorites } = useFavorites();
const { on: onEvent, emit: emitEvent } = useEventBus();

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
const postsStats = ref({
    total: 0,
    unique: 0,
    today: 0,
});

const force = ref(false);
const infiniteScrollTrigger = ref(null);

const { createObserver, destroy } = useInfiniteScroll();

const { optimizedRequest, debouncedSearch } = useApiCache();

const currentPage = ref(1);
const hasMore = ref(true);
const pageSize = 24;

// Cleanup UI state
const cleanupThreshold = ref(2500);
const cleanupRemoveCount = ref(500);
const cleanupDryRun = ref(false);

// Permission check (simple: rely on server to enforce; optionally hide for non-admins)
const canManagePosts = computed(() => true);

const confirmCleanup = () => {
    const message = `Запустить очистку?\nthreshold=${cleanupThreshold.value}, removeCount=${cleanupRemoveCount.value}, dryRun=${cleanupDryRun.value}`;
    showConfirm(message, async () => {
        try {
            const res = await new Promise((resolve, reject) => {
                http.cleanupPosts(
                    {
                        threshold: cleanupThreshold.value,
                        removeCount: cleanupRemoveCount.value,
                        dryRun: cleanupDryRun.value,
                    },
                    resolve,
                    reject
                );
            });
            if (res.success) {
                window.$toast?.success(
                    `Готово. Всего до: ${res.data.totalBefore}, будет удалено: ${res.data.toDelete}, удалено: ${res.data.deleted}, ошибок файлов: ${res.data.errors}`
                );
                // Обновим список и статистику
                currentPage.value = 1;
                hasMore.value = true;
                await postsService({ page: 1 });
                await loadPostsStats();
            } else {
                window.$toast?.error(res.message || "Ошибка очистки");
            }
        } catch (e) {
            window.$toast?.error("Ошибка запроса очистки");
        }
    });
};

const loadPostsStats = async () => {
    try {
        return new Promise((resolve, reject) => {
            http.getPostsStats(
                (response) => {
                    if (response.success) {
                        postsStats.value = response.data;
                    }
                    resolve(response);
                },
                (error) => {
                    console.error("Error loading posts stats:", error);
                    reject(error);
                }
            );
        });
    } catch (error) {
        console.error("Error loading posts stats:", error);
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

            // Обновляем hasMore из ответа API
            hasMore.value = response.params?.hasMore || false;
        } else {
            posts.value = response.data || [];
            currentPage.value = 1;
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
        // Получаем ID последнего поста для курсорной пагинации
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
        if (refreshTrigger && refreshTrigger.value > 0) {
            currentPage.value = 1;
            hasMore.value = true;
            await postsService({ page: 1 }, false, {
                forceRefresh: true,
                useCache: false,
            });
            await loadPostsStats();
            initializeInfiniteScroll();
        }
    },
    { immediate: true }
);

onMounted(async () => {
    await initializeFavorites();
    await postsService({ page: 1 });
    await loadCategories();
    await loadPostsStats();

    await nextTick();
    initializeInfiniteScroll();

    onEvent(EVENTS.POST_CREATED, async () => {
        currentPage.value = 1;
        hasMore.value = true;
        await postsService({ page: 1 });
        await loadPostsStats();
    });

    onEvent(EVENTS.POST_UPDATED, async () => {
        currentPage.value = 1;
        hasMore.value = true;
        await postsService({ page: 1 });
        await loadPostsStats();
    });

    onEvent(EVENTS.POST_DELETED, async () => {
        currentPage.value = 1;
        hasMore.value = true;
        await postsService({ page: 1 });
        await loadPostsStats();
    });

    onEvent(EVENTS.POST_PUBLISHED, async () => {
        currentPage.value = 1;
        hasMore.value = true;
        await postsService({ page: 1 });
        await loadPostsStats();
    });

    onEvent(EVENTS.REFRESH_POSTS, async () => {
        currentPage.value = 1;
        hasMore.value = true;
        await postsService({ page: 1 });
        await loadPostsStats();
    });
});

watch(loading, async (val) => {
    if (!val && hasMore.value) {
        await nextTick();
        initializeInfiniteScroll();
    }
});
</script>
