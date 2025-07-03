<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div class="bg-white w-full max-w-3xl rounded-lg shadow-lg p-6 overflow-y-auto max-h-[90vh]">
      <div class="flex items-start justify-between mb-4">
        <h2 class="text-lg font-semibold">Создать новый пост</h2>
        <button class="text-gray-400 hover:text-gray-600" @click="close">✕</button>
      </div>

      <!-- Editor -->
      <div class="mb-4">
        <div class="flex flex-wrap gap-1 p-2 border-b">
          <button v-for="btn in toolbar" :key="btn.title" :title="btn.title" @click="btn.action" class="px-2 py-1 text-sm rounded hover:bg-gray-200" :class="{ 'bg-indigo-100 text-indigo-700': btn.isActive() }">{{ btn.label }}</button>
        </div>
        <EditorContent :editor="editor" class="p-3 min-h-[150px] custom-editor-content" />
      </div>

      <!-- Медиа -->
      <div class="space-y-2 mb-4">
        <label class="sr-only">Файлы</label>
        <div class="flex items-center gap-2">
          <button type="button" class="file-btn" @click="() => $refs.fileInput.click()">
            <svg class="w-5 h-5 mr-1 text-indigo-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.586-6.586a2 2 0 10-2.828-2.828z"/><path stroke-linecap="round" stroke-linejoin="round" d="M16 7V3a1 1 0 00-1-1h-4a1 1 0 00-1 1v4"/></svg>
            <span>Прикрепить файлы</span>
          </button>
          <input ref="fileInput" type="file" multiple accept="image/*,video/*,audio/*" @change="handleFiles" class="hidden" />
          <span class="text-xs text-gray-500">До 10 файлов</span>
        </div>
        <div v-if="files.length" class="flex flex-wrap gap-2 mt-2">
          <span v-for="(f,i) in files" :key="i" class="px-2 py-1 bg-gray-100 rounded text-xs">{{ f.name }}</span>
        </div>
      </div>

      <!-- Schedule -->
      <div class="space-y-4 mb-6">
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

      <!-- Buttons -->
      <div class="flex justify-end gap-3">
        <button @click="close" class="px-4 py-2 rounded bg-gray-200">Отмена</button>
        <button @click="publishNow" class="px-4 py-2 rounded bg-indigo-600 text-white">Опубликовать сейчас</button>
        <button v-if="schedule" @click="publishLater" class="px-4 py-2 rounded bg-blue-600 text-white">Запланировать</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue';
import { EditorContent, useEditor } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import http from '@/js/http';
import TurndownService from 'turndown';

const props = defineProps({ show: Boolean });
const emit = defineEmits(['update:show', 'created']);

const files = ref([]);
const schedule = ref(false);
const scheduledAt = ref('');
const selectedChannel = ref('');
const channels = ref([]);

const editor = useEditor({
  extensions: [StarterKit, Link, Underline],
  content: '',
});

const turndownService = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });

watch(
  () => props.show,
  (v) => {
    if (!v && editor.value) editor.value.commands.setContent('');
    if (v) {
      loadChannels();
      // Устанавливаем время по умолчанию (через час)
      const futureTime = new Date(Date.now() + 60 * 60 * 1000);
      scheduledAt.value = futureTime.toISOString().slice(0, 16);
    }
  }
);

onBeforeUnmount(() => {
  editor.value?.destroy();
});

function close() {
  emit('update:show', false);
  // Сброс формы
  schedule.value = false;
  scheduledAt.value = '';
  selectedChannel.value = '';
  files.value = [];
}

function loadChannels() {
  http.getActivePublicationChannels((response) => {
    if (response.success) {
      channels.value = response.data || [];
    }
  });
}

function handleFiles(e) {
  files.value = Array.from(e.target.files).slice(0, 10);
}

function send(publishLater) {
  // Получаем HTML из редактора
  const html = editor.value?.getHTML() || '';
  // Конвертируем HTML в Markdown
  const markdown = turndownService.turndown(html);
  if (!markdown.trim() && files.value.length === 0) {
    window?.$toast?.error('Добавьте текст или медиа');
    return;
  }
  if (!selectedChannel.value) {
    window?.$toast?.error('Выберите канал для публикации');
    return;
  }
  if (publishLater && !scheduledAt.value) {
    window?.$toast?.error('Укажите дату');
    return;
  }
  
  const fd = new FormData();
  fd.append('text', markdown);
  files.value.forEach((f) => fd.append('file', f));
  fd.append('channel_id', selectedChannel.value);
  if (publishLater) {
    fd.append('scheduled_at', new Date(scheduledAt.value).toISOString());
  }
  // Выводим FormData в консоль
  for (let pair of fd.entries()) {
    console.log('FormData:', pair[0], pair[1]);
  }
  
  http.createPost(
    fd,
    (response) => {
      if (response.success) {
        if (publishLater) {
          window?.$toast?.success('Пост запланирован');
          emit('created');
          close();
          setTimeout(() => {
            window.location.href = '/scheduled-posts';
          }, 300);
        } else {
          // Сразу публикуем пост в Telegram
          const postId = response.data._id;
          http.publishToChannel(postId, selectedChannel.value, (publishRes) => {
            if (publishRes.success) {
              window?.$toast?.success('Пост опубликован в Telegram!');
              emit('created');
              close();
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
      console.error('Error creating post:', error);
      window?.$toast?.error('Ошибка создания поста');
    }
  );
}

function publishNow() { send(false); }
function publishLater() { send(true); }

const toolbar = computed(() => {
  if (!editor.value) return [];
  return [
    { label: 'B', title: 'Bold', action: () => editor.value.chain().focus().toggleBold().run(), isActive: () => typeof editor.value.isActive === 'function' && editor.value.isActive('bold') },
    { label: 'I', title: 'Italic', action: () => editor.value.chain().focus().toggleItalic().run(), isActive: () => typeof editor.value.isActive === 'function' && editor.value.isActive('italic') },
    { label: 'U', title: 'Underline', action: () => editor.value.chain().focus().toggleUnderline().run(), isActive: () => typeof editor.value.isActive === 'function' && editor.value.isActive('underline') },
    { label: 'S', title: 'Strike', action: () => editor.value.chain().focus().toggleStrike().run(), isActive: () => typeof editor.value.isActive === 'function' && editor.value.isActive('strike') },
    { label: '</>', title: 'Code', action: () => editor.value.chain().focus().toggleCodeBlock().run(), isActive: () => typeof editor.value.isActive === 'function' && editor.value.isActive('codeBlock') },
    { label: '{}', title: 'Inline code', action: () => editor.value.chain().focus().toggleCode().run(), isActive: () => typeof editor.value.isActive === 'function' && editor.value.isActive('code') },
    { label: '"', title: 'Quote', action: () => editor.value.chain().focus().toggleBlockquote().run(), isActive: () => typeof editor.value.isActive === 'function' && editor.value.isActive('blockquote') },
    { label: '• List', title: 'Bullet List', action: () => editor.value.chain().focus().toggleBulletList().run(), isActive: () => typeof editor.value.isActive === 'function' && editor.value.isActive('bulletList') },
    { label: '1. List', title: 'Ordered List', action: () => editor.value.chain().focus().toggleOrderedList().run(), isActive: () => typeof editor.value.isActive === 'function' && editor.value.isActive('orderedList') },
    { label: '🔗', title: 'Link', action: () => {
        const url = prompt('URL');
        if (url) editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
      }, isActive: () => typeof editor.value.isActive === 'function' && editor.value.isActive('link') },
  ];
});
</script>

<style scoped>
/* минимальные стили тулбара */
button:disabled { opacity:0.5; cursor: not-allowed; }

/* Убрать border вокруг редактора, добавить caret */
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

/* Кастомная кнопка для файлов */
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

<style>
:global(.custom-editor-content .ProseMirror),
:global(.custom-editor-content .ProseMirror:focus) {
  outline: none !important;
  box-shadow: none !important;
  border: 1px solid #d1d5db !important;
}
:global(.ProseMirror),
:global(.ProseMirror:focus) {
  outline: none !important;
  box-shadow: none !important;
  border: 1px solid #d1d5db !important;
}
</style> 