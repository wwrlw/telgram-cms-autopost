<template>
    <div
        class="mb-3 bg-white p-4 rounded-lg shadow"
        v-if="!loading || posts.length > 0"
    >
        <div class="space-y-4">
            <div
                class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4"
            >
                <div class="flex space-x-3">
                    <select
                        v-model="statusFilter"
                        @change="updateStatusFilter"
                        class="block w-full pl-3 pr-3 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                    >
                        <option value="">Все статусы</option>
                        <option value="unique">Уникальные</option>
                        <option value="duplicate">Дубликаты</option>
                    </select>
                </div>
            </div>

            <div
                class="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4"
            >
                <div class="flex-1">
                    <select
                        v-model="categoryFilter"
                        @change="updateCategoryFilter"
                        name="category"
                        id="category"
                        class="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">Все категории</option>
                        <option
                            v-for="category in categories"
                            :key="category.id"
                            :value="category.id"
                        >
                            {{ category.name }}
                        </option>
                    </select>
                </div>
                <div class="flex space-x-3">
                    <input
                        v-model="dateFromFilter"
                        @change="updateDateFilters"
                        type="date"
                        name="date_from"
                        id="date_from"
                        class="block px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <input
                        v-model="dateToFilter"
                        @change="updateDateFilters"
                        type="date"
                        name="date_to"
                        id="date_to"
                        class="block px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
            </div>

            <div
                class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4"
            >
                <div class="flex space-x-3">
                    <select
                        v-model="sortField"
                        @change="updateSortOptions"
                        class="block pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                    >
                        <option value="created_at">По дате создания</option>
                        <option value="timestamp">По времени поста</option>
                        <option value="source_channel">По каналу</option>
                        <option value="err">По ERR</option>
                    </select>
                    <select
                        v-model="sortOrder"
                        @change="updateSortOptions"
                        class="block pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                    >
                        <option value="desc">По убыванию</option>
                        <option value="asc">По возрастанию</option>
                    </select>
                </div>
                <button
                    @click="clearAllFilters"
                    class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <svg
                        class="h-4 w-4 mr-2"
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
                    Сбросить фильтры
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
    loading: {
        type: Boolean,
        default: false,
    },
    posts: {
        type: Array,
        default: () => [],
    },
    categories: {
        type: Array,
        default: () => [],
    },
});

const emit = defineEmits([
    "update:searchQuery",
    "update:statusFilter",
    "update:categoryFilter",
    "update:dateFilters",
    "update:sortOptions",
    "clearFilters",
]);

const searchQuery = ref("");
const statusFilter = ref("");
const categoryFilter = ref("");
const dateFromFilter = ref("");
const dateToFilter = ref("");
const sortField = ref("created_at");
const sortOrder = ref("desc");

// const updateSearch = () => {
//     emit("update:searchQuery", searchQuery.value);
// };

const updateStatusFilter = () => {
    emit("update:statusFilter", statusFilter.value);
};

const updateCategoryFilter = () => {
    emit("update:categoryFilter", categoryFilter.value);
};

const updateDateFilters = () => {
    emit("update:dateFilters", {
        dateFrom: dateFromFilter.value,
        dateTo: dateToFilter.value,
    });
};

const updateSortOptions = () => {
    emit("update:sortOptions", {
        sortField: sortField.value,
        sortOrder: sortOrder.value,
    });
};

const clearAllFilters = () => {
    searchQuery.value = "";
    statusFilter.value = "";
    categoryFilter.value = "";
    dateFromFilter.value = "";
    dateToFilter.value = "";
    sortField.value = "created_at";
    sortOrder.value = "desc";
    emit("clearFilters");
};

watch(
    () => props.posts,
    () => {},
    { immediate: true }
);
</script>
