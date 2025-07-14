<template>
  <div v-if="$route.name !== 'login'">
    <Sidebar>
      <Header :loading="loading" @refreshPosts="refreshPosts" class="bg-white shadow-sm border-b border-gray-200 flex-shrink-0"/>
      
      <div class="flex-1 overflow-auto">
        <RouterView />
      </div>
    </Sidebar>
    
    <!-- Глобальный компонент уведомлений -->
    <Toast />
  </div>
  
  <router-view v-else />
</template>

<script setup>
import Header from '@/components/HeaderComponent.vue';
import Sidebar from '@/components/Sidebar.vue';
import Toast from '@/components/Shared/Toast.vue';
import { ref, provide } from 'vue';

const loading = ref(false);
const refreshTrigger = ref(0);

provide('loading', loading);
provide('refreshTrigger', refreshTrigger);

const refreshPosts = () => {
  loading.value = true;
  refreshTrigger.value++;
};

provide('setLoading', (value) => {
  loading.value = value;
});
</script>

<style scoped>
</style>
