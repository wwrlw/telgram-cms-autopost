import { ref, computed } from "vue";
import http from "@/js/http";

// Глобальное состояние для избранных постов
const favoritePosts = ref([]);
const isLoading = ref(false);
const isLoaded = ref(false);
const userId = ref(null);

// Загрузка пользователя
const loadUser = () => {
    try {
        const userData = localStorage.getItem("user");
        if (userData) {
            const user = JSON.parse(userData);
            userId.value = user.id;
        }
    } catch (error) {
        console.error("Error loading user data:", error);
        userId.value = null;
    }
};

// Загрузка избранных постов
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

// Проверка, является ли пост избранным
const isFavorite = (postId) => {
    return favoritePosts.value.includes(postId);
};

// Добавление поста в избранное
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

// Удаление поста из избранного
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

// Переключение избранного
const toggleFavorite = async (postId) => {
    if (isFavorite(postId)) {
        return await removeFromFavorites(postId);
    } else {
        return await addToFavorites(postId);
    }
};

// Инициализация
const initializeFavorites = async () => {
    loadUser();
    if (userId.value && !isLoaded.value) {
        await loadFavorites();
    }
};

export function useFavorites() {
    return {
        // State
        favoritePosts: computed(() => favoritePosts.value),
        isLoading: computed(() => isLoading.value),
        isLoaded: computed(() => isLoaded.value),
        userId: computed(() => userId.value),

        // Methods
        loadUser,
        loadFavorites,
        isFavorite,
        addToFavorites,
        removeFromFavorites,
        toggleFavorite,
        initializeFavorites,
    };
}
