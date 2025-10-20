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

const removePublishedFromFavorites = async (posts = []) => {
    if (!userId.value || !Array.isArray(posts) || posts.length === 0) return;

    const idsToRemove = posts
        .filter(
            (p) =>
                p &&
                p._id &&
                favoritePosts.value.includes(p._id) &&
                (p.is_published === true || !!p.telegram_message_id)
        )
        .map((p) => p._id);

    if (idsToRemove.length === 0) return;

    await Promise.all(
        idsToRemove.map(
            (postId) =>
                new Promise((resolve) => {
                    http.removeFavoritePost(userId.value, postId, (res) => {
                        if (res?.success) {
                            favoritePosts.value = favoritePosts.value.filter(
                                (id) => id !== postId
                            );
                        }
                        resolve(true);
                    });
                })
        )
    );
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
        removePublishedFromFavorites,
        toggleFavorite,
        initializeFavorites,
    };
}
