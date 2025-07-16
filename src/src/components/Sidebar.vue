<template>
  <div class="flex h-screen bg-gray-100">
    <div 
      class="bg-gray-800 text-white flex flex-col transition-all duration-300"
      :class="isCollapsed ? 'w-16' : 'w-56'"
    >
      <div class="p-4 border-b border-gray-700 flex items-center justify-between">
        <router-link to="/" class="text-xl font-semibold hover:text-indigo-600 transition-colors cursor-pointer">
          TG ADMIN
        </router-link>
        <button 
          @click="toggleCollapse"
          class="p-1 rounded hover:bg-gray-700 transition-colors"
          :class="isCollapsed ? 'mx-auto' : ''"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path v-if="isCollapsed" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"/>
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>
          </svg>
        </button>
      </div>
      <nav class="flex-1 p-4">
        <ul class="space-y-1">
          <li :class="isCollapsed ? 'flex justify-center' : ''">
            <router-link 
              to="/"
              :class="[
                'flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-700 transition-colors',
                isCollapsed ? 'justify-center' : '',
                { 'bg-gray-700': $route.path === '/' }
              ]"
              :title="isCollapsed ? 'Посты' : ''"
            >
              <svg :class="isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'" width="100%" height="100%" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v14l-5-3-5 3V5z"/>
              </svg>
              <span v-if="!isCollapsed">Посты</span>
            </router-link>
          </li>
          <li :class="isCollapsed ? 'flex justify-center' : ''">
            <router-link 
              :to="{ name: 'channels' }"
              :class="[
                'flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-700 transition-colors',
                isCollapsed ? 'justify-center' : '',
                { 'bg-gray-700': $route.path === '/channels' }
              ]"
              :title="isCollapsed ? 'Каналы' : ''"
            >
              <svg :class="isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'" width="100%" height="100%" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <span v-if="!isCollapsed">Каналы</span>
            </router-link>
          </li>
          <li :class="isCollapsed ? 'flex justify-center' : ''">
            <router-link 
              :to="{ name: 'create-post' }"
              :class="[
                'flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-700 transition-colors',
                isCollapsed ? 'justify-center' : '',
                { 'bg-gray-700': $route.path === '/create-post' }
              ]"
              :title="isCollapsed ? 'Создать пост' : ''"
            >
              <svg :class="isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'" width="100%" height="100%" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              <span v-if="!isCollapsed">Создать пост</span>
            </router-link>
          </li>
          <li :class="isCollapsed ? 'flex justify-center' : ''">
            <router-link 
              :to="{ name: 'categories' }"
              :class="[
                'flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-700 transition-colors',
                isCollapsed ? 'justify-center' : '',
                { 'bg-gray-700': $route.path === '/categories' }
              ]"
              :title="isCollapsed ? 'Категории' : ''"
            >
              <svg :class="isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'" width="100%" height="100%" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V3a1 1 0 011 1v10.586l2.707 2.707A1 1 0 0119 19H5a1 1 0 01-.707-1.707L7 14.586V4z"/>
              </svg>
              <span v-if="!isCollapsed">Категории</span>
            </router-link>
          </li>
          <li :class="isCollapsed ? 'flex justify-center' : ''">
            <router-link 
              :to="{ name: 'posted-channels' }"
              :class="[
                'flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-700 transition-colors',
                isCollapsed ? 'justify-center' : '',
                { 'bg-gray-700': $route.path === '/posted-channels' }
              ]"
              :title="isCollapsed ? 'Каналы публикации' : ''"
            >
              <svg :class="isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'" width="100%" height="100%" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
              </svg>
              <span v-if="!isCollapsed">Каналы публикации</span>
            </router-link>
          </li>
          <li :class="isCollapsed ? 'flex justify-center' : ''">
            <router-link 
              :to="{ name: 'analytics' }"
              :class="[
                'flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-700 transition-colors',
                isCollapsed ? 'justify-center' : '',
                { 'bg-gray-700': $route.path === '/analytics' }
              ]"
              :title="isCollapsed ? 'Аналитика' : ''"
            >
              <svg :class="isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'" width="100%" height="100%" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
              <span v-if="!isCollapsed">Аналитика</span>
            </router-link>
          </li>
          <li :class="isCollapsed ? 'flex justify-center' : ''">
            <router-link 
              :to="{ name: 'scheduled-posts' }"
              :class="[
                'flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-700 transition-colors',
                isCollapsed ? 'justify-center' : '',
                { 'bg-gray-700': $route.path === '/scheduled-posts' }
              ]"
              :title="isCollapsed ? 'Отложенные публикации' : ''"
            >
              <svg :class="isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'" width="100%" height="100%" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span v-if="!isCollapsed">Отложенные публикации</span>
            </router-link>
          </li>
        </ul>
      </nav>
      <div class="p-4 border-t border-gray-700">
        <div v-if="!isCollapsed" class="text-xs text-gray-400">
          Logged in as: <span class="text-white font-medium">{{ username }}</span>
        </div>
        <div v-else class="text-center">
          <div class="w-8 h-8 bg-gray-600 rounded-full mx-auto mb-2 flex items-center justify-center">
            <span class="text-white text-xs font-bold">{{ username.charAt(0).toUpperCase() }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="flex-1 flex flex-col overflow-hidden">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const username = ref('');
const route = useRoute();
const isCollapsed = ref(false);

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
  localStorage.setItem('sidebarCollapsed', isCollapsed.value.toString());
};

const loadUserData = () => {
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      username.value = user.username || user.name || user.email || user.displayName || 'Пользователь';
    } else {
      username.value = 'Пользователь';
    }
  } catch (error) {
    console.error('Error loading user data:', error);
    username.value = 'Пользователь';
  }
};

onMounted(() => {
  const savedState = localStorage.getItem('sidebarCollapsed');
  if (savedState !== null) {
    isCollapsed.value = savedState === 'true';
  } else if (window.innerWidth <= 640) {
    isCollapsed.value = true;
  }
  loadUserData();
  window.addEventListener('storage', (e) => {
    if (e.key === 'user') {
      loadUserData();
    }
  });
});
</script> 