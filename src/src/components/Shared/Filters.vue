<template>
    <div
        class="mb-3 bg-white p-4 rounded-lg shadow"
        v-if="!loading || posts.length > 0"
    >
        <div class="space-y-4">
            <div
                v-if="showStatusFilter"
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
                <div v-if="showCategoryFilter" class="flex-1">
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
                <div v-if="showChannelFilter" class="flex-1">
                    <select
                        v-model="channelFilter"
                        @change="updateChannelFilter"
                        name="channel"
                        id="channel"
                        class="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">Все каналы</option>
                        <option
                            v-for="channel in channels"
                            :key="channel._id || channel.id"
                            :value="channel.channel_id"
                        >
                            {{ channel.name }}
                        </option>
                    </select>
                </div>
                <div v-if="showDateFilters" class="flex space-x-3">
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
                v-if="showSortOptions"
                class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4"
            >
                <div class="flex space-x-3">
                    <select
                        v-model="sortField"
                        @change="updateSortOptions"
                        class="block pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                    >
                        <option
                            v-for="option in sortOrderOptions"
                            :key="option.value"
                            :value="option.value"
                        >
                            {{ option.label }}
                        </option>
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
                    <X class="h-4 w-4 mr-2" />
                    Сбросить фильтры
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { X } from "lucide-vue-next";

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
    // Значения фильтров из URL
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
const statusFilter = ref(props.statusFilterValue);
const categoryFilter = ref(props.categoryFilterValue);
const channelFilter = ref(props.channelFilterValue);
const dateFromFilter = ref(props.dateFromFilterValue);
const dateToFilter = ref(props.dateToFilterValue);
const sortField = ref(props.sortFieldValue);
const sortOrder = ref(props.sortOrderValue);

// const updateSearch = () => {
//     emit("update:searchQuery", searchQuery.value);
// };

const updateStatusFilter = () => {
    emit("update:statusFilter", statusFilter.value);
};

const updateCategoryFilter = () => {
    emit("update:categoryFilter", categoryFilter.value);
};

const updateChannelFilter = () => {
    emit("update:channelFilter", channelFilter.value);
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
    channelFilter.value = "";
    dateFromFilter.value = "";
    dateToFilter.value = "";
    sortField.value = "created_at";
    sortOrder.value = "desc";
    emit("clearFilters");
};

// Синхронизация с внешними значениями
watch(() => props.statusFilterValue, (newValue) => {
    statusFilter.value = newValue;
});

watch(() => props.categoryFilterValue, (newValue) => {
    categoryFilter.value = newValue;
});

watch(() => props.channelFilterValue, (newValue) => {
    channelFilter.value = newValue;
});

watch(() => props.dateFromFilterValue, (newValue) => {
    dateFromFilter.value = newValue;
});

watch(() => props.dateToFilterValue, (newValue) => {
    dateToFilter.value = newValue;
});

watch(() => props.sortFieldValue, (newValue) => {
    sortField.value = newValue;
});

watch(() => props.sortOrderValue, (newValue) => {
    sortOrder.value = newValue;
});

watch(
    () => props.posts,
    () => {},
    { immediate: true }
);
</script>
