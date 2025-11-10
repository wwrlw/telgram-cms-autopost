<template>
    <div class="min-h-screen bg-white flex flex-col">
        <div class="flex-1 w-full p-4 lg:p-6 flex flex-col">
            <div class="flex items-start justify-between mb-4">
                <h2 class="text-lg font-semibold">Создать пост</h2>
            </div>

            <TextEditor v-model="editorHtml" />

            <MediaPicker
                v-model="files"
                v-model:previews="previews"
                v-model:spoilers="spoilers"
                :existing-count="0"
                :max-files="10"
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
                <div v-if="postSaved" class="flex gap-3 mr-auto">
                    <button
                        @click="createNewPost"
                        class="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                    >
                        Создать еще один пост
                    </button>
                    <button
                        @click="goToPosts"
                        class="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                        Перейти к постам
                    </button>
                    <button
                        @click="goToScheduledPosts"
                        class="px-4 py-2 rounded bg-yellow-600 text-white hover:bg-yellow-700"
                    >
                        Запланированные посты
                    </button>
                </div>

                <button
                    @click="cancel"
                    class="px-4 py-2 rounded bg-gray-200"
                    :disabled="isSubmitting"
                >
                    Отмена
                </button>
                <button
                    v-if="uniqueText && !postSaved"
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
                    v-if="!postSaved"
                    @click="uniquizePost"
                    :disabled="uniquizing || isSubmitting || !hasText"
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
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                    </svg>
                    <span>{{
                        uniquizing ? "Уникализация..." : "Уникализировать с ИИ"
                    }}</span>
                </button>
                <button
                    v-if="!postSaved"
                    @click="savePostToDatabase"
                    class="px-4 py-2 rounded bg-green-600 text-white"
                    :disabled="isSubmitting"
                >
                    {{ isSubmitting ? "Сохранение..." : "Сохранить" }}
                </button>
                <button
                    v-if="schedule"
                    @click="publishLater"
                    class="px-4 py-2 rounded bg-blue-600 text-white"
                    :disabled="isSubmitting"
                >
                    {{
                        isSubmitting ? "Планирование..." : "Опубликовать позже"
                    }}
                </button>
                <button
                    v-if="!schedule"
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
import { getMediaUrl } from "@/js/utils";
import { useEventBus, EVENTS } from "@/composables/useEventBus";

import TextEditor from "@/components/Post/TextEditor.vue";
import MediaPicker from "@/components/Post/MediaPicker.vue";
import ChannelSelector from "@/components/Post/ChannelSelector.vue";
import ScheduleControls from "@/components/Post/ScheduleControls.vue";

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
const spoilers = ref([]);
const isSubmitting = ref(false);
const uniquizing = ref(false);
const uniqueText = ref("");
const showingUniqueText = ref(false);
const postSaved = ref(false);

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
        }
    });
};

const addFiles = (newArr) => {
    const spaceLeft = 10 - files.value.length;
    const slice = newArr.slice(0, spaceLeft);
    slice.forEach((file) => {
        files.value.push(file);
        const url = URL.createObjectURL(file);
        previews.value.push({ url, isImage: file.type.startsWith("image") });
    });
};

const cancel = () => {
    router.back();
};

const createNewPost = () => {
    postSaved.value = false;
    editorHtml.value = "";
    files.value = [];
    previews.value = [];
    spoilers.value = [];
    selectedChannel.value = "";
    schedule.value = false;
    scheduledAt.value = "";
    uniqueText.value = "";
    showingUniqueText.value = false;

    const futureTime = new Date(Date.now() + 60 * 60 * 1000);
    const year = futureTime.getFullYear();
    const month = String(futureTime.getMonth() + 1).padStart(2, "0");
    const day = String(futureTime.getDate()).padStart(2, "0");
    const hours = String(futureTime.getHours()).padStart(2, "0");
    const minutes = String(futureTime.getMinutes()).padStart(2, "0");
    scheduledAt.value = `${year}-${month}-${day}T${hours}:${minutes}`;
};

const goToPosts = () => {
    router.push("/posts");
};

const goToScheduledPosts = () => {
    router.push("/scheduled-posts");
};

const hasText = computed(() => {
    const text = editorHtml.value.replace(/<[^>]*>/g, "").trim();
    return text.length > 0;
});

const send = async (publishLater) => {
    if (isSubmitting.value) return;

    const markdown = turndownService.turndown(editorHtml.value || "");
    if (!markdown.trim() && files.value.length === 0) {
        window?.$toast?.error("Добавьте текст или медиа");
        return;
    }
    if (!selectedChannel.value) {
        window?.$toast?.error("Выберите канал для публикации");
        return;
    }
    if (publishLater) {
        if (!scheduledAt.value) {
            window?.$toast?.error("Укажите дату");
            return;
        }
    }

    isSubmitting.value = true;

    try {
        const uploadedFiles = [];
        if (files.value.length > 0) {
            for (let i = 0; i < files.value.length; i++) {
                const file = files.value[i];
                const formData = new FormData();
                formData.append("file", file);

                try {
                    const uploadResult = await new Promise(
                        (resolve, reject) => {
                            http.uploadMedia(formData, resolve, reject);
                        }
                    );

                    if (uploadResult.success) {
                        const mediaData = uploadResult.data;
                        // Добавляем информацию о спойлере
                        if (spoilers.value[i]) {
                            mediaData.has_spoiler = true;
                        }
                        uploadedFiles.push(mediaData);
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

        const payload = {
            text: markdown,
            channel_id: selectedChannel.value,
            media: uploadedFiles,
        };

        if (publishLater) {
            payload.scheduled_at = new Date(scheduledAt.value).toISOString();
        }

        const form = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                value.forEach((v, i) =>
                    form.append(
                        `${key}[${i}]`,
                        typeof v === "object" ? JSON.stringify(v) : v
                    )
                );
            } else {
                form.append(key, value);
            }
        });

        http.createPost(
            form,
            (response) => {
                isSubmitting.value = false;
                if (response.success) {
                    emitEvent(EVENTS.POST_CREATED, response.data);

                    if (publishLater) {
                        window?.$toast?.success("Пост запланирован");
                        emitEvent(EVENTS.SCHEDULED_POST_CREATED, response.data);
                        // router.push("/scheduled-posts");
                        postSaved.value = true;
                    } else {
                        const createdId = response.data._id || response.data.id;
                        http.publishToChannel(
                            createdId,
                            selectedChannel.value,
                            (publishRes) => {
                                if (publishRes.success) {
                                    window?.$toast?.success(
                                        "Пост опубликован в Telegram!"
                                    );
                                    emitEvent(
                                        EVENTS.POST_PUBLISHED,
                                        response.data
                                    );
                                    // Убираем автоматическое перенаправление после публикации
                                    // router.push("/");
                                    postSaved.value = true;
                                } else {
                                    window?.$toast?.error(
                                        "Ошибка публикации: " +
                                            (publishRes.message || "")
                                    );
                                }
                            }
                        );
                    }
                } else {
                    window?.$toast?.error(
                        response.message || "Ошибка создания поста"
                    );
                }
            },
            (error) => {
                isSubmitting.value = false;
                console.error("Error creating post:", error);
                window?.$toast?.error("Ошибка создания поста");
            }
        );
    } catch (error) {
        isSubmitting.value = false;
        console.error("Error in send function:", error);
        window?.$toast?.error("Произошла ошибка при отправке поста");
    }
};

const savePostToDatabase = async () => {
    if (isSubmitting.value) return;

    const markdown = turndownService.turndown(editorHtml.value || "");
    if (!markdown.trim() && files.value.length === 0) {
        window?.$toast?.error("Добавьте текст или медиа");
        return;
    }

    isSubmitting.value = true;

    try {
        const uploadedFiles = [];
        if (files.value.length > 0) {
            for (let i = 0; i < files.value.length; i++) {
                const file = files.value[i];
                const formData = new FormData();
                formData.append("file", file);

                try {
                    const uploadResult = await new Promise(
                        (resolve, reject) => {
                            http.uploadMedia(formData, resolve, reject);
                        }
                    );

                    if (uploadResult.success) {
                        const mediaData = uploadResult.data;
                        // Добавляем информацию о спойлере
                        if (spoilers.value[i]) {
                            mediaData.has_spoiler = true;
                        }
                        uploadedFiles.push(mediaData);
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

        const formData = new FormData();
        formData.append("text", markdown);
        uploadedFiles.forEach((media, index) => {
            formData.append(`media[${index}][type]`, media.type);
            formData.append(`media[${index}][file_path]`, media.file_path);
            if (media.original_name)
                formData.append(
                    `media[${index}][original_name]`,
                    media.original_name
                );
            if (media.mime_type)
                formData.append(`media[${index}][mime_type]`, media.mime_type);
            if (media.has_spoiler)
                formData.append(`media[${index}][has_spoiler]`, media.has_spoiler);
        });

        http.createPost(
            formData,
            (response) => {
                isSubmitting.value = false;
                if (response.success) {
                    window?.$toast?.success("Пост сохранен в базе данных!");
                    emitEvent(EVENTS.POST_CREATED, response.data);
                    postSaved.value = true;
                } else {
                    window?.$toast?.error(
                        response.message || "Ошибка сохранения поста"
                    );
                }
            },
            (error) => {
                isSubmitting.value = false;
                console.error("Error saving post:", error);
                window?.$toast?.error("Ошибка сохранения поста");
            }
        );
    } catch (error) {
        isSubmitting.value = false;
        console.error("Error in savePostToDatabase function:", error);
        window?.$toast?.error("Произошла ошибка при сохранении поста");
    }
};

async function uniquizePost() {
    if (uniquizing.value) return;
    const markdown = turndownService.turndown(editorHtml.value || "");
    if (!markdown.trim()) {
        window?.$toast?.error("Добавьте текст для уникализации");
        return;
    }
    uniquizing.value = true;
    try {
        const response = await http.instance.post("/posts/uniquize", {
            text: markdown,
        });
        if (
            response.data.success &&
            response.data.data &&
            response.data.data.unique_text
        ) {
            uniqueText.value = response.data.data.unique_text;
            showingUniqueText.value = true;
            editorHtml.value = uniqueText.value;
            window?.$toast?.success("Текст уникализирован!");
        } else {
            window?.$toast?.error(
                "Ошибка уникализации: " + (response.data.message || "")
            );
        }
    } catch (error) {
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

function loadPost() {
    loadingPost.value = true;
    http.post({ id: postId }, async (res) => {
        loadingPost.value = false;
        if (res && res.success) {
            postData.value = res.data;
            const htmlContent = (res.data.text || "").replace(/\n/g, "<br>");
            editorHtml.value = htmlContent;
            await preloadMedia(res.data);
        } else {
            window?.$toast?.error(res?.message || "Не удалось загрузить пост");
        }
    });
}

async function preloadMedia(post) {
    if (!post || !post.media || !post.media.length) return;
    const arr = [];
    const spoilersArr = [];
    for (const m of post.media.slice(0, 10)) {
        try {
            const url = getMediaUrl(m.file_path);
            const response = await fetch(url);
            const blob = await response.blob();
            const filename = m.file_path.split("/").pop() || "media";
            const file = new File([blob], filename, { type: blob.type });
            arr.push(file);
            spoilersArr.push(m.has_spoiler || false);
        } catch (e) {
            console.error("Ошибка загрузки медиа", e);
        }
    }
    addFiles(arr);
    spoilers.value = spoilersArr;
}

function publishNow() {
    send(false);
}
function publishLater() {
    send(true);
}

function toggleTextMode() {
    showingUniqueText.value = !showingUniqueText.value;
    if (showingUniqueText.value && uniqueText.value) {
        editorHtml.value = uniqueText.value;
    } else if (postData.value?.text) {
        editorHtml.value = postData.value.text;
    }
}

onMounted(() => {
    loadChannels();
    const futureTime = new Date(Date.now() + 60 * 60 * 1000);
    const year = futureTime.getFullYear();
    const month = String(futureTime.getMonth() + 1).padStart(2, "0");
    const day = String(futureTime.getDate()).padStart(2, "0");
    const hours = String(futureTime.getHours()).padStart(2, "0");
    const minutes = String(futureTime.getMinutes()).padStart(2, "0");
    scheduledAt.value = `${year}-${month}-${day}T${hours}:${minutes}`;
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
