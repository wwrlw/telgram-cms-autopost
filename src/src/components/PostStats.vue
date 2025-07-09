<template>
  <div class="bg-white rounded-lg border border-gray-200 p-6">
    <h3 class="text-lg font-medium text-gray-900 mb-4">📊 Статистика поста</h3>
    
    <div v-if="stats" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div v-if="stats.views || stats.views === 0" class="bg-blue-50 rounded-lg p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <span class="text-2xl">👁️</span>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-blue-600">Просмотры</p>
            <p class="text-2xl font-semibold text-blue-900">{{ formatNumber(stats.views) }}</p>
          </div>
        </div>
      </div>

      <div v-if="stats.reactions || stats.reactions === 0" class="bg-pink-50 rounded-lg p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <span class="text-2xl">😍</span>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-pink-600">Реакции</p>
            <p class="text-2xl font-semibold text-pink-900">{{ formatNumber(stats.reactions) }}</p>
          </div>
        </div>
      </div>

      <div v-if="stats.comments || stats.comments === 0" class="bg-green-50 rounded-lg p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <span class="text-2xl">💬</span>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-green-600">Комментарии</p>
            <p class="text-2xl font-semibold text-green-900">{{ formatNumber(stats.comments) }}</p>
          </div>
        </div>
      </div>

      <div v-if="stats.forwards || stats.forwards === 0" class="bg-purple-50 rounded-lg p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <span class="text-2xl">🔄</span>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-purple-600">Пересылки</p>
            <p class="text-2xl font-semibold text-purple-900">{{ formatNumber(stats.forwards) }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="stats && stats.reactions_detail && Object.keys(stats.reactions_detail).length > 0" class="mt-6">
      <h4 class="text-md font-medium text-gray-900 mb-3">Детализация реакций</h4>
      <div class="flex flex-wrap gap-2">
        <div 
          v-for="(count, emoji) in stats.reactions_detail" 
          :key="emoji"
          class="bg-gray-100 rounded-full px-3 py-1 text-sm font-medium text-gray-700 flex items-center space-x-1"
        >
          <span>{{ emoji }}</span>
          <span>{{ formatNumber(count) }}</span>
        </div>
      </div>
    </div>

    <div v-if="!stats" class="text-center py-8">
      <div class="text-gray-400 text-lg mb-2">📊</div>
      <p class="text-gray-500">Статистика не собрана</p>
      <p class="text-xs text-gray-400 mt-1">Статистика собирается автоматически при парсинге постов</p>
    </div>

    <div v-if="updatedAt" class="mt-6 pt-4 border-t border-gray-200">
      <p class="text-xs text-gray-500">
        Последнее обновление: {{ formatDate(updatedAt) }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  stats: {
    type: Object,
    default: null
  },
  updatedAt: {
    type: [String, Date],
    default: null
  }
})

const formatNumber = (num) => {
  if (num === undefined || num === null) return '0'
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toLocaleString('ru-RU')
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
</style> 