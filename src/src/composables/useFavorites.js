import { ref, computed } from "vue";
import http from "@/js/http";

const favoritePosts = ref([]);
const isLoading = ref(false);
const isLoaded = ref(false);
const userId = ref(null);

const loadUser = () => {
    try {
        const userData = localStorage.getItem("user");
        if (userData) {
            const user = JSON.parse(userData);
            userId.value = user.id;
        }
    } catch (error) {
        userId.value = null;
        throw error;
    }
};

const loadFavorites = async () => {
    if (!userId.value || isLoading.value || isLoaded.value) return;

    isLoading.value = true;

    return new Promise((resolve) => {
        http.getFavoritePosts(userId.value, (response) => {
            if (response.success) {
                favoritePosts.value = response.data || [];
                isLoaded.value = true;
            } else {
                console.error(
                    "Failed to load favorite posts:",
                    response.message
                );
            }
            isLoading.value = false;
            resolve(response);
        });
    });
};

const isFavorite = (postId) => {
    return favoritePosts.value.includes(postId);
};

const addToFavorites = async (postId) => {
    if (!userId.value) {
        if (window._notify) {
            window._notify("error", "Необходимо войти в систему");
        }
        return false;
    }

    return new Promise((resolve) => {
        http.addFavoritePost(userId.value, postId, (response) => {
            if (response.success) {
                favoritePosts.value.push(postId);
                if (window._notify) {
                    window._notify("success", "Пост добавлен в избранное");
                }
                resolve(true);
            } else {
                if (window._notify) {
                    window._notify(
                        "error",
                        "Ошибка при добавлении в избранное"
                    );
                }
                resolve(false);
            }
        });
    });
};

const removeFromFavorites = async (postId) => {
    if (!userId.value) {
        if (window._notify) {
            window._notify("error", "Необходимо войти в систему");
        }
        return false;
    }

    return new Promise((resolve) => {
        http.removeFavoritePost(userId.value, postId, (response) => {
            if (response.success) {
                favoritePosts.value = favoritePosts.value.filter(
                    (id) => id !== postId
                );
                if (window._notify) {
                    window._notify("success", "Пост удалён из избранного");
                }
                resolve(true);
            } else {
                if (window._notify) {
                    window._notify(
                        "error",
                        "Ошибка при удалении из избранного"
                    );
                }
                resolve(false);
            }
        });
    });
};

const toggleFavorite = async (postId) => {
    if (isFavorite(postId)) {
        return await removeFromFavorites(postId);
    } else {
        return await addToFavorites(postId);
    }
};

const initializeFavorites = async () => {
    loadUser();
    if (userId.value && !isLoaded.value) {
        await loadFavorites();
    }
};

const removePublishedFromFavorites = async (posts) => {
    if (!userId.value || !posts || !Array.isArray(posts)) return;

    const publishedPostIds = posts
        .filter((post) => post.is_published && post.telegram_message_id)
        .map((post) => post._id);

    if (publishedPostIds.length === 0) return;

    for (const postId of publishedPostIds) {
        if (isFavorite(postId)) {
            await removeFromFavorites(postId);
        }
    }

    if (publishedPostIds.length > 0) {
        const count = publishedPostIds.length;
        const message =
            count === 1
                ? "1 опубликованный пост автоматически удален из избранного"
                : `${count} опубликованных постов автоматически удалены из избранного`;

        if (window._notify) {
            window._notify("info", message);
        }
    }
};

export function useFavorites() {
    return {
        favoritePosts: computed(() => favoritePosts.value),
        isLoading: computed(() => isLoading.value),
        isLoaded: computed(() => isLoaded.value),
        userId: computed(() => userId.value),

        loadUser,
        loadFavorites,
        isFavorite,
        addToFavorites,
        removeFromFavorites,
        toggleFavorite,
        initializeFavorites,
        removePublishedFromFavorites,
    };
}
