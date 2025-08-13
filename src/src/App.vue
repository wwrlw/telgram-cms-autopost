<template>
    <div v-if="$route.name !== 'login'">
        <Sidebar>
            <Header
                :loading="loading"
                @refreshPosts="refreshPosts"
                class="bg-white shadow-sm border-b border-gray-200 flex-shrink-0"
            />

            <div class="flex-1 overflow-auto">
                <RouterView />
            </div>
        </Sidebar>


        <Toast />
    </div>

    <router-view v-else />
</template>

<script setup>
import Header from "@/components/Header.vue";
import Sidebar from "@/components/Sidebar.vue";
import Toast from "@/components/Shared/Toast.vue";
import { ref, provide, onMounted, onUnmounted } from "vue";
import http from "@/js/http";

const loading = ref(false);
const refreshTrigger = ref(0);

provide("loading", loading);
provide("refreshTrigger", refreshTrigger);

const refreshPosts = () => {
    refreshTrigger.value++;
    loading.value = true;
};

provide("setLoading", (value) => {
    loading.value = value;
});

// Глобальная проверка подключения к бэкенду
const checkBackendConnection = async () => {
  try {
    const response = await http.instance.get('/auth/check');
    if (response.data.success) {
      // Подключение восстановлено - скрываем предыдущие уведомления об ошибках
      console.log('Backend connection restored');
      if (window.$toast) {
        window.$toast.clearByType('error');
      }
    }
  } catch (error) {
    console.error('Backend connection check failed:', error);
    
    // Проверяем, является ли ошибка связанной с подключением
    if (error.code === 'ERR_NETWORK' || 
        error.message?.includes('Network Error') || 
        error.message?.includes('timeout') ||
        !error.response) {
      // Показываем глобальное уведомление о проблеме с подключением
      if (window.$toast) {
        window.$toast.error('Проблема с коннектом. Проверьте интернет-соединение', 15000);
      }
    }
  }
};

let connectionCheckInterval;

onMounted(() => {
  // Запускаем проверку подключения каждые 30 секунд
  connectionCheckInterval = setInterval(checkBackendConnection, 30000);
  
  // Первая проверка через 5 секунд после загрузки
  setTimeout(checkBackendConnection, 5000);
});

onUnmounted(() => {
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
  }
});
</script>
<style scoped></style>
