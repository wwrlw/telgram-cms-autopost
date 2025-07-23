<template>
    <div class="min-h-screen bg-gray-50">
        <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div class="mb-6">
                <h1 class="text-3xl font-bold text-gray-900">
                    Избранные посты
                </h1>
            </div>

            <div v-if="loading" class="flex justify-center items-center py-12">
                <div
                    class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
                ></div>
            </div>

            <div
                v-else-if="favoritePosts.length === 0"
                class="text-center py-12"
            >
                <div class="text-gray-500 text-lg mb-4">
                    <svg
                        class="w-16 h-16 mx-auto mb-4 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                        />
                    </svg>
                    <p>У вас пока нет избранных постов</p>
                </div>
                <router-link to="/" class="text-blue-600 hover:text-blue-800">
                    Перейти к постам
                </router-link>
            </div>

            <div
                v-else
                class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
                <PostThumb
                    v-for="post in favoritePosts"
                    :key="post._id"
                    :post="post"
                    :categories="categories"
                    @delete="deletePost"
                    @quickview="quickviewPost"
                    @remove-from-favorites="removeFromFavorites"
                />
            </div>
        </main>

        <ConfirmModal
            :show="showConfirmModal"
            :message="confirmMessage"
            @confirm="onConfirm"
            @cancel="onCancelConfirm"
        />

        <MediaViewer
            :show="showMediaViewer"
            :media="currentMedia"
            :current-index="currentMediaIndex"
            :total-count="favoritePosts[currentMediaIndex]?.media?.length || 0"
            :can-go-previous="canGoPrevious"
            :can-go-next="canGoNext"
            @close="closeMediaViewer"
            @previous="previousMedia"
            @next="nextMedia"
        />
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import http from "../js/http.js";
import PostThumb from "../components/PostThumb.vue";
import ConfirmModal from "../components/Modal/ConfirmModal.vue";
import MediaViewer from "../components/MediaViewer.vue";
import { useFavorites } from "@/composables/useFavorites.js";

// Используем composable для избранных постов
const { favoritePosts: favoritePostIds, initializeFavorites } = useFavorites();

// Reactive state
const favoritePosts = ref([]);
const categories = ref([]);
const loading = ref(true);
const showConfirmModal = ref(false);
const confirmMessage = ref("");
const confirmAction = ref(null);
const confirmPayload = ref(null);
const showMediaViewer = ref(false);
const currentMedia = ref(null);
const currentMediaIndex = ref(0);

// Computed properties
const canGoPrevious = computed(() => {
    if (
        !favoritePosts.value[currentMediaIndex.value]?.media?.length ||
        !currentMedia.value
    )
        return false;
    const mediaArr = favoritePosts.value[currentMediaIndex.value].media;
    const currentIdx = mediaArr.findIndex(
        (m) => m.file_path === currentMedia.value.file_path
    );
    return currentIdx > 0;
});

const canGoNext = computed(() => {
    if (
        !favoritePosts.value[currentMediaIndex.value]?.media?.length ||
        !currentMedia.value
    )
        return false;
    const mediaArr = favoritePosts.value[currentMediaIndex.value].media;
    const currentIdx = mediaArr.findIndex(
        (m) => m.file_path === currentMedia.value.file_path
    );
    return currentIdx < mediaArr.length - 1;
});

// Methods
const loadCategories = () => {
    http.categories((response) => {
        if (response.success) {
            categories.value = response.data || [];
        }
    });
};

const loadFavoritePostsData = async () => {
    if (!favoritePostIds.value || favoritePostIds.value.length === 0) {
        loading.value = false;
        return;
    }

    const promises = favoritePostIds.value.map((postId) => {
        return new Promise((resolve) => {
            http.post({ id: postId }, (response) => {
                if (response.success && response.data) {
                    resolve(response.data);
                } else {
                    resolve(null);
                }
            });
        });
    });

    Promise.all(promises).then((posts) => {
        favoritePosts.value = posts.filter((post) => post !== null);
        loading.value = false;
    });
};

const showConfirm = (message, action, payload = null) => {
    confirmMessage.value = message;
    confirmAction.value = action;
    confirmPayload.value = payload;
    showConfirmModal.value = true;
};

const onConfirm = () => {
    showConfirmModal.value = false;
    if (confirmAction.value) confirmAction.value(confirmPayload.value);
};

const onCancelConfirm = () => {
    showConfirmModal.value = false;
    confirmAction.value = null;
    confirmPayload.value = null;
};

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
                        if (window._notify) {
                            window._notify(
                                "error",
                                "Ошибка при удалении из Telegram: " +
                                    tgRes.message
                            );
                        }
                    }
                    http.deletePost({ id: postObj._id }, (response) => {
                        if (response.success) {
                            favoritePosts.value = favoritePosts.value.filter(
                                (post) => post._id !== postObj._id
                            );
                            if (window._notify) {
                                window._notify(
                                    "success",
                                    "Пост удалён (и из Telegram, если был опубликован)"
                                );
                            }
                        } else {
                            if (window._notify) {
                                window._notify(
                                    "error",
                                    "Ошибка при удалении поста: " +
                                        response.message
                                );
                            }
                        }
                    });
                });
            } else {
                http.deletePost({ id: postObj._id }, (response) => {
                    if (response.success) {
                        favoritePosts.value = favoritePosts.value.filter(
                            (post) => post._id !== postObj._id
                        );
                        if (window._notify) {
                            window._notify("success", "Пост удалён");
                        }
                    } else {
                        if (window._notify) {
                            window._notify(
                                "error",
                                "Ошибка при удалении поста: " + response.message
                            );
                        }
                    }
                });
            }
        },
        post
    );
};

const quickviewPost = (post) => {
    if (!post.media || !post.media.length) return;
    const idx = favoritePosts.value.findIndex((p) => p._id === post._id);
    if (idx === -1) return;
    currentMediaIndex.value = idx;
    currentMedia.value = post.media[0];
    showMediaViewer.value = true;
};

const closeMediaViewer = () => {
    showMediaViewer.value = false;
    currentMedia.value = null;
};

const previousMedia = () => {
    if (!favoritePosts.value[currentMediaIndex.value]?.media?.length) return;
    const mediaArr = favoritePosts.value[currentMediaIndex.value].media;
    const currentIdx = mediaArr.findIndex(
        (m) => m.file_path === currentMedia.value.file_path
    );
    if (currentIdx > 0) {
        currentMedia.value = mediaArr[currentIdx - 1];
    }
};

const nextMedia = () => {
    if (!favoritePosts.value[currentMediaIndex.value]?.media?.length) return;
    const mediaArr = favoritePosts.value[currentMediaIndex.value].media;
    const currentIdx = mediaArr.findIndex(
        (m) => m.file_path === currentMedia.value.file_path
    );
    if (currentIdx < mediaArr.length - 1) {
        currentMedia.value = mediaArr[currentIdx + 1];
    }
};

const removeFromFavorites = (postId) => {
    // Удаляем пост из списка избранных
    favoritePosts.value = favoritePosts.value.filter(
        (post) => post._id !== postId
    );
};

// Lifecycle
onMounted(async () => {
    await initializeFavorites();
    loadCategories();
    loadFavoritePostsData();
});

// Отслеживаем изменения в избранных постах
watch(
    favoritePostIds,
    () => {
        loadFavoritePostsData();
    },
    { deep: true }
);
</script>
