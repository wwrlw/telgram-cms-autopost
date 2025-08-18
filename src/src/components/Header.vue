<template>
    <header class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <div class="flex items-center"></div>
                <div class="flex items-center space-x-4">
                    <button
                        @click="logout"
                        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                    >
                        <svg
                            class="mr-2 h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1m0-10V5"
                            />
                        </svg>
                        Выйти
                    </button>

                    <button
                        v-if="
                            route.name !== 'post' &&
                            route.name !== 'create-post' &&
                            route.name !== 'edit-scheduled-post'
                        "
                        @click="refreshData"
                        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                    >
                        <svg
                            class="mr-2 h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                        </svg>
                        {{ loading ? "Загрузка..." : "Обновить" }}
                    </button>
                </div>
            </div>
        </div>
    </header>
</template>

<script setup>
import { useRoute, useRouter } from "vue-router";
const route = useRoute();
const router = useRouter();
const emit = defineEmits(["refreshPosts", "showPublishModal", "refreshData"]);
const props = defineProps({
    loading: {
        type: Boolean,
        default: false,
    },
});

const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
};

const refreshData = () => {
    // Определяем тип данных для обновления в зависимости от текущей страницы
    if (route.name === 'posts') {
        emit("refreshPosts");
    } else if (route.name === 'favorites') {
        emit("refreshData", 'favorites');
    } else if (route.name === 'system-logs') {
        emit("refreshData", 'logs');
    } else if (route.name === 'categories') {
        emit("refreshData", 'categories');
    } else if (route.name === 'channels') {
        emit("refreshData", 'channels');
    } else if (route.name === 'publication-channels') {
        emit("refreshData", 'publication-channels');
    } else if (route.name === 'scheduled-posts') {
        emit("refreshData", 'scheduled-posts');
    } else if (route.name === 'analytics') {
        emit("refreshData", 'analytics');
    } else if (route.name === 'user-management') {
        emit("refreshData", 'users');
    } else if (route.name === 'settings') {
        emit("refreshData", 'settings');
    } else {
        // По умолчанию обновляем посты
        emit("refreshPosts");
    }
};
</script>
