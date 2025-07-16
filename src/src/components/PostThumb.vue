<template>
  <div
    class="group bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
    <div class="relative aspect-video bg-gray-100 cursor-pointer" @click="navigateToPost">
      <img v-if="hasPhoto(post)" v-lazy="getMediaPath(getFirstPhoto(post).file_path)" :alt="extractTitle(post.text)"
        class="w-full h-full object-cover cursor-pointer" @click="navigateToPost" />

      <div v-else-if="hasVideo(post)" class="w-full h-full bg-gray-200 flex items-center justify-center relative">
        <video v-if="getFirstVideo(post)" :src="getMediaPath(getFirstVideo(post).file_path)"
          class="w-full h-full object-cover" muted preload="metadata" poster="" />
        <div v-else class="w-full h-full bg-gray-200 flex items-center justify-center">
          <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <div
          class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-40 transition-all duration-200">
          <div class="w-16 h-16 bg-black bg-opacity-70 rounded-full flex items-center justify-center shadow-lg">
            <svg class="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>

      <div v-else class="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>

      <div class="absolute top-3 left-3 flex flex-col gap-2">
        <span v-if="post.is_published"
          class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          ✅ Опубликован
        </span>
        <span v-else-if="post.scheduled_at"
          class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          📅 Запланирован
        </span>
        <span v-if="post.is_unique"
          class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Уникальный
        </span>
      </div>

      <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div class="flex flex-col gap-2">
          <button v-if="hasMedia(post)" @click.prevent.stop="$emit('quickview', post)"
            class="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
            title="Быстрый просмотр медиа">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>

          <button @click.prevent.stop="$emit('delete', post._id)"
            class="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors" title="Удалить">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div class="p-4">
      <router-link :to="{ name: 'post', params: { id: post._id } }"
        class="font-medium text-gray-900 mb-2 line-clamp-2 cursor-pointer">
        {{ extractTitle(post.text) }}
      </router-link>

      <router-link :to="{ name: 'post', params: { id: post._id } }"
        class="text-sm text-gray-600 mb-3 line-clamp-3 cursor-pointer">
        {{ post.text }}
      </router-link>

      <div class="mb-3">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
          :class="getCategoryStyle(post.category_id)">
          {{ getCategoryName(post.category_id) }}
        </span>
      </div>

      <div v-if="post.stats" class="flex items-center justify-between text-xs text-gray-500 mb-3">
        <div class="flex items-center space-x-3">
          <span v-if="post.stats.views !== undefined" class="flex items-center space-x-1">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>{{ formatNumber(post.stats.views) }}</span>
          </span>
          <span v-if="post.stats.reactions !== undefined" class="flex items-center space-x-1">
            <span>😍</span>
            <span>{{ formatNumber(post.stats.reactions) }}</span>
          </span>
          <span v-if="post.stats.comments !== undefined" class="flex items-center space-x-1">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>{{ formatNumber(post.stats.comments) }}</span>
          </span>
        </div>
        <div class="flex items-center justify-between text-xs text-gray-500">
          <div :datetime="post.timestamp">
            {{ formatDate(post.timestamp) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { getMediaUrl, formatNumber, extractTitle, formatDate } from '@/js/utils'
import { useRouter } from 'vue-router'
import { ref, inject } from 'vue'
import http from '@/js/http'

const router = useRouter()
const toast = inject('toast')

const props = defineProps({
  post: {
    type: Object,
    required: true
  },
  categories: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['publish', 'delete', 'quickview'])

const getMediaPath = (filePath) => {
  return getMediaUrl(filePath)
}

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
    const color = category.color.replace('#', '')
    const r = parseInt(color.substr(0, 2), 16)
    const g = parseInt(color.substr(2, 2), 16)
    const b = parseInt(color.substr(4, 2), 16)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    const textColor = brightness > 155 ? 'text-gray-900' : 'text-white'
    return `bg-[${category.color}] ${textColor}`
  }
  return 'bg-gray-100 text-gray-800'
}

const navigateToPost = () => {
  router.push(`/posts/${props.post._id}`)
}

const hasPhoto = (post) => {
  return post.media && post.media.some(media => media.type === 'photo' || media.type === 'MessageMediaPhoto')
}

const hasVideo = (post) => {
  return post.media && post.media.some(media => media.type === 'video' || media.type === 'MessageMediaDocument' || media.type === 'document')
}

const hasMedia = (post) => {
  return post.media && post.media.length > 0
}

const getFirstPhoto = (post) => {
  return post.media.find(media => media.type === 'photo' || media.type === 'MessageMediaPhoto')
}

const getFirstVideo = (post) => {
  return post.media.find(media => media.type === 'video' || media.type === 'MessageMediaDocument' || media.type === 'document')
}

const getFileSize = (size) => {
  if (size < 1024) return size + ' B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB'
  return (size / (1024 * 1024)).toFixed(1) + ' MB'
}
</script>

<style scoped>
.group:hover .group-hover\:opacity-100 {
  opacity: 1;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>