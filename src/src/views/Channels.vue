<template>
    <div class="min-h-screen bg-gray-50">
        <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <StatsCards
                v-if="!loading || channels.length > 0"
                :totalCount="totalCount"
                :data="channels"
                type="channels"
            />

            <Search
                :loading="loading"
                :channels="channels"
                @update:searchQuery="handleSearchChange"
                @clearFilters="handleClearFilters"
            />

            <ChannelTableSkeleton
                v-if="loading && channels.length === 0"
                :item-count="10"
            />

            <ChannelsTable
                v-else
                :channels="channels"
                :pagination="pagination"
                :loading="loading"
                :selected-channels="selectedChannels"
                @update:selectedChannels="selectedChannels = $event"
                @delete="deleteChannel"
                @edit="editChannel"
                @create-channel="createChannel"
                @page-change="changePage"
                @items-per-page-change="changeItemsPerPage"
            />

            <Actions
                :selected-channels="selectedChannels"
                @bulk-delete="bulkDelete"
                @clear-selection="clearSelection"
            />

            <CreateChannelModal
                v-model:show="showCreateModal"
                :channel="editingChannel"
                @submit="submitChannel"
            />

            <ConfirmModal
                :show="showConfirmModal"
                :message="confirmMessage"
                @confirm="onConfirm"
                @cancel="onCancelConfirm"
            />
        </main>
    </div>
</template>

<script setup>
import { ref, onMounted, inject, watch } from "vue";
import http from "@/js/http";
import StatsCards from "@/components/StatsCards.vue";
import ChannelsTable from "@/components/Channel/Table.vue";
import Actions from "@/components/Shared/Actions.vue";
import Search from "@/components/Shared/Search.vue";
import CreateChannelModal from "@/components/Modal/CreateChannelModal.vue";
import PostTableSkeleton from "@/components/PostTableSkeleton.vue";
import ConfirmModal from "@/components/Modal/ConfirmModal.vue";

const ChannelTableSkeleton = PostTableSkeleton;

const refreshTrigger = inject("refreshTrigger", null);
const setLoading = inject("setLoading", null);

const channels = ref([]);
const searchQuery = ref("");
const selectedChannels = ref([]);
const showCreateModal = ref(false);
const editingChannel = ref(null);
const loading = ref(false);
const totalCount = ref(0);
const showConfirmModal = ref(false);
const confirmMessage = ref("");
let confirmAction = null;
let confirmPayload = null;

const pagination = ref({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
});

const channelsService = async (params = {}) => {
    loading.value = true;
    if (setLoading) setLoading(true);

    try {
        return new Promise((resolve, reject) => {
            const requestParams = {
                page: params.page || pagination.value.page,
                limit: params.limit || pagination.value.limit,
                search: searchQuery.value || undefined,
            };

            Object.keys(requestParams).forEach((key) => {
                if (requestParams[key] === undefined) {
                    delete requestParams[key];
                }
            });

            http.channels(
                requestParams,
                (res) => {
                    channels.value = res.data || [];
                    const paginationData = res.pagination ||
                        res.params || {
                            page: 1,
                            limit: 25,
                            total: res.data?.length || 0,
                            totalPages: Math.ceil((res.data?.length || 0) / 25),
                            hasNext: false,
                            hasPrev: false,
                        };

                    pagination.value = {
                        page: paginationData.page,
                        limit: paginationData.limit,
                        total: paginationData.total,
                        totalPages: paginationData.totalPages,
                        hasNext: paginationData.hasNext,
                        hasPrev: paginationData.hasPrev,
                    };
                    totalCount.value = paginationData.total;
                    loading.value = false;
                    if (setLoading) setLoading(false);
                    resolve(res.data);
                },
                (err) => {
                    console.error("Error loading channels:", err);
                    loading.value = false;
                    if (setLoading) setLoading(false);
                    reject(err);
                }
            );
        });
    } catch (error) {
        console.error("Error loading channels:", error);
        loading.value = false;
        if (setLoading) setLoading(false);
        throw error;
    }
};

const changePage = (page) => {
    if (page >= 1 && page <= pagination.value.totalPages) {
        pagination.value.page = page;
        channelsService({ page });
    }
};

const changeItemsPerPage = (limit) => {
    pagination.value.limit = limit;
    pagination.value.page = 1;
    channelsService({ page: 1, limit });
};

// Добавляем debounce для поиска
let searchTimeout;
const handleSearchChange = (query) => {
    searchQuery.value = query;
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        pagination.value.page = 1;
        channelsService({ page: 1 });
    }, 500);
};

const handleClearFilters = () => {
    searchQuery.value = "";
    pagination.value.page = 1;
    channelsService({ page: 1 });
};

const createChannel = () => {
    editingChannel.value = null;
    showCreateModal.value = true;
};

const editChannel = (channel) => {
    editingChannel.value = channel;
    showCreateModal.value = true;
};

const submitChannel = (formData) => {
    if (editingChannel.value) {
        http.updateChannel(formData, (res) => {
            if (res.success) {
                window.$toast.success("Канал успешно обновлен!");
                channelsService();
            } else {
                window.$toast.error("Ошибка: " + res.message);
            }
        });
    } else {
        http.createChannel(formData, (res) => {
            if (res.success) {
                window.$toast.success("Канал успешно создан!");
                channelsService();
            } else {
                window.$toast.error("Ошибка: " + res.message);
            }
        });
    }
};

const showConfirm = (message, action, payload = null) => {
    confirmMessage.value = message;
    confirmAction = action;
    confirmPayload = payload;
    showConfirmModal.value = true;
};

const onConfirm = () => {
    showConfirmModal.value = false;
    if (confirmAction) confirmAction(confirmPayload);
};
const onCancelConfirm = () => {
    showConfirmModal.value = false;
    confirmAction = null;
    confirmPayload = null;
};

const deleteChannel = (channelId) => {
    showConfirm(
        "Вы уверены, что хотите удалить этот канал?",
        (id) => {
            http.deleteChannel({ id }, (res) => {
                if (res.success) {
                    window.$toast.success("Канал успешно удален!");
                    channelsService();
                } else {
                    window.$toast.error("Ошибка: " + res.message);
                }
            });
        },
        channelId
    );
};

const bulkDelete = () => {
    showConfirm(
        `Вы уверены, что хотите удалить ${selectedChannels.value.length} каналов?`,
        () => {
            const deletePromises = selectedChannels.value.map((channelId) => {
                return new Promise((resolve) => {
                    http.deleteChannel({ id: channelId }, resolve);
                });
            });
            Promise.all(deletePromises).then(() => {
                window.$toast.success("Выбранные каналы удалены!");
                clearSelection();
                channelsService();
            });
        }
    );
};

const clearSelection = () => {
    selectedChannels.value = [];
};

watch(refreshTrigger, () => {
    if (refreshTrigger && refreshTrigger.value > 0) {
        channelsService();
    }
});

onMounted(() => {
    channelsService();
});
</script>
