<template>
    <div>
        <label class="block text-sm font-medium text-gray-700 mb-1"
            >Канал для публикации</label
        >
        <select v-model="innerValue" class="border rounded p-2 text-sm w-full">
            <option value="">Выберите канал</option>
            <option
                v-for="channel in channels"
                :key="channel._id"
                :value="channel.channel_id"
            >
                {{ channel.name }}
            </option>
        </select>
        <div
            v-if="isAutoSelected"
            class="mt-1 text-xs text-green-600 flex items-center gap-1"
        >
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                />
            </svg>
            Автоматически выбран по категории "{{ categoryName }}"
            <button
                @click="innerValue = ''"
                class="ml-2 text-red-500 hover:text-red-700 underline"
                title="Сбросить автовыбор"
            >
                Сбросить
            </button>
        </div>
    </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
    modelValue: { type: String, default: "" },
    channels: { type: Array, default: () => [] },
    categoryName: { type: String, default: "" },
});
const emit = defineEmits(["update:modelValue"]);

const innerValue = computed({
    get: () => props.modelValue,
    set: (v) => emit("update:modelValue", v),
});

const isAutoSelected = computed(() => {
    if (!props.categoryName || !props.modelValue) return false;
    const selected = props.channels.find(
        (c) => c.channel_id === props.modelValue
    );
    return !!selected && selected.name === props.categoryName;
});
</script>
