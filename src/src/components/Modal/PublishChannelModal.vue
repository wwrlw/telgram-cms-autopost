<template>
    <div
        v-if="show"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
        <div class="bg-white rounded-lg p-6 w-96 max-w-md">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold">
                    Выберите канал для публикации
                </h3>
                <button
                    @click="close"
                    class="text-gray-500 hover:text-gray-700"
                >
                    <svg
                        class="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M6 18L18 6M6 6l12 12"
                        ></path>
                    </svg>
                </button>
            </div>

            <div v-if="loading" class="text-center py-4">
                <div
                    class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"
                ></div>
                <p class="mt-2 text-gray-600">Загрузка каналов...</p>
            </div>

            <div v-else-if="error" class="text-center py-4">
                <p class="text-red-600">{{ error }}</p>
                <button
                    @click="loadChannels"
                    class="mt-2 text-blue-600 hover:text-blue-800"
                >
                    Попробовать снова
                </button>
            </div>

            <div v-else>
                <div class="space-y-2 max-h-64 overflow-y-auto">
                    <div
                        v-for="channel in channels"
                        :key="channel._id"
                        @click="selectChannel(channel)"
                        class="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                        :class="{
                            'border-blue-500 bg-blue-50':
                                selectedChannel?._id === channel._id,
                        }"
                    >
                        <div class="flex items-center justify-between">
                            <div>
                                <h4 class="font-medium text-gray-900">
                                    {{ channel.name }}
                                </h4>
                                <p class="text-sm text-gray-600">
                                    {{ channel.username }}
                                </p>
                            </div>
                            <div class="text-right">
                                <span class="text-xs text-gray-500"
                                    >ID: {{ channel.channel_id }}</span
                                >
                                <div class="mt-1">
                                    <span
                                        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                                        :class="
                                            channel.is_active
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                        "
                                    >
                                        {{
                                            channel.is_active
                                                ? "Активен"
                                                : "Неактивен"
                                        }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="channels.length === 0" class="text-center py-4">
                    <p class="text-gray-600">
                        Нет доступных каналов для публикации
                    </p>
                </div>
            </div>

            <div class="flex justify-end space-x-3 mt-6">
                <button
                    @click="close"
                    class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                    Отмена
                </button>
                <button
                    @click="publish"
                    :disabled="!selectedChannel || publishing"
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span v-if="publishing" class="flex items-center">
                        <svg
                            class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                        </svg>
                        Публикация...
                    </span>
                    <span v-else>Опубликовать</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import http from "../../js/http.js";

export default {
    name: "PublishChannelModal",
    props: {
        show: {
            type: Boolean,
            default: false,
        },
        postId: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
            channels: [],
            selectedChannel: null,
            loading: false,
            error: null,
            publishing: false,
        };
    },
    watch: {
        show(newVal) {
            if (newVal) {
                this.loadChannels();
            }
        },
    },
    methods: {
        async loadChannels() {
            this.loading = true;
            this.error = null;

            try {
                return new Promise((resolve, reject) => {
                    http.getPostedChannels((response) => {
                        if (response.success) {
                            this.channels = response.data;
                        } else {
                            this.error = "Ошибка при загрузке каналов";
                        }
                        this.loading = false;
                        resolve(response);
                    });
                });
            } catch (error) {
                console.error("Ошибка при загрузке каналов:", error);
                this.error = "Не удалось загрузить каналы";
                this.loading = false;
            }
        },

        selectChannel(channel) {
            this.selectedChannel = channel;
        },

        async publish() {
            if (!this.selectedChannel) return;

            this.publishing = true;

            try {
                return new Promise((resolve, reject) => {
                    http.publishToChannel(
                        this.postId,
                        this.selectedChannel.channel_id,
                        (response) => {
                            if (response.success) {
                                this.$emit("published", {
                                    success: true,
                                    message: response.message,
                                    channel: this.selectedChannel,
                                });
                                this.close();
                            } else {
                                this.$emit("published", {
                                    success: false,
                                    message: response.message,
                                });
                            }
                            this.publishing = false;
                            resolve(response);
                        }
                    );
                });
            } catch (error) {
                console.error("Ошибка при публикации:", error);
                this.$emit("published", {
                    success: false,
                    message: "Ошибка при публикации поста",
                });
                this.publishing = false;
            }
        },

        close() {
            this.selectedChannel = null;
            this.$emit("close");
        },
    },
};
</script>
