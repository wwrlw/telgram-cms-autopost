<template>
  <div class="flex h-screen bg-gray-100">
    <div class="w-56 bg-gray-800 text-white flex flex-col">
      <div class="p-4 border-b border-gray-700">
        <h1 class="text-xl font-semibold">LOGO</h1>
      </div>
      
      <nav class="flex-1 p-4">
        <div class="mb-6">
          <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">CORE</h3>
          <ul class="space-y-1">
            <li>
              <router-link 
                to="/" 
                class="flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-700 transition-colors"
                :class="{ 'bg-gray-700': $route.path === '/' }">
                <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v14l-5-3-5 3V5z"/>
                </svg>
                Посты
              </router-link>
            </li>
          </ul>
        </div>

        <div class="mb-6">
          <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">INTERFACE</h3>
          <ul class="space-y-1">
            <!-- <li>
              <button class="flex items-center w-full px-3 py-2 text-sm rounded-md hover:bg-gray-700 transition-colors text-left">
                <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
                </svg>
                Layouts
              </button>
            </li> -->
            <li>
              <router-link 
                :to="{ name: 'channels' }" 
                class="flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-700 transition-colors"
                :class="{ 'bg-gray-700': $route.path === '/channels' }">
                <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                Каналы
              </router-link>
            </li>
            <li>
              <router-link 
                :to="{ name: 'posted-channels' }" 
                class="flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-700 transition-colors"
                :class="{ 'bg-gray-700': $route.path === '/posted-channels' }">
                <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
                </svg>
                Каналы публикации
              </router-link>
            </li>
          </ul>
        </div>

        <div class="mb-6">
          <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">ADDONS</h3>
          <ul class="space-y-1">
            <li>
              <button class="flex items-center w-full px-3 py-2 text-sm rounded-md hover:bg-gray-700 transition-colors text-left">
                <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                Charts
              </button>
            </li>
            <li>
              <button class="flex items-center w-full px-3 py-2 text-sm rounded-md hover:bg-gray-700 transition-colors text-left">
                <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0V8a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                </svg>
                Tables
              </button>
            </li>
          </ul>
        </div>
      </nav>

      <div class="p-4 border-t border-gray-700">
        <div class="text-xs text-gray-400">
          Logged in as:<br>
          <span class="text-white font-medium"></span>
        </div>
      </div>
    </div>

    <div class="flex-1 flex flex-col overflow-hidden">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router';
const route = useRoute();
</script> 