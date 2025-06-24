<template>
    <div class="mb-6 bg-white p-4 rounded-lg shadow" v-if="!loading || posts.length > 0">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4">
          <div class="flex-1">
            <label for="search" class="sr-only">Поиск</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
              <input v-model="searchQuery" 
                     @input="updateSearch"
                     type="text" 
                     name="search" 
                     id="search" 
                     class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" 
                     placeholder="Поиск постов...">
            </div>
          </div>
          <div class="flex space-x-3">
            <select v-model="statusFilter" 
                    @change="updateStatusFilter"
                    class="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md">
              <option value="">Все статусы</option>
              <option value="unique">Уникальные</option>
              <option value="duplicate">Оригинальные</option>
            </select>
          </div>
        </div>
      </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  posts: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:searchQuery', 'update:statusFilter']);

const searchQuery = ref('');
const statusFilter = ref('');

const updateSearch = () => {
  emit('update:searchQuery', searchQuery.value);
};

const updateStatusFilter = () => {
  emit('update:statusFilter', statusFilter.value);
};

watch(() => props.posts, () => {
}, { immediate: true });
</script>