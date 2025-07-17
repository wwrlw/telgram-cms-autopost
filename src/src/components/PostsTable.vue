<template>
    <div class="bg-white shadow overflow-hidden sm:rounded-md">
        <div class="px-4 py-5 sm:p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg leading-6 font-medium text-gray-900">Посты ({{ pagination.total }})</h3>
            <div class="flex items-center space-x-2">
              <label class="text-sm text-gray-500">Показать:</label>
              <select v-model="itemsPerPage" 
                      class="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500">
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
              <router-link :to="{ name: 'create-post' }" 
                class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
              >Создать пост</router-link>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input type="checkbox" 
                           v-model="selectAll" 
                           @change="toggleSelectAll"
                           class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500">
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Контент
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Категория
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статистика
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дата
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="post in paginatedPosts" 
                    :key="post._id"
                    :class="{ 'bg-blue-50': selectedPosts.includes(post._id) }"
                    class="hover:bg-gray-50 transition-colors duration-150">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <input type="checkbox" 
                           :value="post._id"
                           v-model="selectedPosts"
                           class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500">
                  </td>
                  
                  <td class="px-6 py-4">
                    <div class="flex items-start space-x-3">
                      <div class="flex-shrink-0">
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900 truncate">
                          {{ extractTitle(post.text) }}
                        </p>
                        <p class="text-sm text-gray-500 line-clamp-6">
                          {{ post.text }}
                        </p>
                        <div v-if="post.is_published || post.scheduled_at" class="mt-1 text-xs text-gray-400">
                          <span v-if="post.is_published && post.published_at" class="text-green-600">
                            ✅ Опубликован: {{ formatDate(post.published_at) }}
                          </span>
                          <span v-else-if="post.scheduled_at && !post.is_published" class="text-orange-600">
                            Запланирован на: {{ formatDate(post.scheduled_at) }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex items-center space-x-2 gap-2">
                      <button 
                        @click="toggleFavorite(post._id)"
                        :class="[
                          'text-sm transition-colors flex items-center space-x-1',
                          isFavorite(post._id) 
                            ? 'text-red-500 hover:text-red-700' 
                            : 'text-gray-400 hover:text-red-500'
                        ]"
                        :title="isFavorite(post._id) ? 'Удалить из избранного' : 'Добавить в избранное'"
                      >
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path v-if="isFavorite(post._id)" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                          <path v-else d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="none" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        <span class="text-xs">{{ isFavorite(post._id) ? 'Убрать' : 'В избранное' }}</span>
                      </button>

                      <router-link :to="{ name: 'post', params: { id: post._id } }"
                                   class="text-indigo-600 hover:text-indigo-900 text-sm">
                        Просмотр
                      </router-link>
                      <button v-if="!post.is_published"
                              @click="$emit('publish', post)" 
                              class="text-green-600 hover:text-green-900 text-sm">
                        Опубликовать
                      </button>
                      <span v-else class="text-green-500 text-sm font-medium">
                        Опубликован
                      </span>
                      <button @click="$emit('delete', post._id)" 
                              class="text-red-600 hover:text-red-900 text-sm">
                        Удалить
                      </button>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" 
                          :class="getCategoryStyle(post.category_id)">
                      {{ getCategoryName(post.category_id) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div v-if="post.stats" class="flex flex-col space-y-1 text-xs text-gray-600">
                      <div v-if="post.stats.views !== undefined" class="flex items-center space-x-1">
                        <span>👁️</span>
                        <span>{{ formatNumber(post.stats.views) }}</span>
                      </div>
                      <div v-if="post.stats.reactions !== undefined" class="flex items-center space-x-1">
                        <span>😍</span>
                        <span>{{ formatNumber(post.stats.reactions) }}</span>
                      </div>
                      <div v-if="post.stats.comments !== undefined" class="flex items-center space-x-1">
                        <span>💬</span>
                        <span>{{ formatNumber(post.stats.comments) }}</span>
                      </div>
                      <div v-if="post.stats.forwards !== undefined" class="flex items-center space-x-1">
                        <span>🔄</span>
                        <span>{{ formatNumber(post.stats.forwards) }}</span>
                      </div>
                    </div>
                    <div v-else class="text-xs text-gray-400">
                      Нет данных
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <time :datetime="post.timestamp">{{ formatDate(post.timestamp) }}</time>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex flex-col space-y-1">
                      <span v-if="post.is_published" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <svg class="mr-1.5 h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
                          <circle cx="4" cy="4" r="3" />
                        </svg>
                        ✅ Опубликован
                      </span>
                      
                      <span v-else-if="post.scheduled_at && !post.is_published" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        <svg class="mr-1.5 h-2 w-2 text-orange-400" fill="currentColor" viewBox="0 0 8 8">
                          <circle cx="4" cy="4" r="3" />
                        </svg>
                        📅 Запланирован
                      </span>
                      
                      <span :class="[
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        post.is_unique 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      ]">
                        <svg :class="[
                          'mr-1.5 h-2 w-2',
                          post.is_unique ? 'text-blue-400' : 'text-gray-400'
                        ]" fill="currentColor" viewBox="0 0 8 8">
                          <circle cx="4" cy="4" r="3" />
                        </svg>
                        {{ post.is_unique ? 'Уникальный' : 'Оригинальный' }}
                      </span>
                    </div>
                  </td>
            
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="posts.length === 0 && !loading" class="text-center py-12">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">Нет постов</h3>
            <p class="mt-1 text-sm text-gray-500">Попробуйте изменить фильтры или добавить новые посты.</p>
          </div>

          <Pagination :pagination="paginatedPosts"></Pagination>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { formatDate, extractTitle, formatNumber } from '@/js/utils'
import Pagination from './Shared/Pagination.vue'
import { useFavorites } from '@/composables/useFavorites'

const selectAll = ref(false)
const { favoritePosts, isLoading: isLoadingFavorites, isFavorite, toggleFavorite, initializeFavorites } = useFavorites()

const props = defineProps({
  posts: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  selectedPosts: {
    type: Array,
    default: () => []
  },
  categories: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:selectedPosts', 'publish', 'delete', 'create'])


const selectedPosts = computed({
  get: () => props.selectedPosts,
  set: (value) => emit('update:selectedPosts', value)
})

const paginatedPosts = computed(() => props.posts)

const getCategoryName = (categoryId) => {
  if (!categoryId) return 'Без категории'
  const category = props.categories.find(cat => cat.id === categoryId)
  return category ? category.name : 'Неизвестная категория'
}

const getCategoryStyle = (categoryId) => {
  if (!categoryId) {
    return 'bg-gray-100 text-gray-800'
  }
  const category = props.categories.find(cat => cat.id === categoryId)
  if (category && category.color) {
    // Простая логика для определения контрастного цвета текста
    const color = category.color.replace('#', '')
    const r = parseInt(color.substr(0, 2), 16)
    const g = parseInt(color.substr(2, 2), 16)
    const b = parseInt(color.substr(4, 2), 16)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    const textColor = brightness > 155 ? 'text-gray-900' : 'text-white'
    return `bg-[${category.color}] ${textColor}`
  }
  return 'bg-blue-100 text-blue-800'
}

const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedPosts.value = paginatedPosts.value.map(post => post._id)
  } else {
    selectedPosts.value = []
  }
}

watch(selectedPosts, () => {
  selectAll.value = selectedPosts.value.length === paginatedPosts.value.length && paginatedPosts.value.length > 0
})

onMounted(() => {
  initializeFavorites()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-6 {
  display: -webkit-box;
  -webkit-line-clamp: 6;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>