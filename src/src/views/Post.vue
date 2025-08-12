<template>
    <div class="min-h-screen bg-white flex flex-col">
        <div class="flex-1 w-full p-4 lg:p-6 flex flex-col">
            <div class="flex items-center gap-3 justify-start mb-4">
                <h2 class="text-lg font-semibold">Редактировать пост</h2>
                <div
                    v-if="postData && postData.category_name"
                    class="flex items-center gap-2"
                >
                    <span class="text-sm text-gray-500">Категория:</span>
                    <span
                        class="px-2 py-1 text-xs rounded-full text-white"
                        :style="{
                            backgroundColor:
                                postData.category_color || '#6b7280',
                        }"
                    >
                        {{ postData.category_name }}
                    </span>
                </div>
            </div>

            <TextEditor v-model="editorHtml" />

            <div class="space-y-4 mb-4">
                <ExistingMediaGrid
                    :media="postData?.media || []"
                    :show-combined-heading="true"
                    :has-new-files="previews.length > 0"
                    @open="openMediaViewer"
                    @remove="removeExistingMedia"
                />

                <MediaPicker
                    v-model="files"
                    v-model:previews="previews"
                    :existing-count="postData?.media?.length || 0"
                    :max-files="10"
                />
            </div>

            <MediaViewer
                :show="showMediaViewer"
                :media="currentMedia"
                :current-index="currentMediaIndex"
                :total-count="postData?.media?.length || 0"
                :can-go-previous="currentMediaIndex > 0"
                :can-go-next="
                    currentMediaIndex < (postData?.media?.length || 0) - 1
                "
                @close="closeMediaViewer"
                @previous="previousMedia"
                @next="nextMedia"
            />

            <div class="space-y-4 mb-4">
                <ChannelSelector
                    v-model="selectedChannel"
                    :channels="channels"
                    :category-name="postData?.category_name || ''"
                />
                <ScheduleControls
                    v-model:schedule="schedule"
                    v-model:scheduledAt="scheduledAt"
                />
            </div>

            <div class="flex justify-end gap-3 mt-4">
                <button
                    @click="cancel"
                    class="px-4 py-2 rounded bg-gray-500 text-white"
                    :disabled="isSubmitting"
                >
                    Отмена
                </button>
                <button
                    v-if="
                        postData && postData.is_unique && postData.unique_text
                    "
                    @click="toggleTextMode"
                    class="px-4 py-2 rounded bg-orange-600 text-white hover:bg-orange-700 flex items-center gap-2"
                >
                    <svg
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                        />
                    </svg>
                    <span>{{
                        showingUniqueText
                            ? "Показать оригинал"
                            : "Показать уникальный"
                    }}</span>
                </button>
                <button
                    @click="uniquizePost"
                    :disabled="uniquizing || !hasText"
                    class="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <svg
                        v-if="uniquizing"
                        class="w-4 h-4 animate-spin"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                    </svg>
                    <svg
                        v-else
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386л-.548-.547z"
                        />
                    </svg>
                    <span>{{
                        uniquizing ? "Уникализация..." : "Уникализировать с ИИ"
                    }}</span>
                </button>
                <button
                    @click="savePost"
                    class="px-4 py-2 rounded bg-green-600 text-white"
                    :disabled="isSubmitting"
                >
                    {{ isSubmitting ? "Сохранение..." : "Сохранить" }}
                </button>
                <button
                    v-if="schedule"
                    @click="publishLater"
                    class="px-4 py-2 rounded bg-indigo-600 text-white"
                    :disabled="isSubmitting"
                >
                    {{
                        isSubmitting ? "Планирование..." : "Опубликовать позже"
                    }}
                </button>
                <button
                    v-else
                    @click="publishNow"
                    class="px-4 py-2 rounded bg-indigo-600 text-white"
                    :disabled="isSubmitting"
                >
                    {{ isSubmitting ? "Публикация..." : "Опубликовать сейчас" }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import http from "@/js/http";
import TurndownService from "turndown";
// import { getMediaUrl, getSquareMediaClasses } from "@/js/utils";
import MediaViewer from "@/components/Media/MediaViewer.vue";

import TextEditor from "@/components/Post/TextEditor.vue";
import MediaPicker from "@/components/Post/MediaPicker.vue";
import ExistingMediaGrid from "@/components/Post/ExistingMediaGrid.vue";
import ChannelSelector from "@/components/Post/ChannelSelector.vue";
import ScheduleControls from "@/components/Post/ScheduleControls.vue";

import { useEventBus, EVENTS } from "@/composables/useEventBus";

const router = useRouter();
const route = useRoute();
const postId = route.params.id;
const { emit: emitEvent } = useEventBus();

const files = ref([]);
const schedule = ref(false);
const scheduledAt = ref("");
const selectedChannel = ref("");
const channels = ref([]);
const loadingPost = ref(false);
const postData = ref(null);
const previews = ref([]);
const uniquizing = ref(false);
const showingUniqueText = ref(false);
const isSubmitting = ref(false);

const editorHtml = ref("");

const turndownService = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
});

turndownService.addRule("underline", {
    filter: ["u"],
    replacement: (content) => `__${content}__`,
});

turndownService.addRule("strikethrough", {
    filter: ["s", "strike", "del"],
    replacement: (content) => `~~${content}~~`,
});

const loadChannels = () => {
    http.getActivePublicationChannels((response) => {
        if (response.success) {
            channels.value = response.data || [];
            if (postData.value && postData.value.category_name) {
                autoSelectChannelByCategory();
            }
        }
    });
};

const autoSelectChannelByCategory = () => {
    if (
        !postData.value ||
        !postData.value.category_name ||
        channels.value.length === 0
    )
        return;
    const matchingChannel = channels.value.find(
        (channel) => channel.name === postData.value.category_name
    );
    if (matchingChannel) {
        selectedChannel.value = matchingChannel.channel_id;
        console.log(
            `Автовыбор канала "${matchingChannel.name}" для категории "${postData.value.category_name}"`
        );
    }
};

const hasText = computed(() => {
    const text = editorHtml.value.replace(/<[^>]*>/g, "").trim();
    return text.length > 0;
});

function cancel() {
    files.value.forEach((file) => {
        if (file.url) URL.revokeObjectURL(file.url);
    });
    files.value = [];
    previews.value = [];
    router.back();
}

async function savePost() {
    if (isSubmitting.value) return;

    if (!postData.value) {
        window?.$toast?.error("Данные поста не загружены");
        return;
    }

    const markdown = turndownService.turndown(editorHtml.value || "");

    if (
        !markdown.trim() &&
        files.value.length === 0 &&
        (!postData.value.media || postData.value.media.length === 0)
    ) {
        window?.$toast?.error("Добавьте текст или медиа");
        return;
    }

    isSubmitting.value = true;
    try {
        const uploadedFiles = [];
        if (files.value.length > 0) {
            for (const file of files.value) {
                const formData = new FormData();
                formData.append("file", file);

                try {
                    const uploadResult = await new Promise(
                        (resolve, reject) => {
                            http.uploadMedia(formData, resolve, reject);
                        }
                    );

                    if (uploadResult.success) {
                        uploadedFiles.push(uploadResult.data);
                    } else {
                        window?.$toast?.error(
                            `Ошибка загрузки файла ${file.name}: ${uploadResult.message}`
                        );
                        return;
                    }
                } catch (error) {
                    window?.$toast?.error(`Ошибка загрузки файла ${file.name}`);
                    return error;
                }
            }
        }

        const existingMedia = postData.value.media || [];
        const allMedia = [...existingMedia, ...uploadedFiles];

        const updateData = {
            id: postData.value._id,
            text: markdown,
            media: allMedia,
        };

        if (selectedChannel.value) {
            updateData.channel_id = selectedChannel.value;
        }

        http.updatePost(updateData, (response) => {
            isSubmitting.value = false;
            if (response.success) {
                window?.$toast?.success("Пост успешно сохранён");
                router.push("/");
            } else {
                window?.$toast?.error(
                    "Ошибка сохранения: " + (response.message || "")
                );
            }
        });
    } catch (error) {
        console.error("Error in savePost:", error);
        window?.$toast?.error("Ошибка сохранения поста");
        isSubmitting.value = false;
    }
}

async function publishNow() {
    if (isSubmitting.value) return;

    if (!postData.value) {
        window?.$toast?.error("Данные поста не загружены");
        return;
    }

    if (!selectedChannel.value) {
        window?.$toast?.error("Выберите канал для публикации");
        return;
    }

    const markdown = turndownService.turndown(editorHtml.value || "");

    if (
        !markdown.trim() &&
        files.value.length === 0 &&
        (!postData.value.media || postData.value.media.length === 0)
    ) {
        window?.$toast?.error("Добавьте текст или медиа");
        return;
    }

    isSubmitting.value = true;
    try {
        const uploadedFiles = [];
        if (files.value.length > 0) {
            for (const file of files.value) {
                const formData = new FormData();
                formData.append("file", file);

                try {
                    const uploadResult = await new Promise(
                        (resolve, reject) => {
                            http.uploadMedia(formData, resolve, reject);
                        }
                    );

                    if (uploadResult.success) {
                        uploadedFiles.push(uploadResult.data);
                    } else {
                        window?.$toast?.error(
                            `Ошибка загрузки файла ${file.name}: ${uploadResult.message}`
                        );
                        return;
                    }
                } catch (error) {
                    window?.$toast?.error(`Ошибка загрузки файла ${file.name}`);
                    return error;
                }
            }
        }

        const existingMedia = postData.value.media || [];
        const allMedia = [...existingMedia, ...uploadedFiles];

        const updateData = {
            id: postData.value._id,
            text: markdown,
            channel_id: selectedChannel.value,
            media: allMedia,
        };

        http.updatePost(updateData, (response) => {
            if (response.success) {
                http.publishToChannel(
                    postData.value._id.toString(),
                    selectedChannel.value,
                    (publishRes) => {
                        isSubmitting.value = false;
                        if (publishRes.success) {
                            window?.$toast?.success(
                                "Пост успешно опубликован в Telegram!"
                            );
                            emitEvent(EVENTS.POST_PUBLISHED, response.data);
                            router.push("/");
                        } else {
                            window?.$toast?.error(
                                "Ошибка публикации: " +
                                    (publishRes.message || "")
                            );
                        }
                    }
                );
            } else {
                isSubmitting.value = false;
                window?.$toast?.error(
                    "Ошибка сохранения: " + (response.message || "")
                );
            }
        });
    } catch (error) {
        console.error("Error in publishNow:", error);
        window?.$toast?.error("Ошибка публикации поста");
        isSubmitting.value = false;
    }
}

async function publishLater() {
    if (isSubmitting.value) return;

    if (!postData.value) {
        window?.$toast?.error("Данные поста не загружены");
        return;
    }

    if (!selectedChannel.value) {
        window?.$toast?.error("Выберите канал для публикации");
        return;
    }

    if (!scheduledAt.value) {
        window?.$toast?.error("Укажите дату и время публикации");
        return;
    }

    const markdown = turndownService.turndown(editorHtml.value || "");

    if (
        !markdown.trim() &&
        files.value.length === 0 &&
        (!postData.value.media || postData.value.media.length === 0)
    ) {
        window?.$toast?.error("Добавьте текст или медиа");
        return;
    }

    isSubmitting.value = true;
    try {
        const uploadedFiles = [];
        if (files.value.length > 0) {
            for (const file of files.value) {
                const formData = new FormData();
                formData.append("file", file);

                try {
                    const uploadResult = await new Promise(
                        (resolve, reject) => {
                            http.uploadMedia(formData, resolve, reject);
                        }
                    );

                    if (uploadResult.success) {
                        uploadedFiles.push(uploadResult.data);
                    } else {
                        window?.$toast?.error(
                            `Ошибка загрузки файла ${file.name}: ${uploadResult.message}`
                        );
                        return;
                    }
                } catch (error) {
                    window?.$toast?.error(`Ошибка загрузки файла ${file.name}`);
                    return error;
                }
            }
        }

        const existingMedia = postData.value.media || [];
        const allMedia = [...existingMedia, ...uploadedFiles];

        const updateData = {
            id: postData.value._id,
            text: markdown,
            channel_id: selectedChannel.value,
            media: allMedia,
        };

        http.updatePost(updateData, (response) => {
            if (response.success) {
                http.schedulePost(
                    {
                        postId: postData.value._id,
                        scheduledAt: new Date(scheduledAt.value).toISOString(),
                        channelId: selectedChannel.value,
                    },
                    (scheduleRes) => {
                        isSubmitting.value = false;
                        if (scheduleRes.success) {
                            window?.$toast?.success(
                                "Пост запланирован на публикацию!"
                            );
                            emitEvent(
                                EVENTS.SCHEDULED_POST_CREATED,
                                response.data
                            );
                            router.push("/");
                        } else {
                            window?.$toast?.error(
                                "Ошибка планирования: " +
                                    (scheduleRes.message || "")
                            );
                        }
                    }
                );
            } else {
                isSubmitting.value = false;
                window?.$toast?.error(
                    "Ошибка сохранения: " + (response.message || "")
                );
            }
        });
    } catch (error) {
        console.error("Error in publishLater:", error);
        window?.$toast?.error("Ошибка планирования поста");
        isSubmitting.value = false;
    }
}

function loadPost() {
    loadingPost.value = true;

    http.post({ id: postId }, async (res) => {
        loadingPost.value = false;
        if (res && res.success) {
            postData.value = res.data;
            initializeEditorContent(res.data);
            await preloadMedia(res.data);

            if (res.data.channel_id) {
                selectedChannel.value = res.data.channel_id;
            }

            autoSelectChannelByCategory();
        } else {
            window?.$toast?.error(res?.message || "Не удалось загрузить пост");
        }
    });
}

function initializeEditorContent(post) {
    if (!post) return;
    let textToShow = post.text || "";
    if (showingUniqueText.value && post.unique_text) {
        textToShow = post.unique_text;
    }
    const htmlContent = textToShow.replace(/\n/g, "<br>");
    editorHtml.value = htmlContent;
}

function toggleTextMode() {
    showingUniqueText.value = !showingUniqueText.value;
    initializeEditorContent(postData.value);
}

async function preloadMedia(post) {
    if (!post || !post.media || !post.media.length) return;
    try {
        const mediaUrls = post.media
            .filter((m) => m && m.file_path)
            .map((m) => m.file_path);
        if (mediaUrls.length > 0) {
            console.log(
                "Preloading media for post:",
                mediaUrls.length,
                "files"
            );
        }
    } catch (error) {
        console.warn("Failed to preload media:", error);
    }
}

const showMediaViewer = ref(false);
const currentMediaIndex = ref(0);
const currentMedia = ref(null);

function openMediaViewer(media, index) {
    currentMediaIndex.value = index;
    currentMedia.value = media;
    showMediaViewer.value = true;
}

function closeMediaViewer() {
    showMediaViewer.value = false;
    currentMedia.value = null;
}

function previousMedia() {
    currentMediaIndex.value--;
    if (currentMediaIndex.value < 0) {
        currentMediaIndex.value = postData.value.media.length - 1;
    }
    currentMedia.value = postData.value.media[currentMediaIndex.value];
}

function nextMedia() {
    currentMediaIndex.value++;
    if (currentMediaIndex.value >= postData.value.media.length) {
        currentMediaIndex.value = 0;
    }
    currentMedia.value = postData.value.media[currentMediaIndex.value];
}

async function uniquizePost() {
    if (!postId) {
        window?.$toast?.error("ID поста не найден");
        return;
    }

    uniquizing.value = true;

    try {
        const response = await http.instance.post(`/posts/${postId}/uniquize`);

        if (response.data.success) {
            const updatedPost = response.data.data;
            postData.value = updatedPost;
            showingUniqueText.value = true;
            initializeEditorContent(updatedPost);
            window?.$toast?.success("Пост уникализирован!");
        } else {
            window?.$toast?.error(
                "Ошибка уникализации: " + (response.data.message || "")
            );
        }
    } catch (error) {
        console.error("Error uniquizing post:", error);

        let errorMessage = "Ошибка уникализации";

        if (error.response) {
            const statusCode = error.response.status;
            const serverMessage =
                error.response.data?.message ||
                error.response.data?.error ||
                "Неизвестная ошибка сервера";
            errorMessage = `Ошибка ${statusCode}: ${serverMessage}`;
        } else if (error.request) {
            errorMessage = "Ошибка сети. Проверьте подключение к интернету";
        } else {
            errorMessage = error.message || "Неизвестная ошибка";
        }

        window?.$toast?.error(errorMessage);
    } finally {
        uniquizing.value = false;
    }
}

onMounted(() => {
    loadChannels();
    const futureTime = new Date(Date.now() + 60 * 60 * 1000);
    scheduledAt.value = futureTime.toISOString().slice(0, 16);
    if (postId) {
        loadPost();
    }
});
</script>

<style scoped>
button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>
