<template>
    <div class="mb-4" v-if="media && media.length">
        <h4 class="text-sm font-medium text-gray-700 mb-3">
            {{ headingText }}
        </h4>
        <div
            class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
            <div
                v-for="(item, idx) in combinedItems"
                :key="item.key"
                class="relative group border rounded overflow-hidden"
                :class="getAspectClass(item.raw)"
            >
                <div class="overflow-hidden" :class="getAspectClass(item.raw)">
                    <img
                        v-if="isImageItem(item.raw)"
                        :src="getItemSrc(item.raw)"
                        class="cursor-pointer hover:opacity-90 transition-opacity w-full h-full object-cover"
                        @click="emit('open', item.raw, idx)"
                        @load="onImageLoad($event, item.raw, idx)"
                    />
                    <div
                        v-else-if="isVideoItem(item.raw)"
                        class="relative cursor-pointer hover:opacity-90 transition-opacity w-full h-full object-cover"
                        @click="emit('open', item.raw, idx)"
                    >
                        <video
                            :src="getItemSrc(item.raw)"
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
                    @click="handleRemove(item)"
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
import { computed, ref } from "vue";
import { getMediaUrl } from "@/js/utils";

const props = defineProps({
    media: { type: Array, default: () => [] },
    showCombinedHeading: { type: Boolean, default: false },
    hasNewFiles: { type: Boolean, default: false },
    newPreviews: { type: Array, default: () => [] },
});

const emit = defineEmits(["open", "remove", "removeNew"]);

const imageDimensions = ref(new Map());

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

function isImageItem(item) {
    if (!item) return false;
    if (item.url) return !!item.isImage;
    return isImageMedia(item);
}
function isVideoItem(item) {
    if (!item) return false;
    if (item.url) return !item.isImage;
    return isVideoMedia(item);
}

function getItemSrc(item) {
    if (item.url) return item.url;
    return getMediaUrl(item.file_path);
}

function getAspectClass(media) {
    if (isImageItem(media)) {
        const key = media.url || media.id || media.file_path;
        const dimensions = imageDimensions.value.get(key);
        if (dimensions) {
            const ratio = dimensions.width / dimensions.height;
            return ratio > 1.2 ? "aspect-video" : "aspect-square";
        }
    }
    if (isVideoItem(media)) {
        return "aspect-video";
    }
    return "aspect-square";
}

function onImageLoad(event, media, id) {
    const img = event.target;
    const key = media.url || media.id || media.file_path || id;
    imageDimensions.value.set(key, {
        width: img.naturalWidth,
        height: img.naturalHeight,
    });
}

const headingText = computed(() =>
    props.showCombinedHeading && props.hasNewFiles
        ? "Медиафайлы (существующие + новые):"
        : "Медиафайлы:"
);

const combinedItems = computed(() => {
    const existing = (props.media || []).map((m, index) => ({
        kind: "existing",
        raw: m,
        key: `existing-${index}`,
        existingIndex: index,
    }));
    const news = (props.newPreviews || []).map((p, index) => ({
        kind: "new",
        raw: p,
        key: `new-${index}`,
        newIndex: index,
    }));
    return [...existing, ...news];
});

function handleRemove(item) {
    if (item.kind === "existing") {
        emit("remove", item.existingIndex);
    } else if (item.kind === "new") {
        emit("removeNew", item.newIndex);
    }
}
</script>
