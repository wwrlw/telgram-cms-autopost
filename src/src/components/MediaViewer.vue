<template>
    <div
        v-if="show"
        class="fixed inset-0 z-50 flex w-full h-full items-center justify-center bg-black bg-opacity-90"
        @click="$emit('close')"
    >
        <div class="relative max-w-5xl max-h-[90vh] w-full mx-4" @click.stop>
            <button
                @click="$emit('close')"
                class="absolute top-4 right-4 z-10 bg-black bg-opacity-70 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-90 transition-all"
            >
                <svg
                    class="w-5 h-5"
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

            <button
                v-if="canGoPrevious"
                @click="$emit('previous')"
                class="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-70 text-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-opacity-90 transition-all"
            >
                <svg
                    class="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 19l-7-7 7-7"
                    />
                </svg>
            </button>
            <button
                v-if="canGoNext"
                @click="$emit('next')"
                class="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-70 text-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-opacity-90 transition-all"
            >
                <svg
                    class="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 5l7 7-7 7"
                    />
                </svg>
            </button>

            <div class="flex items-center justify-center h-full">
                <img
                    v-if="media && isImage(media)"
                    :src="getMediaUrl(media.file_path)"
                    class="max-w-full max-h-full object-cover rounded-lg shadow-2xl"
                    :alt="media.filename || 'Image'"
                />
                <video
                    v-else-if="media && isVideo(media)"
                    :src="getMediaUrl(media.file_path)"
                    class="max-w-full max-h-full object-cover rounded-lg shadow-2xl"
                    controls
                    autoplay
                    :key="media.file_path"
                />
                <div
                    v-else
                    class="flex items-center justify-center w-64 h-64 bg-gray-200 rounded-lg"
                >
                    <svg
                        class="w-16 h-16 text-gray-400"
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
            </div>
        </div>
    </div>
</template>

<script setup>
import { getMediaUrl } from "@/js/utils";

const props = defineProps({
    show: {
        type: Boolean,
        default: false,
    },
    media: {
        type: Object,
        default: null,
    },
    currentIndex: {
        type: Number,
        default: 0,
    },
    totalCount: {
        type: Number,
        default: 0,
    },
    canGoPrevious: {
        type: Boolean,
        default: false,
    },
    canGoNext: {
        type: Boolean,
        default: false,
    },
});

defineEmits(["close", "previous", "next"]);

function isImage(media) {
    return media.type === "photo" || media.type === "MessageMediaPhoto";
}

function isVideo(media) {
    return (
        media.type === "video" ||
        media.type === "MessageMediaDocument" ||
        media.type === "document"
    );
}
</script>

<style scoped>
.fixed {
    animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}
</style>
