<template>
    <div v-if="totalPages > 1"
        class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div class="flex-1 flex justify-between sm:hidden">
            <button @click="prevPage" :disabled="currentPage === 1"
                class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                Назад
            </button>
            <button @click="nextPage" :disabled="currentPage === totalPages"
                class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                Вперед
            </button>
        </div>
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
                <p class="text-sm text-gray-700">
                    Показано с
                    <span class="font-medium">{{ startItem }}</span>
                    по
                    <span class="font-medium">{{ endItem }}</span>
                </p>
            </div>
            <div>
                <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button @click="prevPage" :disabled="currentPage === 1"
                        class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                        <span class="sr-only">Назад</span>
                        <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd"
                                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                                clip-rule="evenodd" />
                        </svg>
                    </button>

                    <button v-for="page in visiblePages" :key="page" @click="goToPage(page)" :disabled="page === '...'"
                        :class="[
                            'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                            page === currentPage
                                ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                : page === '...'
                                    ? 'bg-white border-gray-300 text-gray-300 cursor-default'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        ]">
                        {{ page }}
                    </button>

                    <button @click="nextPage" :disabled="currentPage === totalPages"
                        class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                        <span class="sr-only">Вперед</span>
                        <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd"
                                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                clip-rule="evenodd" />
                        </svg>
                    </button>
                </nav>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
const emit = defineEmits(['page-change', 'items-per-page-change']);

const props = defineProps({
  pagination: {
    type: Object,
    default: () => ({
      page: 1,
      limit: 12,
      total: 0,
      totalPages: 0
    })
  }
})

const currentPage = computed(() => props.pagination.page);
const totalPages = computed(() => props.pagination.totalPages);
const itemsPerPage = computed({
    get: () => props.pagination.limit,
    set: (value) => emit('items-per-page-change', parseInt(value))
})
const startItem = computed(() => {
    return (currentPage.value - 1) * itemsPerPage.value + 1
})

const endItem = computed(() => {
    return Math.min(currentPage.value * itemsPerPage.value, props.pagination.total)
})

const visiblePages = computed(() => {
    const pages = []
    const total = totalPages.value
    const current = currentPage.value

    if (total <= 7) {
        for (let i = 1; i <= total; i++) {
            pages.push(i)
        }
    } else {
        if (current <= 4) {
            for (let i = 1; i <= 5; i++) {
                pages.push(i)
            }
            pages.push('...', total)
        } else if (current >= total - 3) {
            pages.push(1, '...')
            for (let i = total - 4; i <= total; i++) {
                pages.push(i)
            }
        } else {
            pages.push(1, '...')
            for (let i = current - 1; i <= current + 1; i++) {
                pages.push(i)
            }
            pages.push('...', total)
        }
    }

    return pages
})

const prevPage = () => {
    if (currentPage.value > 1) {
        emit('page-change', currentPage.value - 1)
    }
}

const nextPage = () => {
    if (currentPage.value < totalPages.value) {
        emit('page-change', currentPage.value + 1)
    }
}

const goToPage = (page) => {
    if (page !== '...' && page >= 1 && page <= totalPages.value) {
        emit('page-change', page)
    }
}

</script>

<style></style>