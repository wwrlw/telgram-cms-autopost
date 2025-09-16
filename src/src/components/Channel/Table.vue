<template>
    <div class="bg-white shadow overflow-hidden sm:rounded-md">
        <div class="px-4 py-5 sm:p-6">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg leading-6 font-medium text-gray-900">
                    Каналы ({{ pagination.total }})
                </h3>
                <div class="flex items-center space-x-4">
                    <button
                        @click="$emit('create-channel')"
                        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                        </svg>
                        Добавить канал
                    </button>
                    <div
                        v-if="showPagination"
                        class="flex items-center space-x-2"
                    >
                        <label class="text-sm text-gray-500">Показать:</label>
                        <select
                            v-model="itemsPerPage"
                            class="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                        </select>
                    </div>
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
                                Название канала
                            </th>
                            <th
                                scope="col"
                                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                Channel ID
                            </th>
                            <th
                                scope="col"
                                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                Промпт
                            </th>
                            <th
                                scope="col"
                                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                Дата создания
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
                            v-for="channel in channels"
                            :key="channel.id"
                            :class="{
                                'bg-blue-50': selectedChannels.includes(
                                    channel.id
                                ),
                            }"
                            class="hover:bg-gray-50 transition-colors duration-150"
                        >
                            <td class="px-6 py-4 whitespace-nowrap">
                                <input
                                    type="checkbox"
                                    :value="channel.id"
                                    v-model="selectedChannels"
                                    class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                            </td>

                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="flex items-center">
                                    <div class="flex-shrink-0">
                                        <div
                                            class="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center"
                                        >
                                            <svg
                                                class="h-5 w-5 text-indigo-600"
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
                                    </div>
                                    <div class="ml-4">
                                        <div
                                            class="text-sm font-medium text-gray-900"
                                        >
                                            {{ getChannelDisplayName(channel) }}
                                        </div>
                                        <div class="text-sm text-gray-500">
                                            {{ getChannelTypeLabel(channel) }}
                                        </div>
                                    </div>
                                </div>
                            </td>

                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="text-sm text-gray-900 font-mono">
                                    {{ channel.channel_id }}
                                </div>
                            </td>

                            <td class="px-6 py-4">
                                <div class="text-sm text-gray-900 max-w-xs">
                                    <div v-if="channel.prompt" class="truncate" :title="channel.prompt">
                                        {{ channel.prompt }}
                                    </div>
                                    <div v-else class="text-gray-400 italic">
                                        Не указан
                                    </div>
                                </div>
                            </td>

                            <td
                                class="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                            >
                                <time :datetime="channel.created_at">{{
                                    formatDate(channel.created_at)
                                }}</time>
                            </td>

                            <td
                                class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                            >
                                <div class="flex items-center space-x-2 gap-2">
                                    <button
                                        @click="$emit('edit', channel)"
                                        class="text-indigo-600 hover:text-indigo-900 text-sm"
                                    >
                                        Редактировать
                                    </button>
                                    <button
                                        @click="$emit('delete', channel.id)"
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
                v-if="channels.length === 0 && !loading"
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
                    Нет каналов
                </h3>
                <p class="mt-1 text-sm text-gray-500">
                    Добавьте первый канал для начала работы.
                </p>
            </div>

            <Pagination
                v-if="showPagination"
                :pagination="pagination"
                @page-change="changePage"
                @items-per-page-change="changeItemsPerPage"
            />
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { formatDate } from "@/js/utils";
import Pagination from "@/components/Shared/Pagination.vue";

const props = defineProps({
    channels: {
        type: Array,
        required: true,
    },
    pagination: {
        type: Object,
        required: true,
    },
    showPagination: {
        type: Boolean,
        default: true,
    },
    loading: {
        type: Boolean,
        default: false,
    },
    selectedChannels: {
        type: Array,
        default: () => [],
    },
});

const emit = defineEmits([
    "update:selectedChannels",
    "delete",
    "edit",
    "create-channel",
    "page-change",
    "items-per-page-change",
]);

const selectAll = ref(false);

const selectedChannels = computed({
    get: () => props.selectedChannels,
    set: (value) => emit("update:selectedChannels", value),
});

const itemsPerPage = computed({
    get: () => props.pagination.limit,
    set: (value) => emit("items-per-page-change", parseInt(value)),
});

const changePage = (page) => {
    emit("page-change", page);
};

const changeItemsPerPage = (limit) => {
    emit("items-per-page-change", limit);
};

const toggleSelectAll = () => {
    if (selectAll.value) {
        selectedChannels.value = props.channels.map((channel) => channel.id);
    } else {
        selectedChannels.value = [];
    }
};

watch(selectedChannels, () => {
    selectAll.value =
        selectedChannels.value.length === props.channels.length &&
        props.channels.length > 0;
});

const getChannelDisplayName = (channel) => {
    if (channel.is_private) {
        return `ID: ${channel.channel_id}`;
    }
    return channel.username;
};

const getChannelTypeLabel = (channel) => {
    if (channel.is_private) {
        return "Приватный канал";
    }
    return "Публичный канал";
};
</script>
