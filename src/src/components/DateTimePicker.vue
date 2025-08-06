<template>
    <div class="space-y-3">
        <div class="flex items-center gap-3">
            <div class="flex-1">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                    Дата публикации
                </label>
                <input
                    v-model="selectedDate"
                    type="date"
                    class="border rounded p-2 text-sm w-full"
                    :min="minDate"
                />
            </div>
            <div class="flex-1">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                    Время публикации
                </label>
                <input
                    v-model="selectedTime"
                    type="time"
                    class="border rounded p-2 text-sm w-full"
                />
            </div>
        </div>

        <!-- Быстрые варианты -->
        <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">
                Быстрые варианты
            </label>
            <div class="flex flex-wrap gap-2">
                <button
                    v-for="option in quickOptions"
                    :key="option.label"
                    @click="setQuickOption(option)"
                    class="px-3 py-1 text-xs rounded-full border hover:bg-gray-50 transition-colors"
                    :class="{
                        'bg-blue-100 border-blue-300 text-blue-700':
                            isQuickOptionSelected(option),
                    }"
                >
                    {{ option.label }}
                </button>
            </div>
        </div>

        <!-- Предварительный просмотр -->
        <div v-if="selectedDateTime" class="p-3 bg-gray-50 rounded text-sm">
            <div class="flex items-center gap-2">
                <svg
                    class="w-4 h-4 text-gray-500"
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
                <span class="text-gray-700">
                    Публикация:
                    <strong>{{ formatDateTime(selectedDateTime) }}</strong>
                </span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";

const props = defineProps({
    modelValue: {
        type: String,
        default: "",
    },
});

const emit = defineEmits(["update:modelValue"]);

const selectedDate = ref("");
const selectedTime = ref("");

// Минимальная дата - сегодня
const minDate = computed(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
});

// Быстрые варианты
const quickOptions = [
    { label: "Через 1 час", hours: 1 },
    { label: "Через 2 часа", hours: 2 },
    { label: "Через 4 часа", hours: 4 },
    { label: "Завтра в 9:00", custom: () => getTomorrowAt(9) },
    { label: "Завтра в 12:00", custom: () => getTomorrowAt(12) },
    { label: "Завтра в 18:00", custom: () => getTomorrowAt(18) },
    { label: "Через неделю", days: 7 },
];

// Вычисляемое значение для datetime-local
const selectedDateTime = computed(() => {
    if (!selectedDate.value || !selectedTime.value) return "";
    return `${selectedDate.value}T${selectedTime.value}`;
});

// Функции для быстрых вариантов
function getTomorrowAt(hour) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(hour, 0, 0, 0);
    return tomorrow;
}

function setQuickOption(option) {
    const now = new Date();
    let targetDate;

    if (option.custom) {
        targetDate = option.custom();
    } else if (option.hours) {
        targetDate = new Date(now.getTime() + option.hours * 60 * 60 * 1000);
    } else if (option.days) {
        targetDate = new Date(
            now.getTime() + option.days * 24 * 60 * 60 * 1000
        );
    }

    if (targetDate) {
        selectedDate.value = targetDate.toISOString().split("T")[0];
        selectedTime.value = targetDate.toTimeString().slice(0, 5);
    }
}

function isQuickOptionSelected(option) {
    if (!selectedDateTime.value) return false;

    const selected = new Date(selectedDateTime.value);
    const now = new Date();

    if (option.custom) {
        const customDate = option.custom();
        return Math.abs(selected.getTime() - customDate.getTime()) < 60000; // 1 минута
    } else if (option.hours) {
        const expected = new Date(
            now.getTime() + option.hours * 60 * 60 * 1000
        );
        return Math.abs(selected.getTime() - expected.getTime()) < 60000;
    } else if (option.days) {
        const expected = new Date(
            now.getTime() + option.days * 24 * 60 * 60 * 1000
        );
        return Math.abs(selected.getTime() - expected.getTime()) < 60000;
    }

    return false;
}

function formatDateTime(dateTime) {
    if (!dateTime) return "";
    const date = new Date(dateTime);
    return date.toLocaleString("ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

// Синхронизация с v-model
watch(selectedDateTime, (newValue) => {
    emit("update:modelValue", newValue);
});

watch(
    () => props.modelValue,
    (newValue) => {
        if (newValue) {
            const date = new Date(newValue);
            selectedDate.value = date.toISOString().split("T")[0];
            selectedTime.value = date.toTimeString().slice(0, 5);
        }
    },
    { immediate: true }
);

// Инициализация с текущим временем + 1 час
onMounted(() => {
    if (!props.modelValue) {
        const defaultTime = new Date();
        defaultTime.setHours(defaultTime.getHours() + 1);
        defaultTime.setMinutes(0, 0, 0);

        selectedDate.value = defaultTime.toISOString().split("T")[0];
        selectedTime.value = defaultTime.toTimeString().slice(0, 5);
    }
});
</script>
