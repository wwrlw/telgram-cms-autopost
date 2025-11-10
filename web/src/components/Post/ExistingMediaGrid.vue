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
                            class="absolute inset-0 flex items-center justify-center transition-all duration-200"
                        >
                            <div
                                class="w-8 h-8 bg-black bg-opacity-60 rounded-full flex items-center justify-center shadow-lg"
                            >
                                <Play class="w-4 h-4 text-white ml-0.5" />
                            </div>
                        </div>
                    </div>
                    <div
                        v-else
                        class="w-full h-full bg-gray-200 flex items-center justify-center"
                    >
                        <FileText class="w-8 h-8 text-gray-400" />
                    </div>
                </div>
                <div class="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        @click="toggleSpoiler(idx)"
                        :class="[
                            'bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs',
                            isSpoilerEnabled(idx) ? 'bg-red-500/70' : 'bg-black/50'
                        ]"
                        :title="isSpoilerEnabled(idx) ? 'Убрать спойлер' : 'Добавить спойлер'"
                    >
                        <Eye class="w-4 h-4"></Eye>
                    </button>
                    <button
                        @click="handleRemove(item)"
                        class="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                        title="Удалить файл"
                    >
                        <X class="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { getMediaUrl } from "@/js/utils";
import { Play, FileText, X, Eye } from "lucide-vue-next";

const props = defineProps({
    media: { type: Array, default: () => [] },
    showCombinedHeading: { type: Boolean, default: false },
    hasNewFiles: { type: Boolean, default: false },
    newPreviews: { type: Array, default: () => [] },
    spoilers: { type: Array, default: () => [] },
});

const emit = defineEmits(["open", "remove", "removeNew", "update-spoiler"]);

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

function toggleSpoiler(index) {
    const hasSpoiler = !isSpoilerEnabled(index);
    emit("update-spoiler", index, hasSpoiler);
}

function isSpoilerEnabled(index) {
    return props.spoilers[index] || false;
}

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
