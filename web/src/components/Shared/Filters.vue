<template>
    <div v-if="!loading || posts.length > 0" class="mb-4">
        <div
            class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
            <div
                v-if="showStatusFilter"
                class="border-b border-gray-100 px-4 sm:px-6 pt-3"
            >
                <div class="flex space-x-6 text-sm">
                    <button
                        type="button"
                        class="pb-3 font-medium transition border-b-2"
                        :class="
                            statusFilter === ''
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        "
                        @click="setStatus('')"
                    >
                        Все посты
                    </button>
                    <button
                        type="button"
                        class="pb-3 font-medium transition border-b-2"
                        :class="
                            statusFilter === 'unique'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        "
                        @click="setStatus('unique')"
                    >
                        Уникальные
                    </button>
                    <button
                        type="button"
                        class="pb-3 font-medium transition border-b-2"
                        :class="
                            statusFilter === 'duplicate'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        "
                        @click="setStatus('duplicate')"
                    >
                        Дубликаты
                    </button>
                </div>
            </div>

            <div
                class="p-4 flex flex-col md:flex-row gap-4 justify-between items-center bg-white"
            >
                <div class="relative w-full md:w-96">
                    <span
                        class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"
                    >
                        <SearchIcon class="w-4 h-4" />
                    </span>
                    <input
                        v-model="searchQuery"
                        @input="updateSearch"
                        type="text"
                        class="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                        placeholder="Поиск по названию или тексту..."
                    />
                </div>

                <!-- Кнопки фильтров -->
                <div
                    class="flex items-center gap-3 w-full md:w-auto overflow-x-auto"
                >
                    <!-- Категория -->
                    <div
                        v-if="showCategoryFilter"
                        class="relative inline-flex items-center"
                    >
                        <span
                            class="absolute left-3 inset-y-0 flex items-center pointer-events-none text-gray-400"
                        >
                            <FilterIcon class="w-4 h-4" />
                        </span>
                        <select
                            v-model="categoryFilter"
                            @change="updateCategoryFilter"
                            name="category"
                            id="category"
                            class="pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                        >
                            <option value="">Категория</option>
                            <option
                                v-for="category in categories"
                                :key="category.id || category._id || category.name"
                                :value="category.name"
                            >
                                {{ category.name }}
                            </option>
                        </select>
                        <span
                            class="absolute right-3 inset-y-0 flex items-center pointer-events-none text-gray-400 text-xs"
                        >
                            ▼
                        </span>
                    </div>

                    <!-- Канал -->
                    <div
                        v-if="showChannelFilter"
                        class="relative inline-flex items-center"
                    >
                        <select
                            v-model="channelFilter"
                            @change="updateChannelFilter"
                            name="channel"
                            id="channel"
                            class="pl-3 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                        >
                            <option value="">Канал</option>
                            <option
                                v-for="channel in channels"
                                :key="channel._id || channel.id"
                                :value="channel.channel_id"
                            >
                                {{ channel.name }}
                            </option>
                        </select>
                        <span
                            class="absolute right-3 inset-y-0 flex items-center pointer-events-none text-gray-400 text-xs"
                        >
                            ▼
                        </span>
                    </div>

                    <!-- Даты -->
                    <div v-if="showDateFilters" class="flex items-center gap-2">
                        <div class="relative">
                            <span
                                class="absolute left-3 inset-y-0 flex items-center pointer-events-none text-gray-400"
                            >
                                <CalendarIcon class="w-4 h-4" />
                            </span>
                            <input
                                v-model="dateFromFilter"
                                @change="updateDateFilters"
                                type="date"
                                name="date_from"
                                id="date_from"
                                class="pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <span class="text-gray-400 text-xs">—</span>
                        <input
                            v-model="dateToFilter"
                            @change="updateDateFilters"
                            type="date"
                            name="date_to"
                            id="date_to"
                            class="px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <!-- Сортировка -->
                    <div
                        v-if="showSortOptions"
                        class="flex items-center gap-2 ml-auto"
                    >
                        <select
                            v-model="sortField"
                            @change="updateSortOptions"
                            class="hidden sm:block pl-3 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                        >
                            <option
                                v-for="option in sortOrderOptions"
                                :key="option.value"
                                :value="option.value"
                            >
                                {{ option.label }}
                            </option>
                        </select>

                        <button
                            type="button"
                            class="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-indigo-600 transition bg-white"
                            @click="toggleSortOrder"
                            title="Сортировка"
                        >
                            <SortIcon class="w-4 h-4" />
                        </button>
                    </div>

                    <!-- Сброс -->
                    <button
                        type="button"
                        class="ml-1 text-sm text-gray-400 hover:text-red-500 transition font-medium whitespace-nowrap"
                        @click="clearAllFilters"
                    >
                        Сбросить
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from "vue";
import {
    X,
    Search as SearchIcon,
    Filter as FilterIcon,
    Calendar as CalendarIcon,
    ArrowDownWideNarrow as SortIcon,
} from "lucide-vue-next";

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
    channels: {
        type: Array,
        default: () => [],
    },
    showChannelFilter: {
        type: Boolean,
        default: true,
    },
    showStatusFilter: {
        type: Boolean,
        default: true,
    },
    showCategoryFilter: {
        type: Boolean,
        default: true,
    },
    showDateFilters: {
        type: Boolean,
        default: true,
    },
    showSortOptions: {
        type: Boolean,
        default: true,
    },
    statusFilterValue: {
        type: String,
        default: "",
    },
    categoryFilterValue: {
        type: String,
        default: "",
    },
    channelFilterValue: {
        type: String,
        default: "",
    },
    dateFromFilterValue: {
        type: String,
        default: "",
    },
    dateToFilterValue: {
        type: String,
        default: "",
    },
    sortFieldValue: {
        type: String,
        default: "created_at",
    },
    sortOrderValue: {
        type: String,
        default: "desc",
    },
});

const sortOrderOptions = ref([
    { label: "По дате создания", value: "created_at" },
    { label: "По времени поста", value: "timestamp" },
    { label: "По каналу", value: "source_channel" },
    { label: "По ERR", value: "err" },
]);

const emit = defineEmits([
    "update:searchQuery",
    "update:statusFilter",
    "update:categoryFilter",
    "update:channelFilter",
    "update:dateFilters",
    "update:sortOptions",
    "clearFilters",
]);

const searchQuery = ref("");

const statusFilter = computed({
    get: () => props.statusFilterValue,
    set: (v) => emit("update:statusFilter", v),
});

const categoryFilter = computed({
    get: () => props.categoryFilterValue,
    set: (v) => emit("update:categoryFilter", v),
});

const channelFilter = computed({
    get: () => props.channelFilterValue,
    set: (v) => emit("update:channelFilter", v),
});

const sortField = computed({
    get: () => props.sortFieldValue,
    set: (v) =>
        emit("update:sortOptions", {
            sortField: v,
            sortOrder: sortOrder.value,
        }),
});

const sortOrder = computed({
    get: () => props.sortOrderValue,
    set: (v) =>
        emit("update:sortOptions", {
            sortField: sortField.value,
            sortOrder: v,
        }),
});

const updateSearch = () => {
    emit("update:searchQuery", searchQuery.value);
};

const dateFromFilter = computed({
    get: () => props.dateFromFilterValue,
    set: (v) =>
        emit("update:dateFilters", { dateFrom: v, dateTo: dateToFilter.value }),
});

const dateToFilter = computed({
    get: () => props.dateToFilterValue,
    set: (v) =>
        emit("update:dateFilters", {
            dateFrom: dateFromFilter.value,
            dateTo: v,
        }),
});

const updateStatusFilter = () =>
    emit("update:statusFilter", statusFilter.value);
const updateCategoryFilter = () =>
    emit("update:categoryFilter", categoryFilter.value);
const updateChannelFilter = () =>
    emit("update:channelFilter", channelFilter.value);
const updateDateFilters = () =>
    emit("update:dateFilters", {
        dateFrom: dateFromFilter.value,
        dateTo: dateToFilter.value,
    });
const updateSortOptions = () =>
    emit("update:sortOptions", {
        sortField: sortField.value,
        sortOrder: sortOrder.value,
    });

// Установка статуса по вкладкам
const setStatus = (value) => {
    statusFilter.value = value;
    updateStatusFilter();
};

const toggleSortOrder = () => {
    sortOrder.value = sortOrder.value === "desc" ? "asc" : "desc";
    updateSortOptions();
};

const clearAllFilters = () => {
    statusFilter.value = "";
    categoryFilter.value = "";
    channelFilter.value = "";
    dateFromFilter.value = "";
    dateToFilter.value = "";
    sortField.value = "created_at";
    sortOrder.value = "desc";
    searchQuery.value = "";
    emit("clearFilters");
};
</script>
