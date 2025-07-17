<template>
    <div
        v-if="selectedChannels.length > 0"
        class="bg-white p-4 rounded-lg shadow mb-6"
    >
        <div class="flex items-center justify-between">
            <div class="flex items-center">
                <span class="text-sm font-medium text-gray-900">
                    Выбрано каналов: {{ selectedChannels.length }}
                </span>
            </div>
            <div class="flex items-center space-x-3">
                <button
                    @click="$emit('bulk-delete')"
                    class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                    <svg
                        class="h-4 w-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                    </svg>
                    Удалить выбранные
                </button>
                <button
                    @click="$emit('clear-selection')"
                    class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Очистить выбор
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
const props = defineProps({
    selectedChannels: {
        type: Array,
        required: true,
    },
});

defineEmits(["bulk-delete", "clear-selection"]);
</script>
