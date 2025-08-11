<template>
    <div class="flex h-screen bg-gray-100">
        <div
            class="bg-gray-800 text-white flex flex-col transition-all duration-300"
            :class="isCollapsed ? 'w-16' : 'w-56'"
        >
            <div
                class="p-4 border-b border-gray-700 flex items-center justify-between"
            >
                <router-link
                    v-if="!isCollapsed"
                    to="/"
                    class="text-xl font-semibold hover:text-indigo-600 transition-colors cursor-pointer"
                >
                    TG ADMIN
                </router-link>
                <button
                    @click="toggleCollapse"
                    class="p-1 rounded hover:bg-gray-700 transition-colors"
                    :class="isCollapsed ? 'mx-auto' : ''"
                >
                    <svg
                        class="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            v-if="isCollapsed"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M13 5l7 7-7 7M5 5l7 7-7 7"
                        />
                        <path
                            v-else
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                        />
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
                                { 'bg-gray-700': $route.path === '/' },
                            ]"
                            :title="isCollapsed ? 'Посты' : ''"
                        >
                            <svg
                                :class="
                                    isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'
                                "
                                width="100%"
                                height="100%"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                                />
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M8 5a2 2 0 012-2h4a2 2 0 012 2v14l-5-3-5 3V5z"
                                />
                            </svg>
                            <span v-if="!isCollapsed">Посты</span>
                        </router-link>
                    </li>
                    <li :class="isCollapsed ? 'flex justify-center' : ''">
                        <router-link
                            :to="{ name: 'create-post' }"
                            :class="[
                                'flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-700 transition-colors',
                                isCollapsed ? 'justify-center' : '',
                                {
                                    'bg-gray-700':
                                        $route.path === '/create-post',
                                },
                            ]"
                            :title="isCollapsed ? 'Создать пост' : ''"
                        >
                            <svg
                                :class="
                                    isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'
                                "
                                width="100%"
                                height="100%"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M12 4v16m8-8H4"
                                />
                            </svg>
                            <span v-if="!isCollapsed">Создать пост</span>
                        </router-link>
                    </li>
                    <li :class="isCollapsed ? 'flex justify-center' : ''">
                        <router-link
                            :to="{ name: 'favorites' }"
                            :class="[
                                'flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-700 transition-colors',
                                isCollapsed ? 'justify-center' : '',
                                { 'bg-gray-700': $route.path === '/favorites' },
                            ]"
                            :title="isCollapsed ? 'Избранное' : ''"
                        >
                            <svg
                                :class="
                                    isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'
                                "
                                width="100%"
                                height="100%"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                                />
                            </svg>
                            <span v-if="!isCollapsed">Избранное</span>
                        </router-link>
                    </li>
                    <li :class="isCollapsed ? 'flex justify-center' : ''">
                        <router-link
                            :to="{ name: 'scheduled-posts' }"
                            :class="[
                                'flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-700 transition-colors',
                                isCollapsed ? 'justify-center' : '',
                                {
                                    'bg-gray-700':
                                        $route.path === '/scheduled-posts',
                                },
                            ]"
                            :title="isCollapsed ? 'Отложенные публикации' : ''"
                        >
                            <svg
                                :class="
                                    isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'
                                "
                                width="100%"
                                height="100%"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <span v-if="!isCollapsed"
                                >Отложенные публикации</span
                            >
                        </router-link>
                    </li>
                    <li :class="isCollapsed ? 'flex justify-center' : ''">
                        <router-link
                            :to="{ name: 'categories' }"
                            :class="[
                                'flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-700 transition-colors',
                                isCollapsed ? 'justify-center' : '',
                                {
                                    'bg-gray-700':
                                        $route.path === '/categories',
                                },
                            ]"
                            :title="isCollapsed ? 'Категории' : ''"
                        >
                            <svg
                                :class="
                                    isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'
                                "
                                width="100%"
                                height="100%"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V3a1 1 0 011 1v10.586l2.707 2.707A1 1 0 0119 19H5a1 1 0 01-.707-1.707L7 14.586V4z"
                                />
                            </svg>
                            <span v-if="!isCollapsed">Категории</span>
                        </router-link>
                    </li>
                    <li
                        v-if="!isForbiddenRole(['editor'])"
                        :class="isCollapsed ? 'flex justify-center' : ''"
                    >
                        <router-link
                            :to="{ name: 'channels' }"
                            :class="[
                                'flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-700 transition-colors',
                                isCollapsed ? 'justify-center' : '',
                                { 'bg-gray-700': $route.path === '/channels' },
                            ]"
                            :title="isCollapsed ? 'Каналы' : ''"
                        >
                            <svg
                                :class="
                                    isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'
                                "
                                width="100%"
                                height="100%"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                            <span v-if="!isCollapsed">Каналы</span>
                        </router-link>
                    </li>
                    <li
                        v-if="!isForbiddenRole(['editor'])"
                        :class="isCollapsed ? 'flex justify-center' : ''"
                    >
                        <router-link
                            :to="{ name: 'posted-channels' }"
                            :class="[
                                'flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-700 transition-colors',
                                isCollapsed ? 'justify-center' : '',
                                {
                                    'bg-gray-700':
                                        $route.path === '/posted-channels',
                                },
                            ]"
                            :title="isCollapsed ? 'Каналы публикации' : ''"
                        >
                            <svg
                                :class="
                                    isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'
                                "
                                width="100%"
                                height="100%"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                                />
                            </svg>
                            <span v-if="!isCollapsed">Каналы публикации</span>
                        </router-link>
                    </li>
                    <li
                        v-if="!isForbiddenRole(['editor'])"
                        :class="isCollapsed ? 'flex justify-center' : ''"
                    >
                        <router-link
                            :to="{ name: 'analytics' }"
                            :class="[
                                'flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-700 transition-colors',
                                isCollapsed ? 'justify-center' : '',
                                { 'bg-gray-700': $route.path === '/analytics' },
                            ]"
                            :title="isCollapsed ? 'Аналитика' : ''"
                        >
                            <svg
                                :class="
                                    isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'
                                "
                                width="100%"
                                height="100%"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                />
                            </svg>
                            <span v-if="!isCollapsed">Аналитика</span>
                        </router-link>
                    </li>

                    <!-- Super Admin Only -->
                    <li
                        v-if="userRole === 'super_admin'"
                        :class="isCollapsed ? 'flex justify-center' : ''"
                    >
                        <router-link
                            :to="{ name: 'users' }"
                            :class="[
                                'flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-700 transition-colors',
                                isCollapsed ? 'justify-center' : '',
                                { 'bg-gray-700': $route.path === '/users' },
                            ]"
                            :title="
                                isCollapsed ? 'Управление пользователями' : ''
                            "
                        >
                            <svg
                                :class="
                                    isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'
                                "
                                width="100%"
                                height="100%"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                                />
                            </svg>
                            <span v-if="!isCollapsed">Пользователи</span>
                        </router-link>
                    </li>
                    <li
                        v-if="
                            userRole === 'super_admin' || userRole === 'admin'
                        "
                        :class="isCollapsed ? 'flex justify-center' : ''"
                    >
                        <router-link
                            :to="{ name: 'logs' }"
                            :class="[
                                'flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-700 transition-colors',
                                isCollapsed ? 'justify-center' : '',
                                { 'bg-gray-700': $route.path === '/logs' },
                            ]"
                            :title="isCollapsed ? 'Системные логи' : ''"
                        >
                            <svg
                                :class="
                                    isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'
                                "
                                width="100%"
                                height="100%"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                            <span v-if="!isCollapsed">Логи</span>
                        </router-link>
                    </li>
                    <li
                        v-if="
                            userRole === 'super_admin' || userRole === 'admin'
                        "
                        :class="isCollapsed ? 'flex justify-center' : ''"
                    >
                        <router-link
                            :to="{ name: 'settings' }"
                            :class="[
                                'flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-700 transition-colors',
                                isCollapsed ? 'justify-center' : '',
                                { 'bg-gray-700': $route.path === '/settings' },
                            ]"
                            :title="isCollapsed ? 'Настройки' : ''"
                        >
                            <svg
                                :class="
                                    isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'
                                "
                                width="100%"
                                height="100%"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M11.049 2.927c.3-1.14 1.952-1.14 2.252 0l.149.57a1.125 1.125 0 001.18.832l.583-.066c1.178-.133 1.98 1.166 1.246 2.109l-.383.49a1.125 1.125 0 000 1.415l.383.49c.734.943-.068 2.242-1.246 2.109l-.583-.066a1.125 1.125 0 00-1.18.832l-.149.57c-.3 1.14-1.952 1.14-2.252 0l-.149-.57a1.125 1.125 0 00-1.18-.832l-.583.066c-1.178.133-1.98-1.166-1.246-2.109l.383-.49a1.125 1.125 0 000-1.415l-.383-.49c-.734-.943.068-2.242 1.246-2.109l.583.066a1.125 1.125 0 001.18-.832l.149-.57z"
                                />
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                            </svg>
                            <span v-if="!isCollapsed">Настройки</span>
                        </router-link>
                    </li>
                </ul>
            </nav>
            <div class="p-4 border-t border-gray-700">
                <div v-if="!isCollapsed" class="text-xs text-gray-400">
                    Logged in as:
                    <span class="text-white font-medium">{{ username }}</span>
                    <br />
                    <span class="text-indigo-300 text-xs">{{
                        userRoleDisplay
                    }}</span>
                </div>
                <div v-else class="text-center">
                    <div
                        class="w-8 h-8 bg-gray-600 rounded-full mx-auto mb-2 flex items-center justify-center"
                    >
                        <span class="text-white text-xs font-bold">{{
                            username.charAt(0).toUpperCase()
                        }}</span>
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
import { ref, onMounted, computed, onUnmounted } from "vue";
const username = ref("");
const userRole = ref("");
const isCollapsed = ref(false);

const userRoleDisplay = computed(() => {
    switch (userRole.value) {
        case "super_admin":
            return "Супер Администратор";
        case "admin":
            return "Администратор";
        case "editor":
            return "Редактор";
        default:
            return "Пользователь";
    }
});

const isForbiddenRole = (forbiddenRoles) => {
    return forbiddenRoles.includes(userRole.value);
};

const toggleCollapse = () => {
    isCollapsed.value = !isCollapsed.value;
    localStorage.setItem("sidebarCollapsed", isCollapsed.value.toString());
};

const loadUserData = () => {
    try {
        const userData = localStorage.getItem("user");
        const roleFromStorage = localStorage.getItem("role");

        userRole.value = roleFromStorage || "";

        if (userData) {
            const user = JSON.parse(userData);
            username.value =
                user.username ||
                user.name ||
                user.email ||
                user.displayName ||
                "Пользователь";

            if (!userRole.value && user.role) {
                userRole.value = user.role;
            }
        } else {
            username.value = "Пользователь";
        }
    } catch (error) {
        username.value = "Пользователь";
        userRole.value = "";
        throw error;
    }
};

onMounted(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState !== null) {
        isCollapsed.value = savedState === "true";
    } else if (window.innerWidth <= 640) {
        isCollapsed.value = true;
    }
    loadUserData();
    window.addEventListener("storage", (e) => {
        if (e.key === "user" || e.key === "role") {
            loadUserData();
        }
    });
    // Добавляю обработчик resize
    window.addEventListener("resize", handleResize);
});

const handleResize = () => {
    if (window.innerWidth <= 640) {
        isCollapsed.value = true;
    }
};

onUnmounted(() => {
    window.removeEventListener("resize", handleResize);
});
</script>
