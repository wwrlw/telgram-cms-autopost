<template>
    <div class="min-h-screen bg-gray-50 py-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="mb-8">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-3xl font-bold text-gray-900">
                            Отложенные публикации
                        </h1>
                        <p class="mt-2 text-sm text-gray-600">
                            Управление запланированными постами для публикации в
                            Telegram каналах
                        </p>
                    </div>
                </div>
            </div>

            <div class="mb-6">
                <nav class="flex space-x-8" aria-label="Tabs">
                    <button
                        @click="activeTab = 'scheduled'"
                        :class="[
                            activeTab === 'scheduled'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                            'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm',
                        ]"
                    >
                        📅 Отложенные ({{ scheduledPosts.length }})
                    </button>
                    <button
                        @click="activeTab = 'published'"
                        :class="[
                            activeTab === 'published'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                            'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm',
                        ]"
                    >
                        ✅ Опубликованные ({{ publishedPosts.length }})
                    </button>
                </nav>
            </div>

            <Filters
                :loading="loading"
                :posts="posts"
                :categories="categories"
                @update:searchQuery="handleSearchChange"
                @update:statusFilter="handleStatusFilterChange"
                @update:categoryFilter="handleCategoryFilterChange"
                @update:dateFilters="handleDateFiltersChange"
                @update:sortOptions="handleSortOptionsChange"
                @clearFilters="handleClearFilters"
            />

            <div v-show="activeTab === 'scheduled'">
                <Thumbs
                    :posts="scheduledPosts"
                    :categories="categories"
                    :channels="channels"
                    :loading="loading"
                    @cancel="cancelSchedule"
                />
            </div>

            <div
                v-show="activeTab === 'published'"
                class="bg-white shadow overflow-hidden sm:rounded-md"
            >
                <Thumbs
                    :posts="publishedPosts"
                    :categories="categories"
                    :channels="channels"
                    :loading="loading"
                    @cancel="cancelSchedule"
                />
            </div>
        </div>

        <ConfirmModal
            :show="showConfirmModal"
            :message="confirmMessage"
            @confirm="onConfirm"
            @cancel="onCancelConfirm"
        />
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import http from "../js/http.js";
import ConfirmModal from "@/components/Modal/ConfirmModal.vue";
import Thumbs from "@/components/Thumb/Thumbs.vue";
import Filters from "@/components/Shared/Filters.vue";
import { useEventBus, EVENTS } from "@/composables/useEventBus";

const { on: onEvent, emit: emitEvent } = useEventBus();
const scheduledPosts = ref([]);
const publishedPosts = ref([]);
const loading = ref(true);
const loadingPublished = ref(true);
const channels = ref([]);
const categories = ref([]);
const activeTab = ref("scheduled");

const showConfirmModal = ref(false);
const confirmMessage = ref("");
let confirmAction = null;
let confirmPayload = null;

function showConfirm(message, action, payload = null) {
    confirmMessage.value = message;
    confirmAction = action;
    confirmPayload = payload;
    showConfirmModal.value = true;
}

function onConfirm() {
    showConfirmModal.value = false;
    if (confirmAction) confirmAction(confirmPayload);
}
function onCancelConfirm() {
    showConfirmModal.value = false;
    confirmAction = null;
    confirmPayload = null;
}

const loadScheduledPosts = () => {
    loading.value = true;
    http.getScheduledPosts((response) => {
        if (response.success) {
            scheduledPosts.value = response.data || [];
            loading.value = false;
        } else {
            window.$toast.error(
                "Ошибка загрузки отложенных публикаций: " + response.message
            );
            loading.value = false;
        }
    });
};

const loadPublishedPosts = () => {
    loadingPublished.value = true;
    http.getPublishedPosts((response) => {
        if (response.success) {
            publishedPosts.value = response.data || [];
            loadingPublished.value = false;
            console.log(publishedPosts.value);
        } else {
            window.$toast.error(
                "Ошибка загрузки опубликованных постов: " + response.message
            );
            loadingPublished.value = false;
        }
    });
};

// const loadCategories = () => {
//     http.categories((response) => {
//         if (response.success) {
//             categories.value = response.data || [];
//             console.log(categories);
//         } else {
//             console.error("Ошибка загрузки категорий:", response.message);
//         }
//     });
// };

const getPreviewText = (text) => {
    if (!text) return "Текст отсутствует";
    return text.length > 80 ? text.substring(0, 80) + "..." : text;
};

const cancelSchedule = (post) => {
    showConfirm(
        `Вы действительно хотите отменить публикацию поста "${getPreviewText(post.text)}"?`,
        (postId) => {
            http.cancelScheduledPost({ id: postId }, (response) => {
                if (response.success) {
                    window.$toast.success("Отложенная публикация отменена");
                    emitEvent(EVENTS.SCHEDULED_POST_CANCELLED, { id: postId });
                    loadScheduledPosts();
                } else {
                    window.$toast.error(
                        "Ошибка отмены публикации: " + response.message
                    );
                }
            });
        },
        post._id
    );
};

onMounted(() => {
    loadScheduledPosts();
    loadPublishedPosts();
    // loadCategories();
    // loadChannels();

    onEvent(EVENTS.SCHEDULED_POST_CREATED, () => {
        loadScheduledPosts();
    });

    onEvent(EVENTS.SCHEDULED_POST_UPDATED, () => {
        console.log(
            "Scheduled post updated event received, refreshing scheduled posts"
        );
        loadScheduledPosts();
    });

    onEvent(EVENTS.SCHEDULED_POST_DELETED, () => {
        console.log(
            "Scheduled post deleted event received, refreshing scheduled posts"
        );
        loadScheduledPosts();
    });

    onEvent(EVENTS.SCHEDULED_POST_CANCELLED, () => {
        console.log(
            "Scheduled post cancelled event received, refreshing scheduled posts"
        );
        loadScheduledPosts();
    });

    onEvent(EVENTS.POST_PUBLISHED, () => {
        console.log(
            "Post published event received, refreshing published posts"
        );
        loadPublishedPosts();
    });

    onEvent(EVENTS.REFRESH_SCHEDULED_POSTS, () => {
        console.log("Refresh scheduled posts event received");
        loadScheduledPosts();
        loadPublishedPosts();
    });
});
</script>
