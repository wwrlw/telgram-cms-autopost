<template>
  <Transition
    enter-active-class="transition ease-out duration-300"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition ease-in duration-200"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0">
    <div v-if="show" 
         class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
         @click="$emit('update:show', false)">
      <Transition
        enter-active-class="transition ease-out duration-300"
        enter-from-class="opacity-0 transform translate-y-4 sm:translate-y-0 sm:scale-95"
        enter-to-class="opacity-100 transform translate-y-0 sm:scale-100"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="opacity-100 transform translate-y-0 sm:scale-100"
        leave-to-class="opacity-0 transform translate-y-4 sm:translate-y-0 sm:scale-95">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white"
             @click.stop>
          <div class="mt-3">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Опубликовать в Telegram</h3>
            <form @submit.prevent="handleSubmit">
              <div class="mb-4">
                <label for="channel" class="block text-sm font-medium text-gray-700 mb-2">
                  Канал
                </label>
                <div v-if="loadingChannels" class="text-sm text-gray-500">
                  Загружаем каналы...
                </div>
                <select v-else 
                        v-model="formData.channel" 
                        id="channel"
                        required
                        class="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="">Выберите канал</option>
                  <option v-for="channel in publicationChannels" 
                          :key="channel.id" 
                          :value="channel.channel_id">
                    {{ channel.name }} 
                    <span v-if="!channel.is_active">(неактивен)</span>
                    ({{ channel.channel_type === 'public' ? 'публичный' : 'приватный' }})
                  </option>
                </select>
                
                <div v-if="!loadingChannels && publicationChannels.length === 0" 
                     class="mt-2 text-sm text-red-600">
                  Нет доступных каналов для публикации. 
                  <router-link to="/publication-channels" class="underline">
                    Добавить каналы
                  </router-link>
                </div>
              </div>
              
              <div class="mb-4">
                <label for="message" class="block text-sm font-medium text-gray-700 mb-2">
                  Сообщение
                </label>
                <textarea v-model="formData.message" 
                          id="message"
                          rows="4"
                          required
                          class="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Введите текст сообщения..."></textarea>
              </div>
              
              <div class="flex justify-end space-x-3">
                <button type="button" 
                        @click="$emit('update:show', false)"
                        class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  Отмена
                </button>
                <button type="submit"
                        :disabled="!formData.channel || !formData.message || loadingChannels"
                        class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
                  Опубликовать
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup>
import { reactive, watch, ref, onMounted } from 'vue';
import http from '../js/http.js';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  initialMessage: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:show', 'submit']);

const formData = reactive({
  channel: '',
  message: ''
});

const publicationChannels = ref([]);
const loadingChannels = ref(false);

const loadPublicationChannels = () => {
  loadingChannels.value = true;
  http.getActivePublicationChannels((response) => {
    loadingChannels.value = false;
    if (response.success) {
      publicationChannels.value = response.data;
    } else {
      console.error('Ошибка загрузки каналов:', response.message);
      publicationChannels.value = [];
    }
  });
};

const handleSubmit = () => {
  const selectedChannel = publicationChannels.value.find(ch => ch.channel_id === formData.channel);
  emit('submit', { 
    ...formData,
    channelName: selectedChannel?.name || 'Неизвестный канал'
  });
  formData.channel = '';
  formData.message = '';
  emit('update:show', false);
};

watch(() => props.initialMessage, (newMessage) => {
  if (newMessage) {
    formData.message = newMessage;
  }
}, { immediate: true });

watch(() => props.show, (newShow) => {
  if (newShow) {
    loadPublicationChannels();
  }
});

onMounted(() => {
  if (props.show) {
    loadPublicationChannels();
  }
});
</script> 