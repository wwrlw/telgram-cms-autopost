<template>
    <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
            Канал для публикации
        </label>

        <select
            v-model="innerValue"
            class="border rounded p-2 text-sm w-full"
            :disabled="loading || disabled"
        >
            <option disabled value="">
                {{ loading ? "Загрузка каналов..." : "Выберите канал" }}
            </option>

            <option
                v-for="ch in channels"
                :key="ch._id ?? ch.channel_id"
                :value="String(ch.channel_id)"
            >
                {{ ch.name }}
            </option>
        </select>
    </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
    modelValue: { type: String, default: "" },
    channels: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue"]);

const innerValue = computed({
    get: () => props.modelValue ?? "",
    set: (v) => emit("update:modelValue", v),
});
</script>
