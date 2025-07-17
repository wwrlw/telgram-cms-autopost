<template>
    <div class="min-h-screen bg-gray-50 py-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="mb-8">
                <div class="flex justify-between items-center">
                    <div>
                        <h1 class="text-3xl font-bold text-gray-900">
                            Каналы для публикации
                        </h1>
                        <p class="mt-2 text-sm text-gray-600">
                            Управление каналами Telegram для публикации постов
                        </p>
                    </div>
                    <button
                        @click="openCreateModal"
                        class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
                        Добавить канал
                    </button>
                </div>
            </div>

            <div class="bg-white shadow overflow-hidden sm:rounded-md">
                <div v-if="loading" class="p-8 text-center">
                    <div
                        class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"
                    ></div>
                    <p class="mt-2 text-sm text-gray-500">
                        Загружаем каналы...
                    </p>
                </div>

                <div
                    v-else-if="channels.length === 0"
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
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012 2v2M7 7h10"
                        />
                    </svg>
                    <h3 class="mt-2 text-sm font-medium text-gray-900">
                        Нет каналов
                    </h3>
                    <p class="mt-1 text-sm text-gray-500">
                        Начните с добавления первого канала для публикации.
                    </p>
                </div>

                <ul v-else class="divide-y divide-gray-200">
                    <li
                        v-for="channel in channels"
                        :key="channel.id"
                        class="px-6 py-4"
                    >
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <div class="flex-shrink-0">
                                    <span
                                        :class="[
                                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                                            channel.is_active
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800',
                                        ]"
                                    >
                                        {{
                                            channel.is_active
                                                ? "Активен"
                                                : "Неактивен"
                                        }}
                                    </span>
                                </div>
                                <div class="ml-4">
                                    <div class="flex items-center">
                                        <p
                                            class="text-sm font-medium text-gray-900"
                                        >
                                            {{ channel.name }}
                                        </p>
                                        <span
                                            :class="[
                                                'ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                                                channel.channel_type ===
                                                'public'
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : 'bg-purple-100 text-purple-800',
                                            ]"
                                        >
                                            {{
                                                channel.channel_type ===
                                                "public"
                                                    ? "Публичный"
                                                    : "Приватный"
                                            }}
                                        </span>
                                    </div>
                                    <p class="text-sm text-gray-500">
                                        ID: {{ channel.channel_id }}
                                    </p>
                                    <p class="text-xs text-gray-400">
                                        Создан:
                                        {{ formatDate(channel.created_at) }}
                                    </p>
                                </div>
                            </div>
                            <div class="flex items-center space-x-2">
                                <button
                                    @click="openEditModal(channel)"
                                    class="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                                >
                                    Редактировать
                                </button>
                                <button
                                    @click="toggleChannelStatus(channel)"
                                    :class="[
                                        'text-sm font-medium',
                                        channel.is_active
                                            ? 'text-red-600 hover:text-red-900'
                                            : 'text-green-600 hover:text-green-900',
                                    ]"
                                >
                                    {{
                                        channel.is_active
                                            ? "Отключить"
                                            : "Включить"
                                    }}
                                </button>
                                <button
                                    @click="deleteChannel(channel)"
                                    class="text-red-600 hover:text-red-900 text-sm font-medium"
                                >
                                    Удалить
                                </button>
                            </div>
                        </div>
                    </li>
                </ul>
            </div>
        </div>

        <div
            v-if="showModal"
            class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
        >
            <div
                class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white"
            >
                <div class="mt-3">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">
                        {{
                            editingChannel
                                ? "Редактировать канал"
                                : "Добавить канал"
                        }}
                    </h3>

                    <form @submit.prevent="saveChannel">
                        <div class="space-y-4">
                            <div>
                                <label
                                    for="name"
                                    class="block text-sm font-medium text-gray-700"
                                    >Название канала</label
                                >
                                <input
                                    type="text"
                                    id="name"
                                    v-model="formData.name"
                                    required
                                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="Название канала"
                                />
                            </div>

                            <div>
                                <label
                                    for="channel_id"
                                    class="block text-sm font-medium text-gray-700"
                                    >ID канала</label
                                >
                                <input
                                    type="text"
                                    id="channel_id"
                                    v-model="formData.channel_id"
                                    required
                                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="-1001234567890"
                                />
                            </div>

                            <div>
                                <label
                                    for="channel_type"
                                    class="block text-sm font-medium text-gray-700"
                                    >Тип канала</label
                                >
                                <select
                                    id="channel_type"
                                    v-model="formData.channel_type"
                                    required
                                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                >
                                    <option value="public">Публичный</option>
                                    <option value="private">Приватный</option>
                                </select>
                            </div>

                            <div>
                                <label
                                    for="signature"
                                    class="block text-sm font-medium text-gray-700"
                                    >Подпись (HTML)</label
                                >
                                <textarea
                                    id="signature"
                                    v-model="formData.signature"
                                    rows="3"
                                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="&lt;a href='https://t.me/...'&gt;👉 Подписаться!&lt;/a&gt;"
                                ></textarea>
                            </div>

                            <div class="flex items-center">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    v-model="formData.is_active"
                                    class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label
                                    for="is_active"
                                    class="ml-2 block text-sm text-gray-900"
                                >
                                    Активен
                                </label>
                            </div>
                        </div>

                        <div class="flex justify-end space-x-3 mt-6">
                            <button
                                type="button"
                                @click="closeModal"
                                class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Отмена
                            </button>
                            <button
                                type="submit"
                                :disabled="saving"
                                class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {{ saving ? "Сохранение..." : "Сохранить" }}
                            </button>
                        </div>
                    </form>
                </div>
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
import { ref, reactive, onMounted, inject, watch } from "vue";
import http from "@/js/http.js";
import { formatDate } from "@/js/utils";
import ConfirmModal from "@/components/Modal/ConfirmModal.vue";

const refreshTrigger = inject("refreshTrigger", ref(0));
const setLoading = inject("setLoading");

const channels = ref([]);
const loading = ref(true);
const showModal = ref(false);
const editingChannel = ref(null);
const saving = ref(false);

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

const formData = reactive({
    name: "",
    channel_id: "",
    channel_type: "public",
    is_active: true,
    signature: "",
});

const loadChannels = () => {
    loading.value = true;
    if (setLoading) setLoading(true);

    http.getPublicationChannels((response) => {
        if (response.success) {
            channels.value = response.data || [];
            loading.value = false;
        } else {
            window.$toast.error("Ошибка загрузки каналов: " + response.message);
            loading.value = false;
        }
        if (setLoading) setLoading(false);
    });
};

const openCreateModal = () => {
    editingChannel.value = null;
    Object.assign(formData, {
        name: "",
        channel_id: "",
        channel_type: "public",
        is_active: true,
        signature: "",
    });
    showModal.value = true;
};

const openEditModal = (channel) => {
    editingChannel.value = channel;
    Object.assign(formData, {
        name: channel.name,
        channel_id: channel.channel_id,
        channel_type: channel.channel_type,
        is_active: channel.is_active,
        signature: channel.signature,
    });
    showModal.value = true;
};

const closeModal = () => {
    showModal.value = false;
    editingChannel.value = null;
};

const saveChannel = () => {
    saving.value = true;
    showModal.value = false;
    const data = { ...formData };
    if (!data.bot_token) delete data.bot_token;

    if (editingChannel.value) {
        http.updatePublicationChannel(
            { id: editingChannel.value.id, ...data },
            (response) => {
                saving.value = false;
                if (response.success) {
                    window.$toast.success("Канал успешно обновлен");
                    loadChannels();
                } else {
                    window.$toast.error(
                        "Ошибка обновления канала: " + response.message
                    );
                }
            }
        );
    } else {
        http.createPublicationChannel(data, (response) => {
            saving.value = false;
            if (response.success) {
                window.$toast.success("Канал успешно создан");
                loadChannels();
            } else {
                window.$toast.error(
                    "Ошибка создания канала: " + response.message
                );
            }
        });
    }
    loadChannels();
};

const toggleChannelStatus = (channel) => {
    const newStatus = !channel.is_active;
    http.updatePublicationChannel(
        {
            id: channel.id,
            is_active: newStatus,
        },
        (response) => {
            if (response.success) {
                window.$toast.success(
                    `Канал ${newStatus ? "включен" : "отключен"}`
                );
                loadChannels();
            } else {
                window.$toast.error(
                    "Ошибка изменения статуса канала: " + response.message
                );
            }
        }
    );
};

const deleteChannel = (channel) => {
    showConfirm(
        `Вы действительно хотите удалить канал "${channel.name}"?`,
        (ch) => {
            http.deletePublicationChannel({ id: ch.id }, (response) => {
                if (response.success) {
                    window.$toast.success("Канал успешно удален");
                    loadChannels();
                } else {
                    window.$toast.error(
                        "Ошибка удаления канала: " + response.message
                    );
                }
            });
        },
        channel
    );
};

watch(refreshTrigger, () => {
    loadChannels();
});

onMounted(() => {
    loadChannels();
});
</script>
