<template>
    <div class="min-h-screen bg-gray-50">
        <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <StatsCards
                v-if="!loading || channels.length > 0"
                :totalCount="totalCount"
                :data="channels"
                type="channels"
                :activeCount="activeCount"
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
                :pagination="infinitePagination"
                :show-pagination="false"
                :loading="loading"
                :selected-channels="selectedChannels"
                @update:selectedChannels="selectedChannels = $event"
                @delete="deleteChannel"
                @edit="editChannel"
                @create-channel="createChannel"
                @items-per-page-change="changeItemsPerPage"
            />

            <div
                v-if="hasMore && !loading"
                ref="infiniteScrollTrigger"
                class="h-12"
            ></div>

            <div v-if="infiniteScrollLoading" class="flex justify-center py-6">
                <svg
                    class="animate-spin h-6 w-6 text-indigo-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        class="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="4"
                    ></circle>
                    <path
                        class="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    ></path>
                </svg>
            </div>

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
import { ref, onMounted, onUnmounted, inject, watch, nextTick } from "vue";
import http from "@/js/http";
import StatsCards from "@/components/StatsCards.vue";
import ChannelsTable from "@/components/Channel/Table.vue";
import Actions from "@/components/Shared/Actions.vue";
import Search from "@/components/Shared/Search.vue";
import CreateChannelModal from "@/components/Modal/CreateChannelModal.vue";
import PostTableSkeleton from "@/components/PostTableSkeleton.vue";
import ConfirmModal from "@/components/Modal/ConfirmModal.vue";
import { useApiCache } from "@/composables/useApiCache";
import { useInfiniteScroll } from "@/composables/useInfiniteScroll";

const ChannelTableSkeleton = PostTableSkeleton;
const { debouncedSearch } = useApiCache();

const refreshTrigger = inject("refreshTrigger", ref(0));
const setLoading = inject("setLoading", null);

const channels = ref([]);
const allChannels = ref([]);
const searchQuery = ref("");
const selectedChannels = ref([]);
const showCreateModal = ref(false);
const editingChannel = ref(null);
const loading = ref(false);
const totalCount = ref(0);
const activeCount = ref(0);
const showConfirmModal = ref(false);
const confirmMessage = ref("");
let confirmAction = null;
let confirmPayload = null;

// Инфинит-скролл
const loadSize = ref(25);
const infiniteScrollTrigger = ref(null);
const infiniteScrollLoading = ref(false);
const hasMore = ref(true);
const { createObserver, destroy } = useInfiniteScroll();

// Фиктивная пагинация, чтобы таблица показала селектор количества на странице
const infinitePagination = ref({
    page: 1,
    limit: loadSize.value,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
});

const channelsService = async (params = {}) => {
    loading.value = true;
    if (setLoading) setLoading(true);

    try {
        return new Promise((resolve, reject) => {
            const requestParams = {
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
                    allChannels.value = res.data || [];
                    activeCount.value = (res.data || []).filter(
                        (ch) => !ch.is_private || ch.channel_id
                    ).length;
                    totalCount.value = allChannels.value.length;

                    channels.value = allChannels.value.slice(0, loadSize.value);
                    hasMore.value = channels.value.length < totalCount.value;
                    infinitePagination.value = {
                        page: 1,
                        limit: loadSize.value,
                        total: totalCount.value,
                        totalPages: 1,
                        hasNext: false,
                        hasPrev: false,
                    };

                    loading.value = false;
                    if (setLoading) setLoading(false);
                    resolve(channels.value);
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

const initializeInfiniteScroll = async () => {
    destroy();
    await nextTick();
    const observer = createObserver(loadMore);
    if (observer && infiniteScrollTrigger.value) {
        observer.observe(infiniteScrollTrigger.value);
    }
};

const loadMore = async () => {
    if (!hasMore.value || infiniteScrollLoading.value) return;
    infiniteScrollLoading.value = true;
    const current = channels.value.length;
    const next = current + loadSize.value;
    const slice = allChannels.value.slice(current, next);
    channels.value = channels.value.concat(slice);
    hasMore.value = channels.value.length < totalCount.value;
    infiniteScrollLoading.value = false;
};

const changeItemsPerPage = (limit) => {
    loadSize.value = parseInt(limit);
    infinitePagination.value.limit = loadSize.value;
    channels.value = allChannels.value.slice(0, loadSize.value);
    hasMore.value = channels.value.length < totalCount.value;
    initializeInfiniteScroll();
};

const handleSearchChange = async (query) => {
    searchQuery.value = query;
    await debouncedSearch(async () => {
        hasMore.value = true;
        await channelsService();
        await initializeInfiniteScroll();
    }, 500);
};

const handleClearFilters = async () => {
    searchQuery.value = "";
    hasMore.value = true;
    await channelsService();
    await initializeInfiniteScroll();
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

const refreshChannelsHandler = async () => {
    console.log("Refresh channels event received");
    loading.value = true;
    if (setLoading) setLoading(true);

    try {
        await channelsService();
    } catch (error) {
        console.error("Error refreshing channels:", error);
    } finally {
        loading.value = false;
        if (setLoading) setLoading(false);
    }
};

watch(refreshTrigger, () => {
    if (refreshTrigger && refreshTrigger.value > 0) {
        channelsService();
    }
});

onMounted(() => {
    channelsService();

    window.addEventListener("refreshChannels", refreshChannelsHandler);
    initializeInfiniteScroll();
});

onUnmounted(() => {
    window.removeEventListener("refreshChannels", refreshChannelsHandler);
    destroy();
});

watch(loading, async (val) => {
    if (!val && hasMore.value) {
        await initializeInfiniteScroll();
    }
});
</script>
