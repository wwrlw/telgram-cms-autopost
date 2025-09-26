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
                <img
                    v-if="getFirstVideo(post).thumbnail_path"
                    :src="getMediaPath(getFirstVideo(post).thumbnail_path)"
                    :alt="'Thumbnail' + extractTitle(post.text)"
                    :class="getSquareMediaClasses('preview')"
                    @load="handleImageLoad"
                    @error="handleImageError"
                />

                <template v-else>
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
                            <Play class="w-6 h-6 text-white ml-0.5" />
                        </div>
                    </div>
                </template>

                <div
                    v-if="getFirstVideo(post).thumbnail_path"
                    class="absolute inset-0 flex items-center justify-center transition-all duration-200"
                >
                    <div
                        class="w-12 h-12 bg-black bg-opacity-60 rounded-full flex items-center justify-center shadow-lg"
                    >
                        <Play class="w-6 h-6 text-white ml-0.5" />
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
                <FileText class="w-10 h-10 text-gray-300" />
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
                        <Eye class="w-3.5 h-3.5" />
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
                        <Heart
                            v-if="isFavorite(post._id)"
                            class="w-3.5 h-3.5"
                            fill="currentColor"
                        />
                        <Heart v-else class="w-3.5 h-3.5" />
                    </button>

                    <button
                        v-if="route.name !== 'scheduled-posts'"
                        @click.prevent.stop="$emit('delete', post)"
                        class="p-1.5 bg-black bg-opacity-60 text-white rounded-full hover:bg-red-600 transition-colors backdrop-blur-sm action-button"
                        title="Удалить"
                    >
                        <Trash2 class="w-3.5 h-3.5" />
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
                        <X class="w-3.5 h-3.5" />
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
                    <ArrowLeftRight class="w-3 h-3" />
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
                        <Eye class="w-3 h-3" />
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
                        <MessageCircle class="w-3 h-3" />
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
import {
    Play,
    FileText,
    Eye,
    Heart,
    Trash2,
    X,
    ArrowLeftRight,
    MessageCircle,
} from "lucide-vue-next";
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

defineEmits([
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
