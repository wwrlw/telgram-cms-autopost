<template>
    <div
        v-if="selectedCategories.length > 0"
        class="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
    >
        <div class="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
            <div class="flex items-center space-x-4">
                <div class="flex items-center text-sm text-gray-500">
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
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    Выбрано: {{ selectedCategories.length }}
                </div>

                <div class="flex items-center space-x-2">
                    <button
                        @click="$emit('bulk-delete')"
                        class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                        <svg
                            class="h-3 w-3 mr-1"
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
                        class="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <svg
                            class="h-3 w-3 mr-1"
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
                        Отмена
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
const props = defineProps({
    selectedCategories: {
        type: Array,
        default: () => [],
    },
});

const emit = defineEmits(["bulk-delete", "clear-selection"]);
</script>
