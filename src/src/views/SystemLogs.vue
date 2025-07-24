<template>
    <div class="flex-1 p-6 bg-gray-50 overflow-auto">
        <div class="max-w-7xl mx-auto">
            <div class="flex items-center justify-between mb-6">
                <h1 class="text-2xl font-bold text-gray-900">Системные логи</h1>
                <div class="flex items-center space-x-4">
                    <select
                        v-model="selectedUserId"
                        @change="loadLogs"
                        class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Все пользователи</option>
                        <option v-for="user in users" :key="user.id" :value="user.id">
                            {{ user.username }}
                        </option>
                    </select>
                    <button
                        @click="loadLogs"
                        class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                        </svg>
                        Обновить
                    </button>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Время
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Пользователь
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Действие
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Детали
                                </th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            <tr v-for="log in sortedLogs" :key="log._id">
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {{ formatDate(log.timestamp) }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm font-medium text-gray-900">{{ log.username }}</div>
                                    <div class="text-sm text-gray-500">{{ log.userId }}</div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span :class="getActionBadgeClass(log.method)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                                        {{ log.method }}
                                    </span>
                                    <div class="text-sm text-gray-500 mt-1">{{ log.url }}</div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button
                                        @click="showLogDetails(log)"
                                        class="text-indigo-600 hover:text-indigo-900"
                                    >
                                        Показать детали
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Pagination -->
                <div class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div class="flex-1 flex justify-between sm:hidden">
                        <button
                            @click="prevPage"
                            :disabled="currentPage <= 1"
                            class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            Предыдущая
                        </button>
                        <button
                            @click="nextPage"
                            :disabled="currentPage >= totalPages"
                            class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            Следующая
                        </button>
                    </div>
                    <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p class="text-sm text-gray-700">
                                Показано <span class="font-medium">{{ (currentPage - 1) * pageSize + 1 }}</span>
                                до <span class="font-medium">{{ Math.min(currentPage * pageSize, totalLogs) }}</span>
                                из <span class="font-medium">{{ totalLogs }}</span> записей
                            </p>
                        </div>
                        <div>
                            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                <button
                                    @click="prevPage"
                                    :disabled="currentPage <= 1"
                                    class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Предыдущая
                                </button>
                                <span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                    {{ currentPage }} из {{ totalPages }}
                                </span>
                                <button
                                    @click="nextPage"
                                    :disabled="currentPage >= totalPages"
                                    class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Следующая
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Log Details Modal -->
    <div v-if="showDetailsModal" class="fixed inset-0 bg-white/30 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-3/4 max-w-4xl shadow-lg rounded-md bg-white">
            <div class="mt-3">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-medium text-gray-900">Детали лога</h3>
                    <button
                        @click="showDetailsModal = false"
                        class="text-gray-400 hover:text-gray-600"
                    >
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Действие</label>
                        <p class="mt-1 text-sm text-gray-900">{{ selectedLog?.action }}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">URL</label>
                        <p class="mt-1 text-sm text-gray-900">{{ selectedLog?.url }}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">User Agent</label>
                        <p class="mt-1 text-sm text-gray-900">{{ selectedLog?.userAgent || 'N/A' }}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Тело запроса</label>
                        <pre class="mt-1 text-sm text-gray-900 bg-gray-100 p-4 rounded-md overflow-auto max-h-64">{{ JSON.stringify(selectedLog?.body, null, 2) }}</pre>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import Sidebar from '@/components/Sidebar.vue';
import http from '@/js/http';

const route = useRoute();
const logs = ref([]);
const users = ref([]);
const selectedUserId = ref('');
const currentPage = ref(1);
const pageSize = ref(50);
const totalLogs = ref(0);
const totalPages = ref(0);
const showDetailsModal = ref(false);
const selectedLog = ref(null);

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};

const getActionBadgeClass = (method) => {
    switch (method) {
        case 'GET':
            return 'bg-green-100 text-green-800';
        case 'POST':
            return 'bg-blue-100 text-blue-800';
        case 'PUT':
            return 'bg-yellow-100 text-yellow-800';
        case 'DELETE':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

const loadUsers = () => {
    http.getAllUsers((response) => {
        if (response.success) {
            users.value = response.data;
        }
    });
};

const loadLogs = () => {
    const loadFunction = selectedUserId.value 
        ? (page, limit, callback) => http.getUserLogs(selectedUserId.value, page, limit, callback)
        : (page, limit, callback) => http.getLogs(page, limit, callback);
    
    loadFunction(currentPage.value, pageSize.value, (response) => {
        if (response.success) {
            logs.value = response.data;
            if (response.pagination) {
                totalLogs.value = response.pagination.total;
                totalPages.value = response.pagination.pages;
            }
        } else {
            window.$toast?.error('Ошибка загрузки логов: ' + response.message);
        }
    });
};

const prevPage = () => {
    if (currentPage.value > 1) {
        currentPage.value--;
        loadLogs();
    }
};

const nextPage = () => {
    if (currentPage.value < totalPages.value) {
        currentPage.value++;
        loadLogs();
    }
};

const showLogDetails = (log) => {
    selectedLog.value = log;
    showDetailsModal.value = true;
};

const sortedLogs = computed(() => {
    if (selectedUserId.value) return logs.value;
    // Сортируем по username по алфавиту, если выбраны все пользователи
    return [...logs.value].sort((a, b) => {
        if (a.username && b.username) {
            return a.username.localeCompare(b.username);
        }
        return 0;
    });
});

onMounted(() => {
    // Check if specific user ID is provided in query
    if (route.query.userId) {
        selectedUserId.value = route.query.userId;
    }
    
    loadUsers();
    loadLogs();
});
</script> 