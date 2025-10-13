<template>
    <div class="space-y-4 mb-4">
        <div class="flex items-center gap-2">
            <button
                type="button"
                class="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md cursor-pointer"
                @click="triggerFile"
            >
                <Paperclip class="w-4 h-4" />
                <span>Прикрепить файлы</span>
            </button>
            <input
                ref="fileInputRef"
                type="file"
                multiple
                accept="image/*,video/*,audio/*"
                @change="handleFiles"
                class="hidden"
            />
            <span class="text-xs text-gray-500">
                {{ totalCount }}/{{ maxFiles }} файлов
            </span>
        </div>

        <div
            v-if="previewsLocal.length && showGrid"
            class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-4"
        >
            <div
                v-for="(item, idx) in previewsLocal"
                :key="idx"
                class="relative group border rounded overflow-hidden aspect-square"
            >
                <img
                    v-if="item.isImage"
                    :src="item.url"
                    class="w-full h-full object-cover"
                />
                <video
                    v-else
                    muted
                    :src="item.url"
                    class="w-full h-full object-cover"
                ></video>
                <button
                    @click="removeFile(idx)"
                    class="absolute top-1 right-1 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Удалить файл"
                >
                    ✕
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, computed } from "vue";

import { Paperclip } from "lucide-vue-next";

const props = defineProps({
    modelValue: { type: Array, default: () => [] },
    previews: { type: Array, default: () => [] },
    maxFiles: { type: Number, default: 10 },
    existingCount: { type: Number, default: 0 },
    showGrid: { type: Boolean, default: true },
});
const emit = defineEmits(["update:modelValue", "update:previews"]);

const filesLocal = ref([...props.modelValue]);
const previewsLocal = ref([...props.previews]);
const fileInputRef = ref(null);

watch(
    () => props.modelValue,
    (v) => {
        if (v !== filesLocal.value) filesLocal.value = [...v];
    }
);
watch(
    () => props.previews,
    (v) => {
        if (v !== previewsLocal.value) previewsLocal.value = [...v];
    }
);

const totalCount = computed(
    () => (filesLocal.value?.length || 0) + (props.existingCount || 0)
);

function addFiles(newArr) {
    const remaining =
        props.maxFiles - (props.existingCount + filesLocal.value.length);
    const slice = newArr.slice(0, Math.max(0, remaining));
    slice.forEach((file) => {
        filesLocal.value.push(file);
        const url = URL.createObjectURL(file);
        previewsLocal.value.push({
            url,
            isImage: file.type.startsWith("image"),
        });
    });
    emit("update:modelValue", filesLocal.value);
    emit("update:previews", previewsLocal.value);
}

function handleFiles(e) {
    const incoming = Array.from(e.target.files || []);
    if (
        props.existingCount + filesLocal.value.length + incoming.length >
        props.maxFiles
    ) {
        window?.$toast?.warning(
            `Максимум ${props.maxFiles} файлов. Уже выбрано ${filesLocal.value.length} новых и ${props.existingCount} существующих.`
        );
    }
    addFiles(incoming);
    e.target.value = "";
}

function removeFile(index) {
    filesLocal.value.splice(index, 1);
    const prev = previewsLocal.value.splice(index, 1)[0];
    if (prev?.url) URL.revokeObjectURL(prev.url);
    emit("update:modelValue", filesLocal.value);
    emit("update:previews", previewsLocal.value);
}

function triggerFile() {
    fileInputRef.value?.click();
}
</script>
