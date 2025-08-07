<template>
    <div
        :class="[
            'group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] post-thumb-component',
            'post-card-with-media',
        ]"
    >
        <!-- Медиа область - всегда показываем -->
        <div
            class="relative aspect-square bg-gray-50 cursor-pointer media-area"
            @click="navigateToPost"
        >
            <!-- Показываем картинку если есть фото и нет ошибки -->
            <img
                v-if="
                    hasPhoto(post) &&
                    getMediaPath(getFirstPhoto(post).file_path) &&
                    !imageError
                "
                :src="getCoverImageUrl(getFirstPhoto(post).file_path)"
                :alt="extractTitle(post.text)"
                :class="getSquareMediaClasses('preview')"
                @load="handleImageLoad"
                @error="handleImageError"
            />

            <!-- Показываем видео если есть видео и нет ошибки -->
            <div
                v-else-if="
                    hasVideo(post) &&
                    getFirstVideo(post) &&
                    getMediaPath(getFirstVideo(post).file_path) &&
                    !videoError
                "
                class="w-full h-full bg-gray-200 flex items-center justify-center relative"
            >
                <video
                    v-lazy="getMediaPath(getFirstVideo(post).file_path)"
                    :class="getSquareMediaClasses('preview')"
                    muted
                    preload="none"
                    loading="lazy"
                    @loadedmetadata="handleVideoMetadata"
                    @error="handleVideoError"
                />
                <div
                    class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-200"
                >
                    <div
                        class="w-12 h-12 bg-black bg-opacity-60 rounded-full flex items-center justify-center shadow-lg"
                    >
                        <svg
                            class="w-6 h-6 text-white ml-0.5"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </div>
                </div>
            </div>

            <!-- Показываем ошибку для картинки -->
            <MediaErrorFallback
                v-else-if="imageError"
                message="Изображение недоступно"
            />

            <!-- Показываем ошибку для видео -->
            <MediaErrorFallback
                v-else-if="videoError"
                message="Видео недоступно"
            />

            <!-- Показываем дефолтную иконку если нет медиа -->
            <div
                v-else
                class="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center"
            >
                <svg
                    class="w-10 h-10 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                </svg>
            </div>

            <!-- Статусные бейджи -->
            <div class="absolute top-2 left-2 flex flex-col gap-1">
                <span
                    v-if="post.is_published"
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500 text-white shadow-sm status-badge"
                >
                    ✅
                </span>
                <span
                    v-else-if="post.scheduled_at"
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-500 text-white shadow-sm status-badge"
                >
                    📅
                </span>
                <span
                    v-if="post.is_unique"
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500 text-white shadow-sm status-badge"
                >
                    ✨
                </span>
            </div>

            <!-- Действия -->
            <div
                class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
                <div class="flex flex-col gap-1">
                    <button
                        v-if="hasMedia(post)"
                        @click.prevent.stop="$emit('quickview', post)"
                        class="p-1.5 bg-black bg-opacity-60 text-white rounded-full hover:bg-opacity-80 transition-colors backdrop-blur-sm action-button"
                        title="Быстрый просмотр медиа"
                    >
                        <svg
                            class="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                        </svg>
                    </button>

                    <button
                        @click.prevent.stop="toggleFavorite(post._id)"
                        :class="[
                            'p-1.5 rounded-full transition-colors backdrop-blur-sm action-button',
                            isFavorite(post._id)
                                ? 'bg-red-500 text-white hover:bg-red-600'
                                : 'bg-black bg-opacity-60 text-white hover:bg-opacity-80',
                        ]"
                        :title="
                            isFavorite(post._id)
                                ? 'Убрать из избранного'
                                : 'В избранное'
                        "
                    >
                        <svg
                            class="w-3.5 h-3.5"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                v-if="isFavorite(post._id)"
                                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                            />
                            <path
                                v-else
                                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                            />
                        </svg>
                    </button>

                    <button
                        @click.prevent.stop="$emit('delete', post)"
                        class="p-1.5 bg-black bg-opacity-60 text-white rounded-full hover:bg-red-600 transition-colors backdrop-blur-sm action-button"
                        title="Удалить"
                    >
                        <svg
                            class="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                        </svg>
                    </button>
                </div>
            </div>
        </div>

        <!-- Контент -->
        <div class="content-area p-3">
            <!-- Текст поста -->
            <router-link
                :to="{ name: 'post', params: { id: post._id } }"
                class="font-medium text-gray-900 mb-2 line-clamp-3 cursor-pointer hover:text-blue-600 transition-colors"
            >
                {{ displayText }}
            </router-link>

            <!-- Переключатель уникального текста -->
            <div v-if="post.is_unique && post.unique_text" class="mb-2">
                <button
                    @click.prevent="toggleTextMode"
                    class="text-xs bg-orange-50 text-orange-700 hover:bg-orange-100 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors"
                >
                    <svg
                        class="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                        />
                    </svg>
                    <span>{{
                        showingUniqueText ? "Оригинал" : "Уникальный"
                    }}</span>
                </button>
            </div>

            <div class="mb-2">
                <span
                    class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
                    :class="getCategoryStyle()"
                >
                    {{ getCategoryName() }}
                </span>
            </div>

            <div
                class="flex items-center justify-between text-xs text-gray-500"
            >
                <div class="flex items-center space-x-3">
                    <span
                        v-if="post.conversion_metrics?.views !== undefined"
                        class="flex items-center space-x-1"
                    >
                        <svg
                            class="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                        </svg>
                        <span>{{
                            formatNumber(post.conversion_metrics.views)
                        }}</span>
                    </span>
                    <span
                        v-if="post.conversion_metrics?.comments !== undefined"
                        class="flex items-center space-x-1"
                    >
                        <svg
                            class="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                        </svg>
                        <span>{{
                            formatNumber(post.conversion_metrics.comments)
                        }}</span>
                    </span>
                    <span
                        v-if="post.conversion_metrics?.forwards !== undefined"
                        class="flex items-center space-x-1"
                    >
                        <span>🔄</span>
                        <span>{{
                            formatNumber(post.conversion_metrics.forwards)
                        }}</span>
                    </span>
                </div>
                <div class="text-xs text-gray-400">
                    {{ formatDate(post.timestamp) }}
                </div>
            </div>

            <!-- Метрики конверсии -->
            <div
                v-if="post.conversion_metrics"
                class="mt-2 flex items-center justify-between"
            >
                <div class="flex items-center space-x-2">
                    <span
                        v-if="post.conversion_metrics.er !== undefined"
                        class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-green-50 text-green-700"
                    >
                        ER: {{ post.conversion_metrics.er }}%
                    </span>
                    <span
                        v-if="post.conversion_metrics.err !== undefined"
                        class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700"
                    >
                        ERR: {{ post.conversion_metrics.err }}%
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import {
    getMediaUrl,
    getCoverImageUrl,
    formatNumber,
    extractTitle,
    formatDate,
    hasPhoto,
    hasVideo,
    getFirstPhoto,
    getFirstVideo,
    getSquareMediaClasses,
} from "@/js/utils";
import { useRouter } from "vue-router";
import { ref, computed, onMounted, watch } from "vue";
import { useFavorites } from "@/composables/useFavorites";
import MediaErrorFallback from "@/components/Media/MediaErrorFallback.vue";

const router = useRouter();
const { isFavorite, toggleFavorite, initializeFavorites } = useFavorites();

const props = defineProps({
    post: {
        type: Object,
        required: true,
    },
    categories: {
        type: Array,
        default: () => [],
    },
});

const emit = defineEmits([
    "publish",
    "delete",
    "quickview",
    "remove-from-favorites",
]);

const displayText = computed(() => {
    if (showingUniqueText.value && props.post.unique_text) {
        return props.post.unique_text;
    }
    return props.post.text || "";
});

const showingUniqueText = ref(false);

const toggleTextMode = () => {
    showingUniqueText.value = !showingUniqueText.value;
};

const getMediaPath = (filePath) => {
    return getMediaUrl(filePath);
};

const getCategoryName = () => {
    if (props.post.category_name) {
        return props.post.category_name;
    }

    if (!props.post.category_id) return "Без категории";
    const category = props.categories.find(
        (cat) => cat.id === props.post.category_id
    );
    return category ? category.name : "Неизвестная категория";
};

const getCategoryStyle = () => {
    // Используем данные напрямую из поста, если они есть
    if (props.post.category_color) {
        const color = props.post.category_color.replace("#", "");
        const r = parseInt(color.substr(0, 2), 16);
        const g = parseInt(color.substr(2, 2), 16);
        const b = parseInt(color.substr(4, 2), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        const textColor = brightness > 155 ? "text-gray-900" : "text-white";
        return `bg-[${props.post.category_color}] ${textColor} border border-[${props.post.category_color}]`;
    }

    // Fallback к старому способу поиска по ID
    if (!props.post.category_id) {
        return "bg-gray-100 text-gray-700 border border-gray-200";
    }
    const category = props.categories.find(
        (cat) => cat.id === props.post.category_id
    );
    if (category && category.color) {
        const color = category.color.replace("#", "");
        const r = parseInt(color.substr(0, 2), 16);
        const g = parseInt(color.substr(2, 2), 16);
        const b = parseInt(color.substr(4, 2), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        const textColor = brightness > 155 ? "text-gray-900" : "text-white";
        return `bg-[${category.color}] ${textColor} border border-[${category.color}]`;
    }
    return "bg-gray-100 text-gray-700 border border-gray-200";
};

const navigateToPost = () => {
    router.push({ name: "post", params: { id: props.post._id } });
};

const imageError = ref(false);
const videoError = ref(false);

const handleImageLoad = () => {
    console.log("Image loaded successfully");
    imageError.value = false;
};

const handleVideoMetadata = () => {
    console.log("Video metadata loaded");
    videoError.value = false;
};

const handleImageError = () => {
    imageError.value = true;
    console.warn(
        "Failed to load image:",
        getCoverImageUrl(getFirstPhoto(props.post).file_path)
    );
};

const handleVideoError = (event) => {
    console.warn("Failed to load video:", event.target.src);
    videoError.value = true;
};

// Следим за изменением поста и сбрасываем ошибки
watch(
    () => props.post._id,
    () => {
        imageError.value = false;
        videoError.value = false;
    }
);

const hasMedia = (post) => {
    return post.media && post.media.length > 0;
};

onMounted(() => {
    initializeFavorites();
});
</script>

<style scoped>
.group:hover .group-hover\:opacity-100 {
    opacity: 1;
}

.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>
