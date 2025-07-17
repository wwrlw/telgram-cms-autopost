<template>
    <div class="mb-6">
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <!-- Всего категорий -->
            <div class="bg-white overflow-hidden shadow rounded-lg">
                <div class="p-5">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <svg
                                class="h-6 w-6 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V3a1 1 0 011 1v10.586l2.707 2.707A1 1 0 0119 19H5a1 1 0 01-.707-1.707L7 14.586V4z"
                                />
                            </svg>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                            <dl>
                                <dt
                                    class="text-sm font-medium text-gray-500 truncate"
                                >
                                    Всего категорий
                                </dt>
                                <dd class="text-lg font-medium text-gray-900">
                                    {{ totalCount }}
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Активные категории -->
            <div class="bg-white overflow-hidden shadow rounded-lg">
                <div class="p-5">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <svg
                                class="h-6 w-6 text-green-400"
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
                        </div>
                        <div class="ml-5 w-0 flex-1">
                            <dl>
                                <dt
                                    class="text-sm font-medium text-gray-500 truncate"
                                >
                                    Активные
                                </dt>
                                <dd class="text-lg font-medium text-gray-900">
                                    {{ activeCount }}
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Неактивные категории -->
            <div class="bg-white overflow-hidden shadow rounded-lg">
                <div class="p-5">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <svg
                                class="h-6 w-6 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"
                                />
                            </svg>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                            <dl>
                                <dt
                                    class="text-sm font-medium text-gray-500 truncate"
                                >
                                    Неактивные
                                </dt>
                                <dd class="text-lg font-medium text-gray-900">
                                    {{ inactiveCount }}
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            <!-- С описанием -->
            <div class="bg-white overflow-hidden shadow rounded-lg">
                <div class="p-5">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <svg
                                class="h-6 w-6 text-blue-400"
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
                        <div class="ml-5 w-0 flex-1">
                            <dl>
                                <dt
                                    class="text-sm font-medium text-gray-500 truncate"
                                >
                                    С описанием
                                </dt>
                                <dd class="text-lg font-medium text-gray-900">
                                    {{ categoriesWithDescription }}
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
    totalCount: {
        type: Number,
        default: 0,
    },
    categories: {
        type: Array,
        default: () => [],
    },
});

const activeCount = computed(() => {
    return props.categories.filter((category) => category.is_active).length;
});

const inactiveCount = computed(() => {
    return props.categories.filter((category) => !category.is_active).length;
});

const categoriesWithDescription = computed(() => {
    return props.categories.filter(
        (category) => category.description && category.description.trim()
    ).length;
});
</script>
