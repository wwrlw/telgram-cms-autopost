<template>
    <div
        :class="[
            'group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] scheduled-post-thumb-component',
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
                    getFirstPhoto(post) &&
                    getFirstPhoto(post).file_path &&
                    !imageError
                "
                :src="getMediaUrl(getFirstPhoto(post).file_path)"
                :alt="extractTitle(post.text)"
                :class="getSquareMediaClasses('preview')"
                @load="handleImageLoad"
                @error="handleImageError"
            />

            <div
                v-else-if="
                    hasVideo(post) &&
                    getFirstVideo(post) &&
                    getFirstVideo(post).file_path &&
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
                    v-if="isOverdue(post.scheduled_at)"
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500 text-white shadow-sm status-badge"
                >
                    ⏰ Просрочено
                </span>
                <span
                    v-else
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-500 text-white shadow-sm status-badge"
                >
                    📅 Запланировано
                </span>
            </div>

            <div
                v-if="post.media && post.media.length > 1"
                class="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full"
            >
                +{{ post.media.length - 1 }}
            </div>

            <div
                v-if="post.category_name"
                class="absolute bottom-2 left-2 bg-white bg-opacity-90 text-gray-700 text-xs px-2 py-1 rounded-full shadow-sm"
            >
                {{ post.category_name }}
            </div>
        </div>

        <div class="p-4">
            <h3
                class="text-sm font-medium text-gray-900 line-clamp-2 mb-2 cursor-pointer hover:text-indigo-600 transition-colors"
                @click="navigateToPost"
            >
                {{ extractTitle(post.text) }}
            </h3>

            <p
                class="text-xs text-gray-600 line-clamp-3 mb-3 cursor-pointer hover:text-gray-800 transition-colors"
                @click="navigateToPost"
            >
                {{ extractContent(post.text) }}
            </p>

            <div class="space-y-1 mb-4">
                <div class="flex items-center text-xs text-gray-500">
                    <svg
                        class="w-3 h-3 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                    </svg>
                    {{ formatDate(post.scheduled_at) }}
                </div>
                <div class="flex items-center text-xs text-gray-500">
                    <svg
                        class="w-3 h-3 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                    </svg>
                    {{ getChannelName(post.scheduled_channel_id) }}
                </div>
                <div
                    v-if="post.url"
                    class="flex items-center text-xs text-gray-500"
                >
                    <svg
                        class="w-3 h-3 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                        />
                    </svg>
                    {{ post.url }}
                </div>
            </div>

            <div class="flex space-x-2">
                <button
                    @click="$emit('edit', post)"
                    class="flex-1 bg-indigo-600 text-white text-xs font-medium py-2 px-3 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                    Изменить
                </button>
                <button
                    @click="$emit('cancel', post)"
                    class="flex-1 bg-red-600 text-white text-xs font-medium py-2 px-3 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                    Отменить
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { getMediaUrl, formatDate } from "@/js/utils";
import MediaErrorFallback from "@/components/Media/MediaErrorFallback.vue";

const props = defineProps({
    post: {
        type: Object,
        required: true,
    },
    categories: {
        type: Array,
        default: () => [],
    },
    channels: {
        type: Array,
        default: () => [],
    },
});

const emit = defineEmits(["edit", "cancel"]);

const router = useRouter();
const imageError = ref(false);
const videoError = ref(false);

const hasPhoto = (post) => {
    const hasPhotos =
        post.media && post.media.some((media) => media.type === "photo");
    return hasPhotos;
};

const hasVideo = (post) => {
    return post.media && post.media.some((media) => media.type === "video");
};

const getFirstPhoto = (post) => {
    const firstPhoto = post.media?.find((media) => media.type === "photo");
    return firstPhoto;
};

const getFirstVideo = (post) => {
    return post.media?.find((media) => media.type === "video");
};

const getSquareMediaClasses = (type) => {
    const baseClasses = "w-full h-full object-cover";
    return type === "preview" ? baseClasses : baseClasses;
};

const handleImageLoad = () => {
    imageError.value = false;
};

const handleImageError = () => {
    imageError.value = true;
};

const handleVideoMetadata = () => {
    videoError.value = false;
};

const handleVideoError = () => {
    videoError.value = true;
};

const extractTitle = (text) => {
    if (!text) return "Без заголовка";
    const lines = text.split("\n").filter((line) => line.trim());
    return lines[0] || "Без заголовка";
};

const extractContent = (text) => {
    if (!text) return "";
    const lines = text.split("\n").filter((line) => line.trim());
    return (
        lines.slice(1).join(" ").substring(0, 150) +
        (lines.slice(1).join(" ").length > 150 ? "..." : "")
    );
};

const isOverdue = (scheduledAt) => {
    if (!scheduledAt) return false;
    return new Date(scheduledAt) < new Date();
};

const getChannelName = (channelId) => {
    if (!channelId) return "Неизвестный канал";
    const channel = props.channels.find((ch) => ch.channel_id === channelId);
    return channel ? channel.name : `ID: ${channelId}`;
};

const navigateToPost = () => {
    router.push({ name: "post", params: { id: props.post._id } });
};
</script>

<style scoped>
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

.posts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
}

@media (max-width: 640px) {
    .posts-grid {
        grid-template-columns: 1fr;
    }
}
</style>
