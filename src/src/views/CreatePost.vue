<template>
    <div class="min-h-screen bg-white flex flex-col">
        <div class="flex-1 w-full p-4 lg:p-6 flex flex-col">
            <div class="flex items-start justify-between mb-4">
                <h2 class="text-lg font-semibold">Создать пост</h2>
                <button @click="cancel" class="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
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
                            :class="{ 'bg-indigo-100 text-indigo-700': btn.isActive() }"
                        >
                            {{ btn.label }}
                        </button>
                    </div>
                    <div v-if="showEmojiPicker" class="absolute top-full left-0 mt-1 bg-white border rounded shadow p-2 z-50 w-72 h-60 overflow-hidden">
                        <emoji-picker @emoji-click="insertEmojiEvent" style="--emoji-size: 20px; width:100%; height:100%;" />
                    </div>
                    <div v-if="showLinkInput" class="absolute top-full left-0 mt-1 bg-white border rounded shadow p-3 z-50 w-64">
                        <input v-model="linkUrl" placeholder="https://example.com" class="border rounded w-full text-sm px-2 py-1 mb-2" />
                        <div class="flex justify-end gap-2">
                            <button @click.stop="cancelLink" class="px-2 py-1 text-sm bg-gray-200 rounded">Отмена</button>
                            <button @click.stop="confirmLink" class="px-2 py-1 text-sm bg-indigo-600 text-white rounded">OK</button>
                        </div>
                    </div>
                </div>
                <EditorContent :editor="editor" class="p-3 h-64 custom-editor-content overflow-y-auto" />
            </div>

            <div class="space-y-4 mb-4">
                <div class="flex items-center gap-2">
                    <button type="button" class="file-btn" @click="triggerFile">
                        <svg class="w-5 h-5 mr-1 text-indigo-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.586-6.586a2 2 0 10-2.828-2.828z" />
                            <path stroke-linecap="round" stroke-linejoin="round" d="M16 7V3a1 1 0 00-1-1h-4a1 1 0 00-1 1v4" />
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
                    <span class="text-xs text-gray-500">До 10 файлов</span>
                </div>
                <div v-if="previews.length" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-4">
                    <div v-for="(item, idx) in previews" :key="idx" class="relative group border rounded overflow-hidden">
                        <img v-if="item.isImage" :src="item.url" class="w-full h-32 object-cover" />
                        <video v-else muted :src="item.url" class="w-full h-32 object-cover"></video>
                        <button @click="removeFile(idx)" class="absolute top-1 right-1 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                    </div>
                </div>
            </div>

            <div class="space-y-4 mb-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Канал для публикации</label>
                    <select v-model="selectedChannel" class="border rounded p-2 text-sm w-full">
                        <option value="">Выберите канал</option>
                        <option v-for="channel in channels" :key="channel._id" :value="channel.channel_id">
                            {{ channel.name }}
                        </option>
                    </select>
                </div>
                <div class="flex items-center gap-2">
                    <input id="schedule" type="checkbox" v-model="schedule" />
                    <label for="schedule" class="text-sm">Опубликовать позже</label>
                </div>
                <div v-if="schedule" class="space-y-3 pl-6 border-l-2 border-gray-200">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Дата и время публикации</label>
                        <input v-model="scheduledAt" type="datetime-local" class="border rounded p-2 text-sm w-full" />
                    </div>
                </div>
            </div>

            <div class="flex justify-end gap-3 mt-4">
                <button @click="cancel" class="px-4 py-2 rounded bg-gray-200" :disabled="isSubmitting">Отмена</button>
                <button @click="publishLater" class="px-4 py-2 rounded bg-blue-600 text-white" :disabled="isSubmitting">
                    {{ isSubmitting ? 'Планирование...' : 'Опубликовать позже' }}
                </button>
                <button @click="publishNow" class="px-4 py-2 rounded bg-indigo-600 text-white" :disabled="isSubmitting">
                    {{ isSubmitting ? 'Публикация...' : 'Опубликовать сейчас' }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { EditorContent, useEditor } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import http from '@/js/http';
import TurndownService from 'turndown';
import { getMediaUrl } from '@/js/utils';
import 'emoji-picker-element';

const router = useRouter();
const route = useRoute();
const postId = route.params.id;

const files = ref([]);
const fileInputRef = ref(null);
const schedule = ref(false);
const scheduledAt = ref('');
const selectedChannel = ref('');
const channels = ref([]);
const loadingPost = ref(false);
const postData = ref(null);
const previews = ref([]);
const isSubmitting = ref(false);

const editor = useEditor({
    extensions: [StarterKit, Link, Underline],
    content: '',
});

const turndownService = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });

turndownService.addRule('underline', {
    filter: ['u'],
    replacement: (content) => `__${content}__`,
});

turndownService.addRule('strikethrough', {
    filter: ['s', 'strike', 'del'],
    replacement: (content) => `~~${content}~~`,
});


const loadChannels = () => {
    http.getActivePublicationChannels((response) => {
        if (response.success) {
            channels.value = response.data || [];
        }
    });
}

const addFiles = (newArr) => {
    const spaceLeft = 10 - files.value.length;
    const slice = newArr.slice(0, spaceLeft);
    slice.forEach((file) => {
        files.value.push(file);
        const url = URL.createObjectURL(file);
        previews.value.push({ url, isImage: file.type.startsWith('image') });
    });
}

const handleFiles = (e) => {
    addFiles(Array.from(e.target.files));
    e.target.value = '';
}

const triggerFile = () => {
    fileInputRef.value?.click();
}

const cancel = () => {
    router.back();
}

const send = async (publishLater) => {
    if (isSubmitting.value) return;
    
    const html = editor.value?.getHTML() || '';
    const markdown = turndownService.turndown(html);
    if (!markdown.trim() && files.value.length === 0) {
        window?.$toast?.error('Добавьте текст или медиа');
        return;
    }
    if (!selectedChannel.value) {
        window?.$toast?.error('Выберите канал для публикации');
        return;
    }
    if (publishLater) {
        if (!scheduledAt.value) {
            window?.$toast?.error('Укажите дату');
            return;
        }
    }

    isSubmitting.value = true;

    try {
        const uploadedFiles = [];
        if (files.value.length > 0) {
            for (const file of files.value) {
                const formData = new FormData();
                formData.append('file', file);
                
                try {
                    const uploadResult = await new Promise((resolve, reject) => {
                        http.uploadMedia(formData, resolve, reject);
                    });
                    
                    if (uploadResult.success) {
                        uploadedFiles.push(uploadResult.data);
                    } else {
                        window?.$toast?.error(`Ошибка загрузки файла ${file.name}: ${uploadResult.message}`);
                        return;
                    }
                } catch (error) {
                    window?.$toast?.error(`Ошибка загрузки файла ${file.name}`);
                    return;
                }
            }
        }

        const postData = {
            text: markdown,
            channel_id: selectedChannel.value,
            media: uploadedFiles
        };

        if (publishLater) {
            postData.scheduled_at = new Date(scheduledAt.value).toISOString();
        }

        http.createPost(
            postData,
            (response) => {
                isSubmitting.value = false;
                if (response.success) {
                    if (publishLater) {
                        window?.$toast?.success('Пост запланирован');
                        router.push('/scheduled-posts');
                    } else {
                        const postId = response.data._id;
                        http.publishToChannel(postId, selectedChannel.value, (publishRes) => {
                            if (publishRes.success) {
                                window?.$toast?.success('Пост опубликован в Telegram!');
                                router.push('/');
                            } else {
                                window?.$toast?.error('Ошибка публикации: ' + (publishRes.message || ''));
                            }
                        });
                    }
                } else {
                    window?.$toast?.error(response.message || 'Ошибка создания поста');
                }
            },
            (error) => {
                isSubmitting.value = false;
                console.error('Error creating post:', error);
                window?.$toast?.error('Ошибка создания поста');
            }
        );
    } catch (error) {
        isSubmitting.value = false;
        console.error('Error in send function:', error);
        window?.$toast?.error('Произошла ошибка при отправке поста');
    }
}

function publishNow() {
    send(false);
}
function publishLater() {
    send(true);
}

function loadPost() {
    loadingPost.value = true;
    http.post({ id: postId }, async (res) => {
        loadingPost.value = false;
        if (res && res.success) {
            postData.value = res.data;
            initializeEditorContent(res.data);
            await preloadMedia(res.data);
        } else {
            window?.$toast?.error(res?.message || 'Не удалось загрузить пост');
        }
    });
}

function initializeEditorContent(post) {
    if (!post) return;
    const htmlContent = (post.text || '').replace(/\n/g, '<br>');
    if (editor.value) {
        editor.value.commands.setContent(htmlContent);
    }
}

async function preloadMedia(post) {
    if (!post || !post.media || !post.media.length) return;
    const arr = [];
    for (const m of post.media.slice(0, 10)) {
        try {
            const url = getMediaUrl(m.file_path);
            const response = await fetch(url);
            const blob = await response.blob();
            const filename = m.file_path.split('/').pop() || 'media';
            const file = new File([blob], filename, { type: blob.type });
            arr.push(file);
        } catch (e) {
            console.error('Ошибка загрузки медиа', e);
        }
    }
    addFiles(arr);
}

const toolbar = computed(() => {
    if (!editor.value) return [];
    return [
        { label: 'B', title: 'Bold', action: () => editor.value.chain().focus().toggleBold().run(), isActive: () => editor.value.isActive && editor.value.isActive('bold') },
        { label: 'I', title: 'Italic', action: () => editor.value.chain().focus().toggleItalic().run(), isActive: () => editor.value.isActive && editor.value.isActive('italic') },
        { label: 'U', title: 'Underline', action: () => editor.value.chain().focus().toggleUnderline().run(), isActive: () => editor.value.isActive && editor.value.isActive('underline') },
        { label: 'S', title: 'Strike', action: () => editor.value.chain().focus().toggleStrike().run(), isActive: () => editor.value.isActive && editor.value.isActive('strike') },
        { label: '</>', title: 'Code', action: () => editor.value.chain().focus().toggleCodeBlock().run(), isActive: () => editor.value.isActive && editor.value.isActive('codeBlock') },
        { label: '{}', title: 'Inline code', action: () => editor.value.chain().focus().toggleCode().run(), isActive: () => editor.value.isActive && editor.value.isActive('code') },
        { label: '"', title: 'Quote', action: () => editor.value.chain().focus().toggleBlockquote().run(), isActive: () => editor.value.isActive && editor.value.isActive('blockquote') },
        { label: '• List', title: 'Bullet List', action: () => editor.value.chain().focus().toggleBulletList().run(), isActive: () => editor.value.isActive && editor.value.isActive('bulletList') },
        { label: '1. List', title: 'Ordered List', action: () => editor.value.chain().focus().toggleOrderedList().run(), isActive: () => editor.value.isActive && editor.value.isActive('orderedList') },
        { label: '😀', title: 'Emoji', action: toggleEmojiPicker, isActive: () => false },
        { label: '🔗', title: 'Link', action: toggleLinkInput, isActive: () => editor.value.isActive && editor.value.isActive('link') },
    ];
});

function removeFile(index) {
    files.value.splice(index, 1);
    const prev = previews.value.splice(index, 1)[0];
    if (prev?.url) URL.revokeObjectURL(prev.url);
}

const showEmojiPicker = ref(false);
const showLinkInput = ref(false);
const linkUrl = ref('');

function toggleEmojiPicker() {
    showLinkInput.value = false;
    showEmojiPicker.value = !showEmojiPicker.value;
}

function insertEmojiEvent(e) {
    const emoji = e.detail.unicode;
    if (emoji) editor.value.chain().focus().insertContent(emoji).run();
}

function toggleLinkInput() {
    showLinkInput.value = !showLinkInput.value;
    showEmojiPicker.value = false;
    linkUrl.value = '';
}

function confirmLink() {
    if (linkUrl.value.trim()) {
        editor.value.chain().focus().extendMarkRange('link').setLink({ href: linkUrl.value.trim() }).run();
    }
    showLinkInput.value = false;
}

function cancelLink() {
    showLinkInput.value = false;
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

.custom-editor-content {
    border: 1px solid #d1d5db;
    border-radius: 6px;
    outline: none;
    min-height: 150px;
    background: #fff;
    caret-color: #3b82f6;
    font-size: 1rem;
    font-family: inherit;
    cursor: text;
}
.custom-editor-content:focus {
    outline: none !important;
    box-shadow: none !important;
    border: 1px solid #d1d5db !important;
}
.custom-editor-content .ProseMirror:focus {
    outline: none !important;
    box-shadow: none !important;
    border: 1px solid #d1d5db !important;
}

.file-btn {
    display: inline-flex;
    align-items: center;
    background: #eef2ff;
    color: #3730a3;
    border: none;
    border-radius: 6px;
    padding: 0.5rem 1rem;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
}
.file-btn:hover {
    background: #c7d2fe;
}
</style>
