<template>
    <div class="min-h-screen bg-gray-50" data-settings-component>
        <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <!-- Отображение ошибок -->
            <div
                v-if="error"
                class="mb-6 p-4 bg-red-50 border border-red-200 rounded"
            >
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <svg
                            class="w-5 h-5 text-red-400 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <div>
                            <h3 class="text-sm font-medium text-red-800">
                                Ошибка доступа
                            </h3>
                            <p class="text-sm text-red-700 mt-1">{{ error }}</p>
                        </div>
                    </div>
                    <button
                        @click="loadUserData"
                        class="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-800 rounded border border-red-300"
                    >
                        Повторить
                    </button>
                </div>
            </div>

            <!-- Настройки доступны всем пользователям -->
            <div class="mb-6 p-4 bg-white shadow rounded">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="text-lg font-semibold">Настройки</h3>
                    <div v-if="userRole" class="text-sm text-gray-500">
                        Роль:
                        {{
                            userRole === "super_admin"
                                ? "Супер Администратор"
                                : userRole === "admin"
                                  ? "Администратор"
                                  : userRole === "editor"
                                    ? "Редактор"
                                    : "Пользователь"
                        }}
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
                            class="w-full border rounded px-3 py-2 disabled:cursor-not-allowed"
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
            <div
                v-if="userRole && userRole !== 'super_admin'"
                class="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded"
            >
                <div class="flex items-center">
                    <svg
                        class="w-5 h-5 text-yellow-400 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                    </svg>
                    <span class="text-yellow-800">
                        Расширенные настройки доступны только супер
                        администраторам
                    </span>
                </div>
            </div>
        </main>

        <!-- Модальное окно для подтверждения сохранения настроек -->
        <ConfirmModal
            :show="showConfirmModal"
            :message="confirmMessage"
            confirm-text="Сохранить"
            cancel-text="Отмена"
            @confirm="confirmSaveSettings"
            @cancel="showConfirmModal = false"
        />
    </div>
</template>

<script setup>
import { ref, onMounted, provide } from "vue";
import ClearDb from "@/components/ClearDb.vue";
import ConfirmModal from "@/components/Modal/ConfirmModal.vue";
import http from "@/js/http";

const settings = ref({
    theme: "light",
    language: "en",
});

const userRole = ref("");
const showConfirmModal = ref(false);
const confirmMessage = ref("");
const error = ref("");

// Предоставляем функцию для отображения ошибок дочерним компонентам
const showError = (errorMessage) => {
    error.value = errorMessage;
};

provide("showError", showError);

const loadUserData = async () => {
    try {
        // Очищаем предыдущие ошибки
        error.value = "";

        const userData = localStorage.getItem("user");
        const roleFromStorage = localStorage.getItem("role");

        userRole.value = roleFromStorage || "";

        if (userData) {
            const user = JSON.parse(userData);
            if (!userRole.value && user.role) {
                userRole.value = user.role;
            }
        }

        // Проверяем доступ к странице настроек
        try {
            await http.instance.get("/auth/check");
        } catch (err) {
            if (err.response?.status === 403) {
                error.value =
                    "У вас нет доступа к этой странице. Недостаточно прав.";
                userRole.value = "";
            } else if (err.code === "ERR_NETWORK" || !err.response) {
                error.value =
                    "Ошибка подключения к серверу. Проверьте интернет-соединение.";
            } else {
                error.value = `Ошибка загрузки данных: ${err.response?.data?.message || err.message}`;
            }
        }
    } catch (err) {
        userRole.value = "";
        error.value = "Ошибка загрузки данных пользователя";
        console.error("Error loading user data:", err);
    }
};

const saveSettings = () => {
    // Показываем модальное окно для подтверждения
    confirmMessage.value = `Сохранить настройки?\n\nТема: ${settings.value.theme === "light" ? "Светлая" : "Тёмная"}\nЯзык: ${settings.value.language === "en" ? "Английский" : "Русский"}`;
    showConfirmModal.value = true;
};

const confirmSaveSettings = async () => {
    try {
        // Здесь можно добавить логику сохранения настроек
        // Например, отправка запроса на сервер

        // Показываем уведомление об успешном сохранении
        if (window?.$toast) {
            window.$toast.success("Настройки сохранены");
        }

        // Скрываем модальное окно
        showConfirmModal.value = false;
    } catch (err) {
        if (err.response?.status === 403) {
            error.value =
                "У вас нет прав для сохранения настроек. Недостаточно прав.";
            if (window?.$toast) {
                window.$toast.error(
                    "Недостаточно прав для сохранения настроек"
                );
            }
        } else {
            error.value = `Ошибка сохранения настроек: ${err.response?.data?.message || err.message}`;
            if (window?.$toast) {
                window.$toast.error("Ошибка сохранения настроек");
            }
        }

        // Скрываем модальное окно
        showConfirmModal.value = false;
    }
};

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
