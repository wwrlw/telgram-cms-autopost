<template>
    <div class="min-h-screen bg-white flex flex-col">
        <div class="flex-1 w-full p-4 lg:p-6 flex flex-col">
            <div class="flex items-center gap-3 justify-start mb-4">
                <h2 class="text-lg font-semibold">Редактировать отложенную публикацию</h2>
                <div v-if="postData && postData.category_name" class="flex items-center gap-2">
                    <span class="text-sm text-gray-500">Категория:</span>
                    <span 
                        class="px-2 py-1 text-xs rounded-full text-white"
                        :style="{ backgroundColor: postData.category_color || '#6b7280' }"
                    >
                        {{ postData.category_name }}
                    </span>
                </div>
            </div>

            <div class="mb-4 flex flex-col">
                <div class="relative">
                    <div class="flex flex-wrap gap-1 p-2 border-b">
                        <button
                            v-for="btn in toolbar"
                            :key="btn.title"
                            :title="btn.title"
                            @click="btn.action"
                            class="px-2 py-1 text-sm rounded hover:bg-gray-200"
                            :class="{
                                'bg-indigo-100 text-indigo-700': btn.isActive(),
                            }"
                        >
                            {{ btn.label }}
                        </button>
                    </div>
                    <div
                        v-if="showEmojiPicker"
                        class="absolute top-full left-0 mt-1 bg-white border rounded shadow p-2 z-50 w-72 h-60 overflow-hidden"
                    >
                        <emoji-picker
                            @emoji-click="insertEmojiEvent"
                            style="
                                --emoji-size: 20px;
                                width: 100%;
                                height: 100%;
                            "
                        />
                    </div>
                    <div
                        v-if="showLinkInput"
                        class="absolute top-full left-0 mt-1 bg-white border rounded shadow p-3 z-50 w-64"
                    >
                        <input
                            v-model="linkUrl"
                            placeholder="https://example.com"
                            class="border rounded w-full text-sm px-2 py-1 mb-2"
                        />
                        <div class="flex justify-end gap-2">
                            <button
                                @click.stop="cancelLink"
                                class="px-2 py-1 text-sm bg-gray-200 rounded"
                            >
                                Отмена
                            </button>
                            <button
                                @click.stop="confirmLink"
                                class="px-2 py-1 text-sm bg-indigo-600 text-white rounded"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
                <EditorContent
                    :editor="editor"
                    class="p-3 min-h-64 custom-editor-content"
                />
            </div>

            <div class="space-y-4 mb-4">
                <div class="flex items-center gap-2">
                    <button type="button" class="file-btn" @click="triggerFile">
                        <svg
                            class="w-5 h-5 mr-1 text-indigo-600"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.586-6.586a2 2 0 10-2.828-2.828z"
                            />
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M16 7V3a1 1 0 00-1-1h-4a1 1 0 00-1 1v4"
                            />
                        </svg>
                        <span>Прикрепить файлы</span>
                    </button>
                    <input
                        ref="fileInputRef"
                        type="file"
                        multiple
                        accept="image/*,video/*,audio/*"
                        @change="handleFiles"
                        class="hidden"
                    />
                    <span class="text-xs text-gray-500">
                        {{ (postData?.media?.length || 0) + files.length }}/10 файлов
                    </span>
                </div>

                <!-- Медиафайлы -->
                <div v-if="previews.length > 0 || (postData && postData.media && postData.media.length > 0)" class="mb-4">
                    <h4 class="text-sm font-medium text-gray-700 mb-3">
                        {{ files.length > 0 ? 'Медиафайлы (существующие + новые):' : 'Медиафайлы:' }}
                    </h4>
                    <div
                        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
                    >
                        <!-- Существующие медиафайлы -->
                        <div
                            v-for="(media, id) in postData.media"
                            :key="'existing-' + id"
                            class="relative group border rounded overflow-hidden"
                        >
                            <div class="aspect-square overflow-hidden">
                                <img
                                    v-if="isImageMedia(media)"
                                    :src="getMediaUrl(media.file_path)"
                                    :class="getSquareMediaClasses('thumbnail')"
                                    class="cursor-pointer hover:opacity-90 transition-opacity"
                                    @click="openMediaViewer(media, id)"
                                />
                                <div
                                    v-else-if="isVideoMedia(media)"
                                    class="relative cursor-pointer hover:opacity-90 transition-opacity w-full h-full"
                                    @click="openMediaViewer(media, id)"
                                >
                                    <video
                                        :src="getMediaUrl(media.file_path)"
                                        :class="getSquareMediaClasses('thumbnail')"
                                        muted
                                        preload="metadata"
                                    />
                                    <div
                                        class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30"
                                    >
                                        <div
                                            class="w-8 h-8 bg-black bg-opacity-70 rounded-full flex items-center justify-center"
                                        >
                                            <svg
                                                class="w-4 h-4 text-white ml-0.5"
                                                fill="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <div
                                    v-else
                                    class="w-full h-full bg-gray-200 flex items-center justify-center"
                                >
                                    <svg
                                        class="w-8 h-8 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                    </svg>
                                </div>
                            </div>
                            <!-- Кнопка удаления существующего файла -->
                            <button
                                @click="removeExistingMedia(id)"
                                class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                title="Удалить файл"
                            >
                                ✕
                            </button>
                        </div>

                        <!-- Новые файлы -->
                        <div
                            v-for="(item, idx) in previews"
                            :key="'new-' + idx"
                            class="relative group border rounded overflow-hidden aspect-square"
                        >
                            <img
                                v-if="item.isImage"
                                :src="item.url"
                                class="w-full h-full object-cover"
                            />
                            <video
                                v-else
                                muted
                                :src="item.url"
                                class="w-full h-full object-cover"
                            ></video>
                            <button
                                @click="removeFile(idx)"
                                class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                title="Удалить файл"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                </div>
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
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1"
                        >Канал для публикации</label
                    >
                    <select
                        v-model="selectedChannel"
                        class="border rounded p-2 text-sm w-full"
                    >
                        <option :value="null">Выберите канал</option>
                        <option
                            v-for="channel in channels"
                            :key="channel._id"
                            :value="channel.channel_id"
                        >
                            {{ channel.name }}
                        </option>
                    </select>
                    <div v-if="isAutoSelectedChannel" class="mt-1 text-xs text-green-600 flex items-center gap-1">
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                        </svg>
                        Автоматически выбран по категории "{{ postData.category_name }}"
                        <button 
                            @click="selectedChannel = ''" 
                            class="ml-2 text-red-500 hover:text-red-700 underline"
                            title="Сбросить автовыбор"
                        >
                            Сбросить
                        </button>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <input id="schedule" type="checkbox" v-model="schedule" />
                    <label for="schedule" class="text-sm"
                        >Опубликовать позже</label
                    >
                </div>
                <div
                    v-if="schedule"
                    class="space-y-3 pl-6 border-l-2 border-gray-200"
                >
                    <DateTimePicker v-model="scheduledAt" />
                </div>
            </div>

            <div class="flex justify-end gap-3 mt-4">
                <button 
                    @click="cancel" 
                    class="px-4 py-2 rounded bg-gray-500 text-white"
                    :disabled="isSubmitting"
                >
                    Отмена
                </button>
                <!-- Кнопка переключения текста -->
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
                <!-- Кнопка уникализации -->
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
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
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
                    {{ isSubmitting ? 'Сохранение...' : 'Сохранить' }}
                </button>
                <button
                    v-if="schedule"
                    @click="publishLater"
                    class="px-4 py-2 rounded bg-blue-600 text-white"
                    :disabled="isSubmitting"
                >
                    {{ isSubmitting ? 'Планирование...' : 'Запланировать' }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { EditorContent, useEditor } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import http from "@/js/http";
import TurndownService from "turndown";
import { getMediaUrl, getSquareMediaClasses } from "@/js/utils";
import { useFavorites } from "@/composables/useFavorites.js";
import "emoji-picker-element";
import MediaViewer from "@/components/MediaViewer.vue";
import DateTimePicker from "@/components/DateTimePicker.vue";
import mediaPreloader from "@/utils/mediaPreloader";

const router = useRouter();
const route = useRoute();
const postId = route.params.id;

const files = ref([]);
const fileInputRef = ref(null);
const schedule = ref(true); // По умолчанию включено для отложенных публикаций
const scheduledAt = ref("");
const selectedChannel = ref(null);
const channels = ref([]);
const loadingPost = ref(false);
const postData = ref(null);
const previews = ref([]);
const uniquizing = ref(false);
const showingUniqueText = ref(false);
const isSubmitting = ref(false);

const editor = useEditor({
    extensions: [StarterKit, Link, Underline],
    content: "",
});

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
            // После загрузки каналов пытаемся сделать автовыбор
            if (postData.value && postData.value.category_name) {
                autoSelectChannelByCategory();
            }
        }
    });
};

const autoSelectChannelByCategory = () => {
    if (!postData.value || !postData.value.category_name || channels.value.length === 0) {
        return;
    }
    
    const matchingChannel = channels.value.find(
        channel => channel.name === postData.value.category_name
    );
    
    if (matchingChannel) {
        // Проверяем, соответствует ли текущий выбранный канал категории
        const currentChannel = channels.value.find(
            channel => channel.channel_id === selectedChannel.value
        );
        
        // Если канал не выбран или выбранный канал не соответствует категории, выбираем подходящий
        if (selectedChannel.value === null || !currentChannel || currentChannel.name !== postData.value.category_name) {
            selectedChannel.value = matchingChannel.channel_id;
            console.log(`Автовыбор канала "${matchingChannel.name}" для категории "${postData.value.category_name}"`);
        }
    }
};

// Определяем, был ли канал выбран автоматически
const isAutoSelectedChannel = computed(() => {
    if (!postData.value || !postData.value.category_name || selectedChannel.value === null) {
        return false;
    }
    
    const selectedChannelData = channels.value.find(
        channel => channel.channel_id === selectedChannel.value
    );
    
    return selectedChannelData && selectedChannelData.name === postData.value.category_name;
});

const addFiles = (newArr) => {
    const spaceLeft = 10 - files.value.length;
    const slice = newArr.slice(0, spaceLeft);
    slice.forEach((file) => {
        files.value.push(file);
        const url = URL.createObjectURL(file);
        previews.value.push({ url, isImage: file.type.startsWith("image") });
    });
};

const handleFiles = (e) => {
    const newFiles = Array.from(e.target.files);
    if (files.value.length + newFiles.length > 10) {
        window?.$toast?.warning(`Максимум 10 файлов. У вас уже ${files.value.length} файлов.`);
        e.target.value = "";
        return;
    }
    addFiles(newFiles);
    e.target.value = "";
};

const triggerFile = () => {
    fileInputRef.value?.click();
};

const removeFile = (index) => {
    files.value.splice(index, 1);
    const prev = previews.value.splice(index, 1)[0];
    if (prev?.url) URL.revokeObjectURL(prev.url);
};

const removeExistingMedia = (index) => {
    if (postData.value && postData.value.media) {
        postData.value.media.splice(index, 1);
    }
};

function cancel() {
    // Очищаем файлы и превью при отмене
    files.value.forEach(file => {
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

    const html = editor.value?.getHTML() || "";
    const markdown = turndownService.turndown(html);

    if (!markdown.trim() && files.value.length === 0 && (!postData.value.media || postData.value.media.length === 0)) {
        window?.$toast?.error("Добавьте текст или медиа");
        return;
    }

    isSubmitting.value = true;
    try {
        // Загружаем новые файлы, если они есть
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
                    return;
                }
            }
        }

        // Объединяем существующие и новые медиафайлы
        const existingMedia = postData.value.media || [];
        const allMedia = [...existingMedia, ...uploadedFiles];

        const updateData = {
            id: postData.value._id,
            text: markdown,
            media: allMedia,
        };
        
        if (selectedChannel.value !== null) {
            updateData.channel_id = selectedChannel.value;
        }

        http.updatePost(updateData, (response) => {
            isSubmitting.value = false;
            if (response.success) {
                window?.$toast?.success("Пост успешно сохранён");
                router.push("/scheduled-posts");
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

async function publishLater() {
    if (isSubmitting.value) return;
    
    if (!postData.value) {
        window?.$toast?.error("Данные поста не загружены");
        return;
    }

            if (selectedChannel.value === null) {
            window?.$toast?.error("Выберите канал для публикации");
            return;
        }

    if (!scheduledAt.value) {
        window?.$toast?.error("Укажите дату и время публикации");
        return;
    }

    // Сначала сохраняем пост
    const html = editor.value?.getHTML() || "";
    const markdown = turndownService.turndown(html);

    if (!markdown.trim() && files.value.length === 0 && (!postData.value.media || postData.value.media.length === 0)) {
        window?.$toast?.error("Добавьте текст или медиа");
        return;
    }

    isSubmitting.value = true;
    try {
        // Загружаем новые файлы, если они есть
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
                    return;
                }
            }
        }

        // Объединяем существующие и новые медиафайлы
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
                // После сохранения планируем публикацию
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
                            router.push("/scheduled-posts");
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
    const route = useRoute();
    loadingPost.value = true;
    console.log('Loading post with ID:', postId);
    http.post({ id: postId }, async (res) => {
        loadingPost.value = false;
        console.log('Post load response:', res);
        if (res && res.success) {
            postData.value = res.data;
            console.log('Post data loaded:', res.data);
            initializeEditorContent(res.data);
            await preloadMedia(res.data);

            // Устанавливаем выбранный канал только если он не был установлен из query параметров
            if (res.data.channel_id && selectedChannel.value === null) {
                selectedChannel.value = res.data.channel_id;
                console.log('Set channel from post data:', res.data.channel_id);
            }
            
            // Всегда пытаемся сделать автовыбор по категории
            // Это обеспечит выбор правильного канала даже если channel_id не установлен
            autoSelectChannelByCategory();

            // Устанавливаем время публикации только если оно не было установлено из query параметров
            if (res.data.scheduled_at && !route.query.scheduledAt) {
                const scheduledDate = new Date(res.data.scheduled_at);
                // Форматируем дату в формат, который ожидает DateTimePicker (YYYY-MM-DDTHH:mm)
                const year = scheduledDate.getFullYear();
                const month = String(scheduledDate.getMonth() + 1).padStart(2, '0');
                const day = String(scheduledDate.getDate()).padStart(2, '0');
                const hours = String(scheduledDate.getHours()).padStart(2, '0');
                const minutes = String(scheduledDate.getMinutes()).padStart(2, '0');
                scheduledAt.value = `${year}-${month}-${day}T${hours}:${minutes}`;
                console.log('Set scheduledAt from post data:', scheduledAt.value);
            }
        } else {
            window?.$toast?.error(res?.message || "Не удалось загрузить пост");
        }
    });
}

function initializeEditorContent(post) {
    if (!post) return;

    // Определяем какой текст показывать
    let textToShow = post.text || "";
    if (showingUniqueText.value && post.unique_text) {
        textToShow = post.unique_text;
    }

    const htmlContent = textToShow.replace(/\n/g, "<br>");
    if (editor.value) {
        editor.value.commands.setContent(htmlContent);
    }
}

function toggleTextMode() {
    showingUniqueText.value = !showingUniqueText.value;
    initializeEditorContent(postData.value);
}

async function preloadMedia(post) {
    if (!post || !post.media || !post.media.length) return;
    
    try {
        const mediaUrls = post.media
            .filter(media => media && media.file_path)
            .map(media => media.file_path);
            
        if (mediaUrls.length > 0) {
            console.log("Preloading media for post:", mediaUrls.length, "files");
            // Используем mediaPreloader для предзагрузки
            await mediaPreloader.preloadMedia(mediaUrls, 'low');
        }
    } catch (error) {
        console.warn("Failed to preload media:", error);
    }
}

const toolbar = computed(() => {
    if (!editor.value) return [];
    return [
        {
            label: "B",
            title: "Bold",
            action: () => editor.value.chain().focus().toggleBold().run(),
            isActive: () =>
                editor.value.isActive && editor.value.isActive("bold"),
        },
        {
            label: "I",
            title: "Italic",
            action: () => editor.value.chain().focus().toggleItalic().run(),
            isActive: () =>
                editor.value.isActive && editor.value.isActive("italic"),
        },
        {
            label: "U",
            title: "Underline",
            action: () => editor.value.chain().focus().toggleUnderline().run(),
            isActive: () =>
                editor.value.isActive && editor.value.isActive("underline"),
        },
        {
            label: "S",
            title: "Strike",
            action: () => editor.value.chain().focus().toggleStrike().run(),
            isActive: () =>
                editor.value.isActive && editor.value.isActive("strike"),
        },
        {
            label: "</>",
            title: "Code",
            action: () => editor.value.chain().focus().toggleCodeBlock().run(),
            isActive: () =>
                editor.value.isActive && editor.value.isActive("codeBlock"),
        },
        {
            label: "{}",
            title: "Inline code",
            action: () => editor.value.chain().focus().toggleCode().run(),
            isActive: () =>
                editor.value.isActive && editor.value.isActive("code"),
        },
        {
            label: '"',
            title: "Quote",
            action: () => editor.value.chain().focus().toggleBlockquote().run(),
            isActive: () =>
                editor.value.isActive && editor.value.isActive("blockquote"),
        },
        {
            label: "• List",
            title: "Bullet List",
            action: () => editor.value.chain().focus().toggleBulletList().run(),
            isActive: () =>
                editor.value.isActive && editor.value.isActive("bulletList"),
        },
        {
            label: "1. List",
            title: "Ordered List",
            action: () => editor.value.chain().focus().toggleOrderedList().run(),
            isActive: () =>
                editor.value.isActive && editor.value.isActive("orderedList"),
        },
        {
            label: "🔗",
            title: "Link",
            action: () => {
                const url = window.prompt("URL");
                if (url) {
                    editor.value.chain().focus().setLink({ href: url }).run();
                }
            },
            isActive: () =>
                editor.value.isActive && editor.value.isActive("link"),
        },
    ];
});

const hasText = computed(() => {
    const html = editor.value?.getHTML() || "";
    const text = html.replace(/<[^>]*>/g, "").trim();
    return text.length > 0;
});

// Media viewer functionality
const showMediaViewer = ref(false);
const currentMedia = ref(null);
const currentMediaIndex = ref(0);

const openMediaViewer = (media, index) => {
    currentMedia.value = media;
    currentMediaIndex.value = index;
    showMediaViewer.value = true;
};

const closeMediaViewer = () => {
    showMediaViewer.value = false;
    currentMedia.value = null;
    currentMediaIndex.value = 0;
};

const previousMedia = () => {
    if (currentMediaIndex.value > 0) {
        currentMediaIndex.value--;
        currentMedia.value = postData.value.media[currentMediaIndex.value];
    }
};

const nextMedia = () => {
    if (currentMediaIndex.value < postData.value.media.length - 1) {
        currentMediaIndex.value++;
        currentMedia.value = postData.value.media[currentMediaIndex.value];
    }
};

function isImageMedia(media) {
    return media.type === "photo" || media.type === "MessageMediaPhoto";
}

function isVideoMedia(media) {
    return (
        media.type === "video" ||
        media.type === "MessageMediaDocument" ||
        media.type === "document"
    );
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
            // Переключаемся на показ уникального текста
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
    const route = useRoute();
    loadChannels();
    
    // Получаем данные из query параметров
    const channelId = route.query.channelId;
    const scheduledAtParam = route.query.scheduledAt;
    
    console.log('Route query:', route.query);
    console.log('Channel ID from query:', channelId);
    console.log('Scheduled at from query:', scheduledAtParam);
    
    // Устанавливаем время публикации из параметров или по умолчанию
    if (scheduledAtParam) {
        const scheduledDate = new Date(scheduledAtParam);
        // Форматируем дату в формат, который ожидает DateTimePicker (YYYY-MM-DDTHH:mm)
        const year = scheduledDate.getFullYear();
        const month = String(scheduledDate.getMonth() + 1).padStart(2, '0');
        const day = String(scheduledDate.getDate()).padStart(2, '0');
        const hours = String(scheduledDate.getHours()).padStart(2, '0');
        const minutes = String(scheduledDate.getMinutes()).padStart(2, '0');
        scheduledAt.value = `${year}-${month}-${day}T${hours}:${minutes}`;
        console.log('Set scheduledAt to:', scheduledAt.value);
    } else {
        const futureTime = new Date(Date.now() + 60 * 60 * 1000);
        const year = futureTime.getFullYear();
        const month = String(futureTime.getMonth() + 1).padStart(2, '0');
        const day = String(futureTime.getDate()).padStart(2, '0');
        const hours = String(futureTime.getHours()).padStart(2, '0');
        const minutes = String(futureTime.getMinutes()).padStart(2, '0');
        scheduledAt.value = `${year}-${month}-${day}T${hours}:${minutes}`;
        console.log('Set default scheduledAt to:', scheduledAt.value);
    }
    
    // Устанавливаем выбранный канал из параметров
    if (channelId) {
        selectedChannel.value = channelId;
        console.log('Set selectedChannel to:', selectedChannel.value);
    }
    
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

.custom-editor-content {
    border: 1px solid #d1d5db;
    border-radius: 6px;
    outline: none;
    min-height: 200px;
    background: #fff;
    caret-color: #3b82f6;
    font-size: 1rem;
    font-family: inherit;
    cursor: text;
    resize: vertical;
    overflow-y: auto;
}
.custom-editor-content:focus {
    outline: none !important;
    box-shadow: none !important;
    border-color: #3b82f6 !important;
}

/* Убираем все синие рамки и фокусы */
.custom-editor-content .ProseMirror {
    outline: none !important;
    box-shadow: none !important;
    border: none !important;
    min-height: 180px;
    padding: 0;
    margin: 0;
}

.custom-editor-content .ProseMirror:focus {
    outline: none !important;
    box-shadow: none !important;
    border: none !important;
}

.custom-editor-content .ProseMirror p {
    margin: 0;
    padding: 0;
    min-height: 1.5em;
}

.custom-editor-content .ProseMirror p:first-child {
    margin-top: 0;
}

.custom-editor-content .ProseMirror p:last-child {
    margin-bottom: 0;
}

.file-btn {
    display: inline-flex;
    align-items: center;
    padding: 0.5rem 1rem;
    background-color: #f3f4f6;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    cursor: pointer;
    transition: all 0.2s;
}

.file-btn:hover {
    background-color: #e5e7eb;
    border-color: #9ca3af;
}

.file-btn:focus {
    outline: none;
    box-shadow: 0 0 0 2px #6366f1;
}

/* Глобальные стили для удаления всех рамок в редакторе */
:global(.ProseMirror) {
    outline: none !important;
    box-shadow: none !important;
    border: none !important;
    min-height: 180px !important;
}

:global(.ProseMirror:focus) {
    outline: none !important;
    box-shadow: none !important;
    border: none !important;
}

:global(.ProseMirror p) {
    margin: 0 !important;
    padding: 0 !important;
    min-height: 1.5em !important;
}

:global(.ProseMirror p:first-child) {
    margin-top: 0 !important;
}

:global(.ProseMirror p:last-child) {
    margin-bottom: 0 !important;
}
</style> 