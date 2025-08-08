import { reactive } from "vue";

export function useApiCache() {
    const cache = reactive(new Map());
    const pendingRequests = reactive(new Map());

    let searchDebounceTimer = null;
    const mediaCache = new Map();

    const createCacheKey = (endpoint, params) => {
        const sortedParams = Object.keys(params || {})
            .sort()
            .map((key) => `${key}:${params[key]}`)
            .join("&");
        return `${endpoint}?${sortedParams}`;
    };

    const isCacheValid = (timestamp, cacheTime) => {
        return Date.now() - timestamp < cacheTime;
    };

    const optimizedRequest = async (apiFunction, params = {}, options = {}) => {
        const {
            useCache = true,
            cacheTime = 5 * 60 * 1000, // 5 минут по умолчанию
            forceRefresh = false,
        } = options;

        const cacheKey = createCacheKey(apiFunction.name || "fn", params);

        if (useCache && !forceRefresh && cache.has(cacheKey)) {
            const cachedData = cache.get(cacheKey);
            if (isCacheValid(cachedData.timestamp, cacheTime)) {
                return cachedData.data;
            }
        }

        if (pendingRequests.has(cacheKey)) {
            return pendingRequests.get(cacheKey);
        }

        const requestPromise = new Promise((resolve, reject) => {
            if (typeof apiFunction === "function") {
                try {
                    const successCallback = (response) => {
                        if (response && response.success) {
                            if (useCache) {
                                cache.set(cacheKey, {
                                    data: response,
                                    timestamp: Date.now(),
                                    ttl: cacheTime,
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

    const debouncedSearch = (searchFunction, delay = 500, controller) => {
        return new Promise((resolve, reject) => {
            if (searchDebounceTimer) clearTimeout(searchDebounceTimer);

            searchDebounceTimer = setTimeout(async () => {
                try {
                    if (controller?.signal?.aborted) {
                        return reject(
                            new DOMException("Aborted", "AbortError")
                        );
                    }
                    const result = await searchFunction();
                    resolve(result);
                } catch (err) {
                    reject(err);
                }
            }, delay);

            controller?.signal?.addEventListener(
                "abort",
                () => {
                    clearTimeout(searchDebounceTimer);
                    reject(new DOMException("Aborted", "AbortError"));
                },
                { once: true }
            );
        });
    };

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

    const cleanupCache = (now = Date.now()) => {
        for (const [key, value] of cache) {
            const ttl = value.ttl ?? 5 * 60 * 1000;
            if (now - value.timestamp > ttl) {
                cache.delete(key);
            }
        }
    };

    setInterval(() => cleanupCache(), 60 * 1000); // очистка каждый минут на основе TTL

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
