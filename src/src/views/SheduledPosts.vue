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

            <div v-show="activeTab === 'scheduled'">
                <ScheduledPostsGrid
                    :posts="scheduledPosts"
                    :categories="categories"
                    :channels="channels"
                    :loading="loading"
                    @edit="editSchedule"
                    @cancel="cancelSchedule"
                />
            </div>

            <div
                v-show="activeTab === 'published'"
                class="bg-white shadow overflow-hidden sm:rounded-md"
            >
                <div v-if="loadingPublished" class="p-8 text-center">
                    <div
                        class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"
                    ></div>
                    <p class="mt-2 text-sm text-gray-500">
                        Загружаем опубликованные посты...
                    </p>
                </div>

                <div
                    v-else-if="publishedPosts.length === 0"
                    class="p-8 text-center text-gray-500"
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
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <h3 class="mt-2 text-sm font-medium text-gray-900">
                        Нет опубликованных постов
                    </h3>
                    <p class="mt-1 text-sm text-gray-500">
                        Автоматически опубликованные посты появятся здесь.
                    </p>
                </div>

                <ul v-else class="divide-y divide-gray-200">
                    <li
                        v-for="post in publishedPosts"
                        :key="post._id"
                        class="px-6 py-4"
                    >
                        <div class="flex items-center justify-between">
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center">
                                    <div class="flex-shrink-0">
                                        <span
                                            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                        >
                                            ✅ Опубликовано
                                        </span>
                                    </div>
                                    <div class="ml-4 flex-1 min-w-0">
                                        <p
                                            class="text-sm font-medium text-gray-900 truncate"
                                        >
                                            {{ getPreviewText(post.text) }}
                                        </p>
                                        <div class="mt-1 text-sm text-gray-500">
                                            <p>
                                                ✅ Опубликовано:
                                                {{
                                                    formatDate(
                                                        post.published_at
                                                    )
                                                }}
                                            </p>
                                            <p v-if="post.scheduled_at">
                                                📅 Было запланировано на:
                                                {{
                                                    formatDate(
                                                        post.scheduled_at
                                                    )
                                                }}
                                            </p>
                                            <p>
                                                📺 Канал:
                                                {{
                                                    getChannelName(
                                                        post.scheduled_channel_id
                                                    )
                                                }}
                                            </p>
                                            <p v-if="post.url">
                                                🔗 Ссылка: {{ post.url }}
                                            </p>
                                            <p v-if="post.media?.length">
                                                📎 Медиафайлов:
                                                {{ post.media.length }}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="flex items-center space-x-2 ml-4">
                                <span class="text-sm text-green-600 font-medium"
                                    >Успешно опубликовано</span
                                >
                            </div>
                        </div>
                    </li>
                </ul>
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
import { useRouter } from "vue-router";
import http from "../js/http.js";
import ConfirmModal from "@/components/Modal/ConfirmModal.vue";
import ScheduledPostsGrid from "@/components/ScheduledPostsGrid.vue";
import { formatDate } from "@/js/utils.js";
import { useEventBus, EVENTS } from "@/composables/useEventBus";

const router = useRouter();
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
        } else {
            window.$toast.error(
                "Ошибка загрузки опубликованных постов: " + response.message
            );
            loadingPublished.value = false;
        }
    });
};

const loadCategories = () => {
    http.categories((response) => {
        if (response.success) {
            categories.value = response.data || [];
        } else {
            console.error("Ошибка загрузки категорий:", response.message);
        }
    });
};

const loadChannels = () => {
    http.channels({}, (response) => {
        if (response.success) {
            channels.value = response.data || [];
        } else {
            console.error("Ошибка загрузки каналов:", response.message);
        }
    });
};

const getPreviewText = (text) => {
    if (!text) return "Текст отсутствует";
    return text.length > 80 ? text.substring(0, 80) + "..." : text;
};

const getChannelName = (channelId) => {
    const channel = channels.value.find((ch) => ch.channel_id === channelId);
    return channel ? channel.name : `ID: ${channelId}`;
};

const editSchedule = (post) => {
    const query = {
        channelId: post.scheduled_channel_id,
        scheduledAt: post.scheduled_at,
    };
    router.push({
        name: "edit-scheduled-post",
        params: { id: post._id },
        query: query,
    });
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
    loadCategories();
    loadChannels();

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
