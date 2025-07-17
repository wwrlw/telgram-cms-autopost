<template>
    <div class="bg-white shadow overflow-hidden sm:rounded-md">
        <div class="px-4 py-5 sm:p-6">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg leading-6 font-medium text-gray-900">
                    Категории ({{ categories.length }})
                </h3>
                <div class="flex items-center space-x-2">
                    <button
                        class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                        @click="$emit('create-category')"
                    >
                        Создать категорию
                    </button>
                </div>
            </div>

            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th
                                scope="col"
                                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                <input
                                    type="checkbox"
                                    v-model="selectAll"
                                    @change="toggleSelectAll"
                                    class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                            </th>
                            <th
                                scope="col"
                                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                Название
                            </th>
                            <th
                                scope="col"
                                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                Описание
                            </th>
                            <th
                                scope="col"
                                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                Цвет
                            </th>
                            <th
                                scope="col"
                                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                Статус
                            </th>
                            <th
                                scope="col"
                                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                Действия
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        <tr
                            v-for="category in categories"
                            :key="category.id"
                            :class="{
                                'bg-blue-50': selectedCategories.includes(
                                    category.id
                                ),
                            }"
                            class="hover:bg-gray-50 transition-colors duration-150"
                        >
                            <td class="px-6 py-4 whitespace-nowrap">
                                <input
                                    type="checkbox"
                                    :value="category.id"
                                    v-model="selectedCategories"
                                    class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                            </td>

                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="flex items-center">
                                    <div
                                        class="flex-shrink-0 h-4 w-4 rounded-full mr-3"
                                        :style="{
                                            backgroundColor:
                                                category.color || '#3B82F6',
                                        }"
                                    ></div>
                                    <div
                                        class="text-sm font-medium text-gray-900"
                                    >
                                        {{ category.name }}
                                    </div>
                                </div>
                            </td>

                            <td class="px-6 py-4">
                                <div class="text-sm text-gray-500">
                                    {{ category.description || "Без описания" }}
                                </div>
                            </td>

                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="flex items-center space-x-2">
                                    <div
                                        class="h-6 w-6 rounded border border-gray-300"
                                        :style="{
                                            backgroundColor:
                                                category.color || '#3B82F6',
                                        }"
                                    ></div>
                                    <span class="text-sm text-gray-500">{{
                                        category.color || "#3B82F6"
                                    }}</span>
                                </div>
                            </td>

                            <td class="px-6 py-4 whitespace-nowrap">
                                <span
                                    :class="[
                                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                                        category.is_active
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-800',
                                    ]"
                                >
                                    <svg
                                        :class="[
                                            'mr-1.5 h-2 w-2',
                                            category.is_active
                                                ? 'text-green-400'
                                                : 'text-gray-400',
                                        ]"
                                        fill="currentColor"
                                        viewBox="0 0 8 8"
                                    >
                                        <circle cx="4" cy="4" r="3" />
                                    </svg>
                                    {{
                                        category.is_active
                                            ? "Активна"
                                            : "Неактивна"
                                    }}
                                </span>
                            </td>

                            <td
                                class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                            >
                                <div class="flex items-center space-x-2 gap-2">
                                    <button
                                        @click="$emit('edit', category)"
                                        class="text-indigo-600 hover:text-indigo-900 text-sm"
                                    >
                                        Редактировать
                                    </button>
                                    <button
                                        @click="$emit('delete', category.id)"
                                        class="text-red-600 hover:text-red-900 text-sm"
                                    >
                                        Удалить
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div
                v-if="categories.length === 0 && !loading"
                class="text-center py-12"
            >
                <svg
                    class="mx-auto h-12 w-12 text-gray-400"
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
                <h3 class="mt-2 text-sm font-medium text-gray-900">
                    Нет категорий
                </h3>
                <p class="mt-1 text-sm text-gray-500">
                    Начните с создания первой категории для организации
                    контента.
                </p>
                <div class="mt-6">
                    <button
                        @click="$emit('create-category')"
                        class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <svg
                            class="-ml-1 mr-2 h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                        </svg>
                        Создать категорию
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";

const props = defineProps({
    categories: {
        type: Array,
        required: true,
    },
    loading: {
        type: Boolean,
        default: false,
    },
    selectedCategories: {
        type: Array,
        default: () => [],
    },
});

const emit = defineEmits([
    "update:selectedCategories",
    "edit",
    "delete",
    "create-category",
]);

const selectAll = ref(false);

const selectedCategories = computed({
    get: () => props.selectedCategories,
    set: (value) => emit("update:selectedCategories", value),
});

const toggleSelectAll = () => {
    if (selectAll.value) {
        selectedCategories.value = props.categories.map(
            (category) => category.id
        );
    } else {
        selectedCategories.value = [];
    }
};

watch(selectedCategories, () => {
    selectAll.value =
        selectedCategories.value.length === props.categories.length &&
        props.categories.length > 0;
});
</script>
