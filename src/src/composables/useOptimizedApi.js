import { ref, reactive } from "vue";

export function useOptimizedApi() {
    const cache = reactive(new Map());
    const pendingRequests = reactive(new Map());
    const requestQueue = [];

    // Дебаунсер для поиска
    let searchDebounceTimer = null;

    // Кэш для медиа файлов
    const mediaCache = new Map();

    // Функция для создания ключа кэша
    const createCacheKey = (endpoint, params) => {
        const sortedParams = Object.keys(params || {})
            .sort()
            .map((key) => `${key}:${params[key]}`)
            .join("&");
        return `${endpoint}?${sortedParams}`;
    };

    // Функция для проверки актуальности кэша (5 минут)
    const isCacheValid = (timestamp) => {
        return Date.now() - timestamp < 5 * 60 * 1000;
    };

    // Оптимизированный запрос с кэшированием
    const optimizedRequest = async (apiFunction, params = {}, options = {}) => {
        const {
            useCache = true,
            cacheTime = 5 * 60 * 1000, // 5 минут
            forceRefresh = false,
        } = options;

        const cacheKey = createCacheKey(apiFunction.name, params);

        // Проверяем кэш
        if (useCache && !forceRefresh && cache.has(cacheKey)) {
            const cachedData = cache.get(cacheKey);
            if (isCacheValid(cachedData.timestamp)) {
                return cachedData.data;
            }
        }

        // Проверяем, есть ли уже pending запрос
        if (pendingRequests.has(cacheKey)) {
            return pendingRequests.get(cacheKey);
        }

        // Создаем новый запрос
        const requestPromise = new Promise((resolve, reject) => {
            // Проверяем, ожидает ли функция callback
            if (typeof apiFunction === "function") {
                try {
                    // Создаем callback функции
                    const successCallback = (response) => {
                        if (response && response.success) {
                            // Сохраняем в кэш
                            if (useCache) {
                                cache.set(cacheKey, {
                                    data: response,
                                    timestamp: Date.now(),
                                });
                            }
                            resolve(response);
                        } else {
                            reject(
                                new Error(response?.message || "Request failed")
                            );
                        }
                    };

                    const errorCallback = (error) => {
                        reject(error);
                    };

                    // Вызываем функцию с правильными аргументами
                    if (Object.keys(params).length > 0) {
                        apiFunction(params, successCallback, errorCallback);
                    } else {
                        apiFunction(successCallback, errorCallback);
                    }
                } catch (error) {
                    reject(error);
                }
            } else {
                reject(new Error("apiFunction is not a function"));
            }
        });

        // Сохраняем pending запрос
        pendingRequests.set(cacheKey, requestPromise);

        try {
            const result = await requestPromise;
            pendingRequests.delete(cacheKey);
            return result;
        } catch (error) {
            pendingRequests.delete(cacheKey);
            throw error;
        }
    };

    // Дебаунсированный поиск
    const debouncedSearch = (searchFunction, delay = 500) => {
        return new Promise((resolve) => {
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => {
                searchFunction().then(resolve);
            }, delay);
        });
    };

    // Предзагрузка медиа
    const preloadMedia = (url) => {
        if (mediaCache.has(url)) {
            return Promise.resolve(mediaCache.get(url));
        }

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                mediaCache.set(url, img);
                resolve(img);
            };
            img.onerror = reject;
            img.src = url;
        });
    };

    // Очистка кэша
    const clearCache = (pattern = null) => {
        if (pattern) {
            for (const [key] of cache) {
                if (key.includes(pattern)) {
                    cache.delete(key);
                }
            }
        } else {
            cache.clear();
        }
    };

    // Очистка старых записей кэша
    const cleanupCache = () => {
        const now = Date.now();
        for (const [key, value] of cache) {
            if (now - value.timestamp > 10 * 60 * 1000) {
                // 10 минут
                cache.delete(key);
            }
        }
    };

    // Автоматическая очистка кэша каждые 5 минут
    setInterval(cleanupCache, 5 * 60 * 1000);

    return {
        optimizedRequest,
        debouncedSearch,
        preloadMedia,
        clearCache,
        cleanupCache,
        cache,
        pendingRequests,
    };
}
