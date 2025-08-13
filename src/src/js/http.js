import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL || "https://tg.chiorio.com/api";

const instance = axios.create({
    baseURL: apiUrl,
});

instance.interceptors.response.use(
    (response) => {
        if (response.data.error) {
            if (response.data.codes && response.data.codes.field == "notify") {
                window._notify(
                    "error",
                    window._t(
                        response.data.codes.code,
                        response.data.codes.info || {}
                    )
                );
            }
        }
        return response;
    },
    (error) => {
        // Check if user is banned
        if (
            error.response &&
            error.response.status === 403 &&
            error.response.data &&
            error.response.data.code === "USER_BANNED"
        ) {
            console.warn("User is banned, logging out...");
            
            // Clear token and role
            localStorage.removeItem("token");
            localStorage.removeItem("role");
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("role");
            
            // Show notification about ban
            if (window.$toast) {
                window.$toast.error("Ваш аккаунт заблокирован", 10000);
            }
            
            // Redirect to login page
            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
            
            return Promise.reject(error);
        }

        // Check if user is not found in database
        if (
            error.response &&
            error.response.status === 404 &&
            error.response.data &&
            error.response.data.code === "USER_NOT_FOUND"
        ) {
            console.warn("User not found in database, logging out...");
            
            // Clear token and role
            localStorage.removeItem("token");
            localStorage.removeItem("role");
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("role");
            
            // Show notification
            if (window.$toast) {
                window.$toast.error("Пользователь не найден в базе данных", 10000);
            }
            
            // Redirect to login page
            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
            
            return Promise.reject(error);
        }

        // Check if user provided invalid password (don't logout for this)
        if (
            error.response &&
            error.response.status === 400 &&
            error.response.data &&
            error.response.data.code === "INVALID_PASSWORD"
        ) {
            console.warn("Invalid password provided, not logging out");
            // Don't clear localStorage or redirect for invalid password
            return Promise.reject(error);
        }
        
        // If backend responds with 403 and provides updated role info, refresh localStorage role
        try {
            if (
                error.response &&
                error.response.status === 403 &&
                error.response.data &&
                error.response.data.debug &&
                error.response.data.debug.actualRole
            ) {
                const newRole = error.response.data.debug.actualRole;
                if (newRole) {
                    localStorage.setItem("role", newRole);
                    // Trigger manual storage event so same-tab listeners update
                    window.dispatchEvent(new Event("storage"));
                }
            }
        } catch (e) {
            console.error("Error handling 403 role update:", e);
        }
        return Promise.reject(error);
    }
);

instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

let http = {
    instance: instance,
    posts: function (params = {}, callback, errorCallback) {
        const queryParams = new URLSearchParams();

        for (const key in params) {
            if (params[key] !== undefined) {
                queryParams.append(key, params[key]);
            }
        }

        const url = queryParams.toString()
            ? `/posts?${queryParams.toString()}`
            : "/posts";

        instance
            .get(url)
            .then((res) => {
                callback(res.data);
            })
            .catch((err) => {
                if (errorCallback) errorCallback(err);
            });
    },
    postsInfiniteScroll: function (params = {}, callback, errorCallback) {
        const queryParams = new URLSearchParams();

        for (const key in params) {
            if (params[key] !== undefined) {
                queryParams.append(key, params[key]);
            }
        }

        const url = queryParams.toString()
            ? `/posts/infinite-scroll?${queryParams.toString()}`
            : "/posts/infinite-scroll";

        instance
            .get(url)
            .then((res) => {
                console.log("Infinite scroll response:", res.data);
                callback(res.data);
            })
            .catch((err) => {
                console.error("Infinite scroll error:", err);
                if (errorCallback) errorCallback(err);
            });
    },
    getPostsStats: function (callback, errorCallback) {
        instance
            .get("/posts/stats")
            .then((res) => {
                callback(res.data);
            })
            .catch((err) => {
                if (errorCallback) errorCallback(err);
            });
    },
    post: function (params, callback) {
        instance
            .get(`/post/${params.id}`)
            .then((res) => {
                callback(res.data);
            })
            .catch((err) => {
                callback({ success: false, message: err });
            });
    },
    login: function (params, callback) {
        instance
            .post("/auth/login", params)
            .then((res) => {
                callback(res.data);
            })
            .catch((err) => {
                // Проверяем, является ли ошибка связанной с тем, что пользователь не найден
                if (err.response?.status === 404 && err.response?.data?.code === 'USER_NOT_FOUND') {
                    console.warn('User not found in database, clearing localStorage...');
                    
                    // Очищаем токен и роль
                    localStorage.removeItem("token");
                    localStorage.removeItem("role");
                    sessionStorage.removeItem("token");
                    sessionStorage.removeItem("role");
                    
                    // Показываем уведомление
                    if (window.$toast) {
                        window.$toast.error("Пользователь не найден в базе данных", 10000);
                    }
                }
                
                // Проверяем, является ли ошибка связанной с неправильным паролем
                if (err.response?.status === 400 && err.response?.data?.code === 'INVALID_PASSWORD') {
                    // Не очищаем localStorage для неправильного пароля
                    console.warn('Invalid password provided');
                }
                
                const errorMessage =
                    err.response?.data?.message || "Network error occurred";
                callback({ success: false, message: errorMessage });
            });
    },
    register: function (params, callback) {
        instance
            .post("/auth/register", params)
            .then((res) => {
                callback(res.data);
            })
            .catch((err) => {
                const errorMessage =
                    err.response?.data?.message || "Registration failed";
                callback({ success: false, message: errorMessage });
            });
    },

    channels: function (params = {}, callback, errorCallback) {
        const queryParams = new URLSearchParams();
        for (const key in params) {
            if (params[key] !== undefined) {
                queryParams.append(key, params[key]);
            }
        }
        const url = queryParams.toString()
            ? `/channels?${queryParams.toString()}`
            : "/channels";

        instance
            .get(url)
            .then((res) => {
                callback(res.data);
            })
            .catch((err) => {
                if (errorCallback) errorCallback(err);
                else
                    callback({
                        success: false,
                        message: "Failed to load channels",
                    });
            });
    },

    createChannel: function (params, callback) {
        instance
            .post("/channels", params)
            .then((res) => {
                callback(res.data);
            })
            .catch((err) => {
                const errorMessage =
                    err.response?.data?.message || "Failed to create channel";
                callback({ success: false, message: errorMessage });
            });
    },

    updateChannel: function (params, callback) {
        const { id, ...updateData } = params;
        instance
            .put(`/channels/${id}`, updateData)
            .then((res) => {
                callback(res.data);
            })
            .catch((err) => {
                const errorMessage =
                    err.response?.data?.message || "Failed to update channel";
                callback({ success: false, message: errorMessage });
            });
    },

    deleteChannel: function (params, callback) {
        instance
            .delete(`/channels/${params.id}`)
            .then((res) => {
                callback(res.data);
            })
            .catch((err) => {
                const errorMessage =
                    err.response?.data?.message || "Failed to delete channel";
                callback({ success: false, message: errorMessage });
            });
    },

    categories: function (callback, errorCallback) {
        instance
            .get("/categories")
            .then((res) => {
                callback(res.data);
            })
            .catch((err) => {
                if (errorCallback) errorCallback(err);
                else
                    callback({
                        success: false,
                        message: "Failed to load categories",
                    });
            });
    },

    createCategory: function (params, callback) {
        instance
            .post("/categories", params)
            .then((res) => {
                callback(res.data);
            })
            .catch((err) => {
                const errorMessage =
                    err.response?.data?.message || "Failed to create category";
                callback({ success: false, message: errorMessage });
            });
    },

    updateCategory: function (params, callback) {
        const { id, ...updateData } = params;
        instance
            .put(`/categories/${id}`, updateData)
            .then((res) => {
                callback(res.data);
            })
            .catch((err) => {
                const errorMessage =
                    err.response?.data?.message || "Failed to update category";
                callback({ success: false, message: errorMessage });
            });
    },

    deleteCategory: function (params, callback) {
        instance
            .delete(`/categories/${params.id}`)
            .then((res) => {
                callback(res.data);
            })
            .catch((err) => {
                const errorMessage =
                    err.response?.data?.message || "Failed to delete category";
                callback({ success: false, message: errorMessage });
            });
    },

    deletePost: function (params, callback) {
        console.log("deletePost called with params:", params);
        instance
            .delete(`/post/${params.id}`)
            .then((res) => {
                console.log("deletePost success response:", res.data);
                callback(res.data);
            })
            .catch((err) => {
                console.error("deletePost error:", err);
                console.error("deletePost error response:", err.response);
                const errorMessage =
                    err.response?.data?.message || "Failed to delete post";
                callback({ success: false, message: errorMessage });
            });
    },

    getPostedChannels: function (callback) {
        instance
            .get("/posted-channels/active")
            .then((res) => {
                callback(res.data);
            })
            .catch((err) => {
                const errorMessage =
                    err.response?.data?.message ||
                    "Failed to load posted channels";
                callback({ success: false, message: errorMessage });
            });
    },

    publishToChannel: function (postId, channelId, callback) {
        instance
            .post(`/publish/${postId}/${channelId}`)
            .then((res) => {
                callback(res.data);
            })
            .catch((err) => {
                const errorMessage =
                    err.response?.data?.message ||
                    "Failed to publish post to channel";
                callback({ success: false, message: errorMessage });
            });
    },

    deletePostFromTelegram: function (postId, callback) {
        instance
            .delete(`/publish/${postId}`)
            .then((res) => {
                callback(res.data);
            })
            .catch((err) => {
                const errorMessage =
                    err.response?.data?.message ||
                    "Failed to delete post from Telegram";
                callback({ success: false, message: errorMessage });
            });
    },

    getPublicationChannels: function (callback, errorCallback) {
        instance
            .get("/posted-channels")
            .then((res) => {
                callback(res.data);
            })
            .catch((err) => {
                if (errorCallback) errorCallback(err);
                else
                    callback({
                        success: false,
                        message: "Failed to load publication channels",
                    });
            });
    },

    getActivePublicationChannels: function (callback, errorCallback) {
        instance
            .get("/posted-channels/active")
            .then((res) => {
                callback(res.data);
            })
            .catch((err) => {
                if (errorCallback) errorCallback(err);
                else
                    callback({
                        success: false,
                        message: "Failed to load active publication channels",
                    });
            });
    },

    createPublicationChannel: function (params, callback) {
        instance
            .post("/posted-channels", params)
            .then((res) => {
                callback(res.data);
            })
            .catch((err) => {
                const errorMessage =
                    err.response?.data?.message ||
                    "Failed to create publication channel";
                callback({ success: false, message: errorMessage });
            });
    },

    updatePublicationChannel: function (params, callback) {
        const { id, ...updateData } = params;
        instance
            .put(`/posted-channels/${id}`, updateData)
            .then((res) => {
                callback(res.data);
            })
            .catch((err) => {
                const errorMessage =
                    err.response?.data?.message ||
                    "Failed to update publication channel";
                callback({ success: false, message: errorMessage });
            });
    },

    deletePublicationChannel: function (params, callback) {
        instance
            .delete(`/posted-channels/${params.id}`)
            .then((res) => {
                callback(res.data);
            })
            .catch((err) => {
                const errorMessage =
                    err.response?.data?.message ||
                    "Failed to delete publication channel";
                callback({ success: false, message: errorMessage });
            });
    },

    schedulePost: function (params, callback) {
        instance
            .post(`/posts/${params.postId}/schedule`, {
                scheduled_at: params.scheduledAt,
                channel_id: params.channelId,
            })
            .then((res) => {
                callback(res.data);
                console.log(res.data);
            })
            .catch((err) => {
                const errorMessage =
                    err.response?.data?.message || "Failed to schedule post";
                callback({ success: false, message: errorMessage });
            });
    },

    getScheduledPosts: function (callback) {
        instance
            .get("/posts/scheduled")
            .then((res) => {
                callback(res.data);
            })
            .catch((err) => {
                const errorMessage =
                    err.response?.data?.message ||
                    "Failed to load scheduled posts";
                callback({ success: false, message: errorMessage });
            });
    },

    cancelScheduledPost: function (params, callback) {
        instance
            .delete(`/posts/${params.id}/schedule`)
            .then((res) => {
                callback(res.data);
            })
            .catch((err) => {
                console.error("HTTP cancelScheduledPost error:", err);
                const errorMessage =
                    err.response?.data?.message ||
                    "Failed to cancel scheduled post";
                callback({ success: false, message: errorMessage });
            });
    },

    getPublishedPosts: function (callback) {
        instance
            .get("/posts/published")
            .then((res) => {
                callback(res.data);
            })
            .catch((err) => {
                const errorMessage =
                    err.response?.data?.message ||
                    "Failed to load published posts";
                callback({ success: false, message: errorMessage });
            });
    },

    updatePost: function (params, callback) {
        const { id, ...updateData } = params;

        // Создаем FormData для отправки данных
        const formData = new FormData();

        // Добавляем текстовые поля
        if (updateData.text !== undefined) {
            formData.append("text", updateData.text);
        }
        if (updateData.is_unique !== undefined) {
            formData.append("is_unique", updateData.is_unique.toString());
        }
        if (updateData.url !== undefined) {
            formData.append("url", updateData.url);
        }
        if (updateData.channel_id !== undefined) {
            formData.append("channel_id", updateData.channel_id);
        }

        // Добавляем медиафайлы
        if (updateData.media && Array.isArray(updateData.media)) {
            updateData.media.forEach((media, index) => {
                formData.append(`media[${index}][type]`, media.type);
                formData.append(`media[${index}][file_path]`, media.file_path);
                if (media.original_name) {
                    formData.append(
                        `media[${index}][original_name]`,
                        media.original_name
                    );
                }
                if (media.mime_type) {
                    formData.append(
                        `media[${index}][mime_type]`,
                        media.mime_type
                    );
                }
            });
        }

        instance
            .put(`/posts/${id}`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            })
            .then((res) => {
                callback(res.data);
            })
            .catch((err) => {
                const errorMessage =
                    err.response?.data?.message || "Failed to update post";
                callback({ success: false, message: errorMessage });
            });
    },

    createPost: function (formData, cb, errCb) {
        instance
            .post("/posts", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            })
            .then((res) => {
                cb && cb(res.data);
            })
            .catch((err) => {
                errCb && errCb(err);
            });
    },

    uploadMedia: function (formData, callback, error) {
        instance
            .post("/media/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            })
            .then((res) => {
                callback && callback(res.data);
            })
            .catch((err) => {
                console.error("Upload media error:", err);
                const errorMessage =
                    err.response?.data?.message ||
                    err.message ||
                    "Ошибка загрузки файла";
                if (error) {
                    error({ success: false, message: errorMessage });
                } else {
                    callback &&
                        callback({ success: false, message: errorMessage });
                }
            });
    },

    getChannelAnalytics: function (channelId, callback, errorCallback) {
        console.log("getChannelAnalytics called with channelId:", channelId);
        console.log("Token from localStorage:", localStorage.getItem("token"));

        instance
            .get(`/analytics?channelid=${channelId}`)
            .then((res) => {
                console.log("Analytics API response:", res.data);
                callback(res.data);
            })
            .catch((err) => {
                console.error("Analytics API error:", err);
                if (errorCallback) errorCallback(err);
                else
                    callback({
                        success: false,
                        message: "Failed to load channel analytics",
                    });
            });
    },

    addFavoritePost: function (userId, postId, callback) {
        instance
            .post("/auth/favorites/add", { userId, postId })
            .then((res) => {
                callback(res.data);
            })
            .catch((err) => {
                const errorMessage =
                    err.response?.data?.message ||
                    "Failed to add favorite post";
                callback({ success: false, message: errorMessage });
            });
    },

    removeFavoritePost: function (userId, postId, callback) {
        instance
            .post("/auth/favorites/remove", { userId, postId })
            .then((res) => {
                callback(res.data);
            })
            .catch((err) => {
                const errorMessage =
                    err.response?.data?.message ||
                    "Failed to remove favorite post";
                callback({ success: false, message: errorMessage });
            });
    },

    getFavoritePosts: function (userId, callback) {
        instance
            .get(`/auth/favorites/${userId}`)
            .then((res) => {
                callback(res.data);
            })
            .catch((err) => {
                const errorMessage =
                    err.response?.data?.message ||
                    "Failed to load favorite posts";
                callback({ success: false, message: errorMessage });
            });
    },

    // Maintenance: cleanup old posts and media
    cleanupPosts: function (params = {}, callback, errorCallback) {
        const queryParams = new URLSearchParams();
        if (params.threshold !== undefined)
            queryParams.append("threshold", params.threshold);
        if (params.removeCount !== undefined)
            queryParams.append("removeCount", params.removeCount);
        if (params.dryRun !== undefined)
            queryParams.append("dryRun", params.dryRun);

        const url = queryParams.toString()
            ? `/posts/cleanup?${queryParams.toString()}`
            : "/posts/cleanup";

        instance
            .post(url)
            .then((res) => {
                callback(res.data);
            })
            .catch((err) => {
                if (errorCallback) errorCallback(err);
                else {
                    const msg = err.response?.data?.message || "Cleanup failed";
                    callback({ success: false, message: msg });
                }
            });
    },

    // User management endpoints (super_admin only)
    getAllUsers: function (callback, errorCallback) {
        instance
            .get("/auth/users")
            .then((res) => {
                callback(res.data);
            })
            .catch((err) => {
                if (errorCallback) errorCallback(err);
                else
                    callback({
                        success: false,
                        message: "Failed to load users",
                    });
            });
    },

    updateUserRole: function (userId, role, callback) {
        instance
            .put(`/auth/users/${userId}/role`, { role })
            .then((res) => {
                callback(res.data);
            })
            .catch((err) => {
                const errorMessage =
                    err.response?.data?.message || "Failed to update user role";
                callback({ success: false, message: errorMessage });
            });
    },

    banUser: function (userId, callback) {
        instance
            .post(`/auth/users/${userId}/ban`)
            .then((res) => {
                callback(res.data);
            })
            .catch((err) => {
                const errorMessage =
                    err.response?.data?.message || "Failed to ban user";
                callback({ success: false, message: errorMessage });
            });
    },

    unbanUser: function (userId, role, callback) {
        instance
            .post(`/auth/users/${userId}/unban`, { role })
            .then((res) => {
                callback(res.data);
            })
            .catch((err) => {
                const errorMessage =
                    err.response?.data?.message || "Failed to unban user";
                callback({ success: false, message: errorMessage });
            });
    },

    // Logs endpoints (super_admin only)
    getLogs: function (
        page = 1,
        limit = 50,
        sort = "desc",
        callback,
        errorCallback
    ) {
        instance
            .get(`/logs?page=${page}&limit=${limit}&sort=${sort}`)
            .then((res) => {
                callback(res.data);
            })
            .catch((err) => {
                if (errorCallback) errorCallback(err);
                else
                    callback({
                        success: false,
                        message: "Failed to load logs",
                    });
            });
    },

    getUserLogs: function (
        userId,
        page = 1,
        limit = 50,
        sort = "desc",
        callback,
        errorCallback
    ) {
        instance
            .get(
                `/logs/user/${userId}?page=${page}&limit=${limit}&sort=${sort}`
            )
            .then((res) => {
                callback(res.data);
            })
            .catch((err) => {
                if (errorCallback) errorCallback(err);
                else
                    callback({
                        success: false,
                        message: "Failed to load user logs",
                    });
            });
    },
};

export function getToken() {
    return localStorage.getItem("token") || sessionStorage.getItem("token");
}

export default http;
