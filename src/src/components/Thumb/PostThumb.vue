<template>
    <div
        :class="[
            'group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] post-thumb-component',
            'post-card-with-media',
        ]"
    >
        <div
            class="relative aspect-square bg-gray-50 cursor-pointer media-area"
            @click="navigateToPost"
        >
            <img
                v-if="
                    hasPhoto(post) &&
                    getMediaPath(getFirstPhoto(post).file_path) &&
                    !imageError
                "
                v-lazy="getCoverImageUrl(getFirstPhoto(post).file_path)"
                :alt="extractTitle(post.text)"
                :class="getSquareMediaClasses('preview')"
                @load="handleImageLoad"
                @error="handleImageError"
            />

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

            <MediaErrorFallback
                v-else-if="imageError"
                message="Изображение недоступно"
            />

            <MediaErrorFallback
                v-else-if="videoError"
                message="Видео недоступно"
            />

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
                        v-if="route.name !== 'scheduled-posts'"
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

                    <button
                        v-if="
                            post.scheduled_at &&
                            route.name === 'scheduled-posts'
                        "
                        @click.prevent.stop="$emit('cancel', post)"
                        class="p-1.5 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors backdrop-blur-sm action-button"
                        title="Отменить публикацию"
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
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>
            </div>
        </div>

        <div class="content-area p-3">
            <router-link
                :to="{ name: 'post', params: { id: post._id } }"
                class="font-medium text-gray-900 mb-2 line-clamp-3 cursor-pointer hover:text-blue-600 transition-colors"
            >
                {{ displayText }}
            </router-link>

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
                    class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium text-black"
                    :style="{ 'background-color': categoryColor }"
                >
                    {{ categoryName }}
                </span>
            </div>

            <div
                v-if="
                    post.conversion_metrics &&
                    (post.conversion_metrics.views > 0 ||
                        post.conversion_metrics.comments > 0 ||
                        post.conversion_metrics.forwards > 0)
                "
                class="flex items-center justify-between text-xs text-gray-500"
            >
                <div class="flex items-center space-x-3">
                    <span
                        v-if="
                            post.conversion_metrics?.views !== undefined &&
                            post.conversion_metrics.views > 0
                        "
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
                        v-if="
                            post.conversion_metrics?.comments !== undefined &&
                            post.conversion_metrics.comments > 0
                        "
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
                        v-if="
                            post.conversion_metrics?.forwards !== undefined &&
                            post.conversion_metrics.forwards > 0
                        "
                        class="flex items-center space-x-1"
                    >
                        <span>🔄</span>
                        <span>{{
                            formatNumber(post.conversion_metrics.forwards)
                        }}</span>
                    </span>
                </div>
                <div class="text-xs text-gray-400">
                    {{ formatDate(post.timestamp || post.created_at) }}
                </div>
            </div>

            <div
                v-if="
                    post.conversion_metrics &&
                    (post.conversion_metrics.er > 0 ||
                        post.conversion_metrics.err > 0)
                "
                class="mt-2 flex items-center justify-between"
            >
                <div class="flex items-center space-x-2">
                    <span
                        v-if="
                            post.conversion_metrics.er !== undefined &&
                            post.conversion_metrics.er > 0
                        "
                        class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-green-50 text-green-700"
                    >
                        ER: {{ post.conversion_metrics.er }}%
                    </span>
                    <span
                        v-if="
                            post.conversion_metrics.err !== undefined &&
                            post.conversion_metrics.err > 0
                        "
                        class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700"
                    >
                        ERR: {{ post.conversion_metrics.err }}%
                    </span>
                    <span
                        v-if="
                            post.published_channel_id !== undefined &&
                            route.name !== 'index'
                        "
                        class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700"
                    >
                        {{ post.published_channel_name || "Неизвестный канал" }}
                    </span>

                    <span
                        v-if="
                            !post.published_channel_id && route.name !== 'index'
                        "
                        class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-700"
                    >
                        📅
                        {{ post.scheduled_channel_name || "Неизвестный канал" }}
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
import { useRouter, useRoute } from "vue-router";
import { ref, computed, onMounted, watch } from "vue";
import { useFavorites } from "@/composables/useFavorites";
import MediaErrorFallback from "@/components/Media/MediaErrorFallback.vue";

const router = useRouter();
const { isFavorite, toggleFavorite, initializeFavorites } = useFavorites();
const route = useRoute();

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

const category = computed(() => {
    const id = props.post?.category_id;
    if (!id || !Array.isArray(props.categories)) return null;
    return props.categories.find((c) => c?._id === id || c?.id === id) || null;
});

const categoryName = computed(() => {
    return props.post?.category_name || category.value?.name || "Без категории";
});

const categoryColor = computed(() => {
    return props.post?.category_color || category.value?.color || "#e5e7eb";
});

const emit = defineEmits([
    "publish",
    "delete",
    "quickview",
    "remove-from-favorites",
    "cancel",
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

const navigateToPost = () => {
    router.push({ name: "post", params: { id: props.post._id } });
};

const imageError = ref(false);
const videoError = ref(false);

const handleImageLoad = () => {
    imageError.value = false;
};

const handleVideoMetadata = () => {
    videoError.value = false;
};

const handleImageError = () => {
    imageError.value = true;
    console.warn(
        "Failed to load image:",
        getCoverImageUrl(getFirstPhoto(props.post).file_path)
    );
};

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
