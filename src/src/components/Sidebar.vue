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
                    <ChevronRight v-if="isCollapsed" class="w-5 h-5" />
                    <ChevronLeft v-else class="w-5 h-5" />
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
                            <ImageUp
                                :class="
                                    isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'
                                "
                            />
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
                            <Plus
                                :class="
                                    isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'
                                "
                            />
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
                            <Bookmark
                                :class="
                                    isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'
                                "
                            />
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
                            <Clock
                                :class="
                                    isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'
                                "
                            />
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
                            <FolderOpen
                                :class="
                                    isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'
                                "
                            />
                            <span v-if="!isCollapsed">Категории</span>
                        </router-link>
                    </li>
                    <li
                        v-if="userRole !== 'editor'"
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
                            <FileText
                                :class="
                                    isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'
                                "
                            />
                            <span v-if="!isCollapsed">Каналы</span>
                        </router-link>
                    </li>
                    <li
                        v-if="userRole !== 'editor'"
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
                            <Radio
                                :class="
                                    isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'
                                "
                            />
                            <span v-if="!isCollapsed">Каналы публикации</span>
                        </router-link>
                    </li>
                    <li
                        v-if="userRole !== 'editor'"
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
                            <BarChart3
                                :class="
                                    isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'
                                "
                            />
                            <span v-if="!isCollapsed">Аналитика</span>
                        </router-link>
                    </li>

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
                            <Users
                                :class="
                                    isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'
                                "
                            />
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
                            <FileText
                                :class="
                                    isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'
                                "
                            />
                            <span v-if="!isCollapsed">Логи</span>
                        </router-link>
                    </li>
                    <li
                        v-if="userRole === 'super_admin'"
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
                            <Settings
                                :class="
                                    isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'
                                "
                            />
                            <span v-if="!isCollapsed">Настройки</span>
                        </router-link>
                    </li>
                </ul>
            </nav>
            <div class="p-4 border-t border-gray-700">
                <div
                    v-if="isCollapsed"
                    class="flex flex-col items-center space-y-3"
                >
                    <div
                        class="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center"
                    >
                        <span class="text-white text-xs font-bold">
                            {{ username.charAt(0).toUpperCase() }}
                        </span>
                    </div>

                    <button
                        @click="logout"
                        class="text-gray-400 hover:text-white transition-colors duration-200"
                    >
                        <LogOut class="h-5 w-5" />
                    </button>
                </div>

                <div v-else class="flex flex-col">
                    <div class="font-semibold">{{ username }}</div>
                    <div class="text-xs text-gray-400">
                        {{ userRoleDisplay }}
                    </div>

                    <button
                        @click="logout"
                        class="flex items-center text-gray-400 hover:text-white transition-colors duration-200 mt-2"
                    >
                        <LogOut class="mr-2 h-4 w-4" />
                        Выйти
                    </button>
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
import { useRouter } from "vue-router";
// import http from "@/js/http";
import {
    Plus,
    Settings,
    Users,
    FolderOpen,
    BarChart3,
    ChevronLeft,
    ChevronRight,
    Bookmark,
    Clock,
    FileText,
    Radio,
    LogOut,
    ImageUp,
} from "lucide-vue-next";

const router = useRouter();
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

const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
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

// const checkUserRole = async () => {
//     try {
//         const response = await http.instance.get("/auth/check");
//         if (response.data.success) {
//             const newRole = response.data.data.role;
//             if (newRole !== userRole.value) {
//                 userRole.value = newRole;
//                 localStorage.setItem("role", newRole);
//                 console.log("Role updated to:", newRole);
//             }
//         }
//     } catch (error) {
//         console.error("Error checking user role:", error);
//     }
// };

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
