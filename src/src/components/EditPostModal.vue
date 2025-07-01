<template>
    <div>
      <!-- Модальное окно редактирования поста -->
      <Transition
        enter-active-class="transition ease-out duration-300"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0">
        <div v-if="show" 
             class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
             @click="close">
          <Transition
            enter-active-class="transition ease-out duration-300"
            enter-from-class="opacity-0 transform translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to-class="opacity-100 transform translate-y-0 sm:scale-100"
            leave-active-class="transition ease-in duration-200"
            leave-from-class="opacity-100 transform translate-y-0 sm:scale-100"
            leave-to-class="opacity-0 transform translate-y-4 sm:translate-y-0 sm:scale-95">
            <div class="relative top-10 mx-auto p-6 border w-full max-w-4xl shadow-lg rounded-md bg-white"
                 @click.stop>
              <div class="mb-4">
                <h3 class="text-lg font-semibold text-gray-900">Редактировать пост</h3>
                <p class="text-sm text-gray-600 mt-1">Внесите изменения в пост. Поля можно оставить пустыми для сохранения текущего значения.</p>
              </div>
  
              <form @submit.prevent="updatePost">
                <div class="mb-4">
                  <label for="postText" class="block text-sm font-medium text-gray-700 mb-2">
                    Текст поста
                  </label>
                  <textarea
                    id="postText"
                    v-model="formData.text"
                    rows="6"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Введите текст поста..."
                  ></textarea>
                </div>
  
                <div class="mb-4">
                  <label for="postUrl" class="block text-sm font-medium text-gray-700 mb-2">
                    Ссылка
                  </label>
                  <input
                    id="postUrl"
                    v-model="formData.url"
                    type="url"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="https://example.com"
                  />
                </div>
  
                <div class="mb-4">
                  <label for="sourceChannel" class="block text-sm font-medium text-gray-700 mb-2">
                    Источник канала
                  </label>
                  <input
                    id="sourceChannel"
                    v-model="formData.source_channel"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="@channel_name"
                  />
                </div>
  
                <div class="mb-6">
                  <div class="flex items-center">
                    <input
                      id="isUnique"
                      v-model="formData.is_unique"
                      type="checkbox"
                      class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label for="isUnique" class="ml-2 block text-sm text-gray-700">
                      Отметить как уникальный контент
                    </label>
                  </div>
                </div>
  
                <div class="flex justify-end space-x-3">
                  <button
                    type="button"
                    @click="close"
                    class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    :disabled="saving"
                    class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span v-if="saving">Сохранение...</span>
                    <span v-else>Сохранить изменения</span>
                  </button>
                </div>
              </form>
            </div>
          </Transition>
        </div>
      </Transition>
    </div>
  </template>
  
  <script setup>
  import { ref, watch, getCurrentInstance } from 'vue';
  import http from '../js/http.js';
  
  const props = defineProps({
    show: {
      type: Boolean,
      default: false
    },
    post: {
      type: Object,
      default: null
    }
  });
  
  const emit = defineEmits(['update:show', 'updated']);
  
  const { proxy } = getCurrentInstance();
  
  const saving = ref(false);
  const formData = ref({
    text: '',
    url: '',
    source_channel: '',
    is_unique: false
  });
  
  // Заполняем форму данными поста при открытии
  watch(() => props.post, (newPost) => {
    if (newPost) {
      formData.value = {
        text: newPost.text || '',
        url: newPost.url || '',
        source_channel: newPost.source_channel || '',
        is_unique: newPost.is_unique || false
      };
    }
  }, { immediate: true });
  
  const close = () => {
    emit('update:show', false);
  };
  
  const updatePost = () => {
    if (!props.post?._id) {
      proxy.$toast.error('Ошибка: ID поста не найден');
      return;
    }
  
    saving.value = true;
  
    const updateData = {
      id: props.post._id
    };
  
    if (formData.value.text.trim()) {
      updateData.text = formData.value.text.trim();
    }
    if (formData.value.url.trim()) {
      updateData.url = formData.value.url.trim();
    }
    if (formData.value.source_channel.trim()) {
      updateData.source_channel = formData.value.source_channel.trim();
    }
    // is_unique всегда отправляем, так как это boolean
    updateData.is_unique = formData.value.is_unique;
  
    http.updatePost(updateData, (response) => {
      saving.value = false;
      
      if (response.success) {
        proxy.$toast.success('Пост успешно обновлен');
        emit('updated', response);
        close();
      } else {
        proxy.$toast.error('Ошибка обновления поста: ' + response.message);
      }
    });
  };
  </script> 