<template>
    <div class="mb-4" v-if="media && media.length">
        <h4 class="text-sm font-medium text-gray-700 mb-3">
            {{ headingText }}
        </h4>
        <div
            class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
        >
            <div
                v-for="(m, id) in media"
                :key="'existing-' + id"
                class="relative group border rounded overflow-hidden"
            >
                <div class="aspect-square overflow-hidden">
                    <img
                        v-if="isImageMedia(m)"
                        :src="getMediaUrl(m.file_path)"
                        :class="getSquareMediaClasses('thumbnail')"
                        class="cursor-pointer hover:opacity-90 transition-opacity"
                        @click="emit('open', m, id)"
                    />
                                            <div
                            v-else-if="isVideoMedia(m)"
                            class="relative cursor-pointer hover:opacity-90 transition-opacity w-full h-full"
                            @click="emit('open', m, id)"
                        >
                        <video
                            :src="getMediaUrl(m.file_path)"
                            :class="getSquareMediaClasses('thumbnail')"
                            muted
                            preload="metadata"
                        />
                        <div
                            class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30"
                        >
                            <div
                                class="w-8 h-8 bg-black bg-opacity-70 rounded-full flex items-center justify-center"
                            >
                                <svg
                                    class="w-4 h-4 text-white ml-0.5"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div
                        v-else
                        class="w-full h-full bg-gray-200 flex items-center justify-center"
                    >
                        <svg
                            class="w-8 h-8 text-gray-400"
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
                <button
                    @click="emit('remove', id)"
                    class="absolute top-1 right-1 bg-red-500 text-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    title="Удалить файл"
                >
                    ✕
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from "vue";
import { getMediaUrl, getSquareMediaClasses } from "@/js/utils";

const props = defineProps({
    media: { type: Array, default: () => [] },
    showCombinedHeading: { type: Boolean, default: false },
    hasNewFiles: { type: Boolean, default: false },
});

const emit = defineEmits(['open', 'remove']);

function isImageMedia(media) {
    return media?.type === "photo" || media?.type === "MessageMediaPhoto";
}
function isVideoMedia(media) {
    return (
        media?.type === "video" ||
        media?.type === "MessageMediaDocument" ||
        media?.type === "document"
    );
}

const headingText = computed(() =>
    props.showCombinedHeading && props.hasNewFiles
        ? "Медиафайлы (существующие + новые):"
        : "Медиафайлы:"
);
</script>
