// Утилита для предзагрузки медиа файлов
class MediaPreloader {
    constructor() {
        this.cache = new Map();
        this.preloadQueue = [];
        this.isProcessing = false;
    }

    // Проверка и нормализация URL
    normalizeUrl(url) {
        if (!url || typeof url !== 'string') {
            return null;
        }

        // Убираем лишние пробелы
        url = url.trim();

        // Если URL относительный, добавляем базовый путь
        if (url.startsWith('/')) {
            const baseUrl = import.meta.env.VITE_API_URL || 'https://tg.chiorio.com';
            url = `${baseUrl}${url}`;
        }

        // Проверяем, что URL валидный
        try {
            new URL(url);
            return url;
        } catch (error) {
            console.warn('Invalid URL:', url);
            return null;
        }
    }

    // Предзагрузка изображения
    preloadImage(url) {
        return new Promise((resolve, reject) => {
            const normalizedUrl = this.normalizeUrl(url);
            if (!normalizedUrl) {
                reject(new Error('Invalid URL'));
                return;
            }

            if (this.cache.has(normalizedUrl)) {
                resolve(this.cache.get(normalizedUrl));
                return;
            }

            const img = new Image();
            
            // Устанавливаем таймаут для загрузки
            const timeout = setTimeout(() => {
                img.src = '';
                reject(new Error('Image load timeout'));
            }, 10000); // 10 секунд таймаут

            img.onload = () => {
                clearTimeout(timeout);
                this.cache.set(normalizedUrl, img);
                resolve(img);
            };
            
            img.onerror = (error) => {
                clearTimeout(timeout);
                console.warn('Failed to preload image:', normalizedUrl, error);
                reject(error);
            };
            
            img.src = normalizedUrl;
        });
    }

    // Предзагрузка видео
    preloadVideo(url) {
        return new Promise((resolve, reject) => {
            const normalizedUrl = this.normalizeUrl(url);
            if (!normalizedUrl) {
                reject(new Error('Invalid URL'));
                return;
            }

            if (this.cache.has(normalizedUrl)) {
                resolve(this.cache.get(normalizedUrl));
                return;
            }

            const video = document.createElement('video');
            video.muted = true;
            video.preload = 'metadata';
            
            // Устанавливаем таймаут для загрузки
            const timeout = setTimeout(() => {
                video.src = '';
                reject(new Error('Video load timeout'));
            }, 15000); // 15 секунд таймаут для видео
            
            video.onloadedmetadata = () => {
                clearTimeout(timeout);
                this.cache.set(normalizedUrl, video);
                resolve(video);
            };
            
            video.onerror = (error) => {
                clearTimeout(timeout);
                console.warn('Failed to preload video:', normalizedUrl, error);
                reject(error);
            };
            
            video.src = normalizedUrl;
        });
    }

    // Предзагрузка медиа с приоритетом
    preloadMedia(urls, priority = 'low') {
        const validUrls = urls
            .filter(url => url && typeof url === 'string')
            .map(url => this.normalizeUrl(url))
            .filter(url => url !== null);

        if (validUrls.length === 0) {
            return Promise.resolve();
        }

        const promises = validUrls.map(url => {
            if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                return this.preloadImage(url).catch(error => {
                    console.warn('Failed to preload image:', url, error);
                    return null;
                });
            } else if (url.match(/\.(mp4|webm|ogg|avi|mov)$/i)) {
                return this.preloadVideo(url).catch(error => {
                    console.warn('Failed to preload video:', url, error);
                    return null;
                });
            }
            return Promise.resolve(null);
        });

        if (priority === 'high') {
            return Promise.all(promises);
        } else {
            // Для низкого приоритета загружаем последовательно
            return this.processQueue(promises);
        }
    }

    // Обработка очереди загрузки
    async processQueue(promises) {
        for (const promise of promises) {
            try {
                await promise;
                // Небольшая задержка между загрузками
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                // Ошибки уже обработаны в preloadMedia
                console.warn('Media preload error:', error);
            }
        }
    }

    // Очистка кэша
    clearCache() {
        this.cache.clear();
    }

    // Получение размера кэша
    getCacheSize() {
        return this.cache.size;
    }

    // Предзагрузка медиа для постов
    preloadPostsMedia(posts) {
        if (!posts || !Array.isArray(posts) || posts.length === 0) {
            return;
        }

        const mediaUrls = [];
        
        posts.forEach(post => {
            if (post.media && Array.isArray(post.media) && post.media.length > 0) {
                post.media.forEach(media => {
                    if (media && media.file_path && typeof media.file_path === 'string') {
                        mediaUrls.push(media.file_path);
                    }
                });
            }
        });

        if (mediaUrls.length > 0) {
            // Запускаем предзагрузку в фоне, не блокируя основной поток
            setTimeout(() => {
                this.preloadMedia(mediaUrls, 'low').catch(error => {
                    console.warn('Failed to preload posts media:', error);
                });
            }, 0);
        }
    }
}

// Создаем глобальный экземпляр
const mediaPreloader = new MediaPreloader();

export default mediaPreloader; 