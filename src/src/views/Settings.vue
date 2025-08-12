<template>
    <div class="min-h-screen bg-gray-50" data-settings-component>
        <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <!-- Настройки доступны всем пользователям -->
            <div class="mb-6 p-4 bg-white shadow rounded">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="text-lg font-semibold">Настройки</h3>
                    <div v-if="userRole" class="text-sm text-gray-500">
                        Роль: {{ userRole === 'super_admin' ? 'Супер Администратор' : userRole === 'admin' ? 'Администратор' : userRole === 'editor' ? 'Редактор' : 'Пользователь' }}
                    </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label class="block text-sm text-gray-600 mb-1"
                            >Тема</label
                        >
                        <select
                            v-model="settings.theme"
                            :disabled="userRole !== 'super_admin'"
                            class="w-full border rounded px-3 py-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                            <option value="light">Светлая</option>
                            <option value="dark">Тёмная</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm text-gray-600 mb-1"
                            >Язык</label
                        >
                        <select
                            v-model="settings.language"
                            :disabled="userRole !== 'super_admin'"
                            class="w-full border rounded px-3 py-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                            <option value="en">Английский</option>
                            <option value="ru">Русский</option>
                        </select>
                    </div>
                </div>
                <div class="mt-4 flex justify-end">
                    <button
                        v-if="userRole === 'super_admin'"
                        @click="saveSettings"
                        class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                    >
                        Сохранить
                    </button>
                    <div v-else class="text-sm text-gray-500 italic">
                        Настройки доступны только для просмотра
                    </div>
                </div>
            </div>
            
            <!-- Компонент очистки БД доступен только супер администраторам -->
            <ClearDb v-if="userRole === 'super_admin'" />
            
            <!-- Сообщение для пользователей без доступа к расширенным настройкам -->
            <div v-if="userRole && userRole !== 'super_admin'" class="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
                <div class="flex items-center">
                    <svg class="w-5 h-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span class="text-yellow-800">
                        Расширенные настройки доступны только супер администраторам
                    </span>
                </div>
            </div>
        </main>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import ClearDb from "@/components/ClearDb.vue";

const settings = ref({
    theme: "light",
    language: "en",
});

const userRole = ref("");

const loadUserData = () => {
    try {
        const userData = localStorage.getItem("user");
        const roleFromStorage = localStorage.getItem("role");

        userRole.value = roleFromStorage || "";

        if (userData) {
            const user = JSON.parse(userData);
            if (!userRole.value && user.role) {
                userRole.value = user.role;
            }
        }
    } catch (error) {
        userRole.value = "";
        console.error("Error loading user data:", error);
    }
};

// const toggleTheme = () => {
//     settings.value.theme = settings.value.theme === "light" ? "dark" : "light";
// };

// const toggleLanguage = () => {
//     settings.value.language = settings.value.language === "en" ? "ru" : "en";
// };

const saveSettings = () => {
    console.log("Saving settings:", settings.value);
    // Здесь можно добавить логику сохранения настроек
    window?.$toast?.success("Настройки сохранены");
};

// const loadSettings = () => {
//     console.log(settings.value);
// };

onMounted(() => {
    loadUserData();
    
    // Слушаем изменения в localStorage
    window.addEventListener("storage", (e) => {
        if (e.key === "user" || e.key === "role") {
            loadUserData();
        }
    });
});
</script>

<style scoped></style>
