<template>
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="mb-8">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">Отложенные публикации</h1>
              <p class="mt-2 text-sm text-gray-600">
                Управление запланированными постами для публикации в Telegram каналах
              </p>
            </div>
            <button 
              @click="refreshData" 
              :disabled="loading || loadingPublished"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200">
              <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              {{ (loading || loadingPublished) ? 'Обновление...' : 'Обновить' }}
            </button>
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
                'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm'
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
                'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm'
              ]"
            >
              ✅ Опубликованные ({{ publishedPosts.length }})
            </button>
          </nav>
        </div>
  
        <div v-show="activeTab === 'scheduled'" class="bg-white shadow overflow-hidden sm:rounded-md">
          <div v-if="loading" class="p-8 text-center">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p class="mt-2 text-sm text-gray-500">Загружаем отложенные публикации...</p>
          </div>
          
          <div v-else-if="scheduledPosts.length === 0" class="p-8 text-center text-gray-500">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">Нет отложенных публикаций</h3>
            <p class="mt-1 text-sm text-gray-500">Запланированные посты появятся здесь.</p>
          </div>
  
          <ul v-else class="divide-y divide-gray-200">
            <li v-for="post in scheduledPosts" :key="post._id" class="px-6 py-4">
              <div class="flex items-center justify-between">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center">
                    <div class="flex-shrink-0">
                      <span :class="[
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        isOverdue(post.scheduled_at) ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      ]">
                        {{ isOverdue(post.scheduled_at) ? 'Просрочено' : 'Запланировано' }}
                      </span>
                    </div>
                    <div class="ml-4 flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 truncate">
                        {{ getPreviewText(post.text) }}
                      </p>
                      <div class="mt-1 text-sm text-gray-500">
                        <p>📅 Время публикации: {{ formatDateTime(post.scheduled_at) }}</p>
                        <p>📺 Канал: {{ getChannelName(post.scheduled_channel_id) }}</p>
                        <p v-if="post.url">🔗 Ссылка: {{ post.url }}</p>
                        <p v-if="post.media?.length">📎 Медиафайлов: {{ post.media.length }}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="flex items-center space-x-2 ml-4">
                  <button
                    @click="editSchedule(post)"
                    class="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                  >
                    Изменить
                  </button>
                  <button
                    @click="cancelSchedule(post)"
                    class="text-red-600 hover:text-red-900 text-sm font-medium"
                  >
                    Отменить
                  </button>
                </div>
              </div>
            </li>
          </ul>
        </div>
  
        <div v-show="activeTab === 'published'" class="bg-white shadow overflow-hidden sm:rounded-md">
          <div v-if="loadingPublished" class="p-8 text-center">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p class="mt-2 text-sm text-gray-500">Загружаем опубликованные посты...</p>
          </div>
          
          <div v-else-if="publishedPosts.length === 0" class="p-8 text-center text-gray-500">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">Нет опубликованных постов</h3>
            <p class="mt-1 text-sm text-gray-500">Автоматически опубликованные посты появятся здесь.</p>
          </div>
  
          <ul v-else class="divide-y divide-gray-200">
            <li v-for="post in publishedPosts" :key="post._id" class="px-6 py-4">
              <div class="flex items-center justify-between">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center">
                    <div class="flex-shrink-0">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✅ Опубликовано
                      </span>
                    </div>
                    <div class="ml-4 flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 truncate">
                        {{ getPreviewText(post.text) }}
                      </p>
                      <div class="mt-1 text-sm text-gray-500">
                        <p>✅ Опубликовано: {{ formatDateTime(post.published_at) }}</p>
                        <p v-if="post.scheduled_at">📅 Было запланировано на: {{ formatDateTime(post.scheduled_at) }}</p>
                        <p>📺 Канал: {{ getChannelName(post.scheduled_channel_id) }}</p>
                        <p v-if="post.url">🔗 Ссылка: {{ post.url }}</p>
                        <p v-if="post.media?.length">📎 Медиафайлов: {{ post.media.length }}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="flex items-center space-x-2 ml-4">
                  <span class="text-sm text-green-600 font-medium">Успешно опубликовано</span>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
  
      <SchedulePublishModal
        :show="showEditModal"
        :post="editingPost"
        @update:show="showEditModal = $event"
        @scheduled="handleScheduleUpdated"
      />
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, getCurrentInstance, onActivated } from 'vue';
  import http from '../js/http.js';
  import SchedulePublishModal from '@/components/Modal/SchedulePublishModal.vue';
  
  const { proxy } = getCurrentInstance();
  
  const scheduledPosts = ref([]);
  const publishedPosts = ref([]);
  const loading = ref(true);
  const loadingPublished = ref(true);
  const showEditModal = ref(false);
  const editingPost = ref(null);
  const channels = ref([]);
  const activeTab = ref('scheduled'); // 'scheduled' or 'published'
  
  const loadScheduledPosts = () => {
    loading.value = true;
    http.getScheduledPosts((response) => {
      if (response.success) {
        scheduledPosts.value = response.data || [];
        loading.value = false;
      } else {
        window.$toast.error('Ошибка загрузки отложенных публикаций: ' + response.message);
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
        window.$toast.error('Ошибка загрузки опубликованных постов: ' + response.message);
        loadingPublished.value = false;
      }
    });
  };
  
  const loadChannels = () => {
    http.getActivePublicationChannels((response) => {
      if (response.success) {
        channels.value = response.data;
      }
    });
  };
  
  const refreshData = () => {
    loadScheduledPosts();
    loadPublishedPosts();
    loadChannels();
  };
  
  const getPreviewText = (text) => {
    if (!text) return 'Текст отсутствует';
    return text.length > 80 ? text.substring(0, 80) + '...' : text;
  };
  
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU');
  };
  
  const isOverdue = (scheduledDate) => {
    const now = new Date();
    const scheduled = new Date(scheduledDate);
    return scheduled < now;
  };
  
  const getChannelName = (channelId) => {
    const channel = channels.value.find(ch => ch.channel_id === channelId);
    return channel ? channel.name : `ID: ${channelId}`;
  };
  
  const editSchedule = (post) => {
    editingPost.value = post;
    showEditModal.value = true;
  };
  
  const cancelSchedule = (post) => {
    console.log('Canceling scheduled post:', post);
    if (confirm(`Вы действительно хотите отменить публикацию поста "${getPreviewText(post.text)}"?`)) {
      console.log('User confirmed cancellation, calling API with ID:', post._id);
      http.cancelScheduledPost(post._id, (response) => {
        if (response.success) {
          window.$toast.success('Отложенная публикация отменена');
          loadScheduledPosts();
        } else {
          window.$toast.error('Ошибка отмены публикации: ' + response.message);
        }
      });
    }
  };
  
  const handleScheduleUpdated = (result) => {
    showEditModal.value = false;
    const currentPost = editingPost.value;
    editingPost.value = null;
    
    if (result.success) {
      if (result.data && currentPost) {
        const index = scheduledPosts.value.findIndex(p => p._id === currentPost._id);
        if (index !== -1) {
          scheduledPosts.value[index] = { ...scheduledPosts.value[index], ...result.data };
        }
      } else {
        loadScheduledPosts();
      }
      window.$toast.success(result.message || 'Расписание обновлено');
    } else {
      window.$toast.error(result.message || 'Ошибка обновления расписания');
    }
  };
  
  onMounted(() => {
    loadScheduledPosts();
    loadPublishedPosts();
    loadChannels();
  });

  // Обновляем данные при активации страницы (например, при возврате с другой страницы)
  onActivated(() => {
    refreshData();
  });
  </script> 