<template>
    <div class="flex-1 p-6 bg-gray-50 overflow-auto">
        <div class="max-w-6xl mx-auto">
            <div class="flex items-center justify-between mb-6">
                <h1 class="text-2xl font-bold text-gray-900">Управление пользователями</h1>
                <button
                    @click="showCreateModal = true"
                    class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                    </svg>
                    Создать пользователя
                </button>
            </div>

            <div class="bg-white rounded-lg shadow overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Пользователь
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Роль
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Действия
                                </th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            <tr v-for="user in users" :key="user.id">
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center">
                                        <div class="flex-shrink-0 h-10 w-10">
                                            <div class="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                                <span class="text-sm font-medium text-gray-700">
                                                    {{ user.username.charAt(0).toUpperCase() }}
                                                </span>
                                            </div>
                                        </div>
                                        <div class="ml-4">
                                            <div class="text-sm font-medium text-gray-900">{{ user.username }}</div>
                                            <div class="text-sm text-gray-500">ID: {{ user.id }}</div>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span :class="getRoleBadgeClass(user.role)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                                        {{ getRoleDisplay(user.role) }}
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                    <button
                                        @click="openRoleModal(user)"
                                        class="text-indigo-600 hover:text-indigo-900"
                                    >
                                        Изменить роль
                                    </button>
                                    <button
                                        @click="viewUserLogs(user)"
                                        class="text-green-600 hover:text-green-900"
                                    >
                                        Логи
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- Create User Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-white/30 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div class="mt-3">
                <h3 class="text-lg font-medium text-gray-900 mb-4">Создать пользователя</h3>
                <form @submit.prevent="createUser">
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Имя пользователя</label>
                        <input
                            v-model="newUser.username"
                            type="text"
                            required
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Пароль</label>
                        <input
                            v-model="newUser.password"
                            type="text"
                            required
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Роль</label>
                        <select
                            v-model="newUser.role"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="editor">Редактор</option>
                            <option value="admin">Администратор</option>
                        </select>
                    </div>
                    <div class="flex justify-end space-x-3">
                        <button
                            type="button"
                            @click="showCreateModal = false"
                            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            :disabled="creating"
                            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {{ creating ? 'Создание...' : 'Создать' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Role Change Modal -->
    <div v-if="showRoleModal" class="fixed inset-0 bg-white/30 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div class="mt-3">
                <h3 class="text-lg font-medium text-gray-900 mb-4">Изменить роль пользователя</h3>
                <p class="text-sm text-gray-600 mb-4">{{ selectedUser?.username }}</p>
                <form @submit.prevent="updateUserRole">
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Роль</label>
                        <select
                            v-model="selectedRole"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="editor">Редактор</option>
                            <option value="admin">Администратор</option>
                        </select>
                    </div>
                    <div class="flex justify-end space-x-3">
                        <button
                            type="button"
                            @click="showRoleModal = false"
                            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            :disabled="updating"
                            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {{ updating ? 'Обновление...' : 'Обновить' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Sidebar from '@/components/Sidebar.vue';
import http from '@/js/http';

const router = useRouter();
const users = ref([]);
const showCreateModal = ref(false);
const showRoleModal = ref(false);
const selectedUser = ref(null);
const selectedRole = ref('');
const creating = ref(false);
const updating = ref(false);

const newUser = ref({
    username: '',
    password: '',
    role: 'editor'
});

const getRoleDisplay = (role) => {
    switch (role) {
        case 'super_admin':
            return 'Супер Администратор';
        case 'admin':
            return 'Администратор';
        case 'editor':
            return 'Редактор';
        default:
            return 'Неизвестно';
    }
};

const getRoleBadgeClass = (role) => {
    switch (role) {
        case 'super_admin':
            return 'bg-red-100 text-red-800';
        case 'admin':
            return 'bg-blue-100 text-blue-800';
        case 'editor':
            return 'bg-green-100 text-green-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

const loadUsers = () => {
    http.getAllUsers((response) => {
        if (response.success) {
            users.value = response.data;
        } else {
            window.$toast?.error('Ошибка загрузки пользователей: ' + response.message);
        }
    });
};

const createUser = () => {
    creating.value = true;
    http.register(newUser.value, (response) => {
        creating.value = false;
        if (response.success) {
            window.$toast?.success('Пользователь создан успешно');
            showCreateModal.value = false;
            newUser.value = { username: '', password: '', role: 'editor' };
            loadUsers();
        } else {
            window.$toast?.error('Ошибка создания пользователя: ' + response.message);
        }
    });
};

const openRoleModal = (user) => {
    selectedUser.value = user;
    selectedRole.value = user.role;
    showRoleModal.value = true;
};

const updateUserRole = () => {
    updating.value = true;
    http.updateUserRole(selectedUser.value.id, selectedRole.value, (response) => {
        updating.value = false;
        if (response.success) {
            window.$toast?.success('Роль пользователя обновлена');
            showRoleModal.value = false;
            loadUsers();
        } else {
            window.$toast?.error('Ошибка обновления роли: ' + response.message);
        }
    });
};

const viewUserLogs = (user) => {
    router.push(`/logs?userId=${user._id}`);
};

onMounted(() => {
    loadUsers();
});
</script> 