<template>
    <div v-if="$route.name !== 'login'">
        <Sidebar>
            <Header
                :loading="loading"
                @refreshPosts="refreshPosts"
                @refreshData="refreshData"
                class="bg-white shadow-sm border-b border-gray-200 flex-shrink-0"
            />

            <div class="flex-1 overflow-auto">
                <RouterView />
            </div>
        </Sidebar>

        <Toast />
    </div>

    <router-view v-else />
</template>

<script setup>
import Header from "@/components/Header.vue";
import Sidebar from "@/components/Sidebar.vue";
import Toast from "@/components/Shared/Toast.vue";
import { ref, provide, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import http from "@/js/http";

const router = useRouter();
const loading = ref(false);
const refreshTrigger = ref(0);

provide("loading", loading);
provide("refreshTrigger", refreshTrigger);

const refreshPosts = () => {
    refreshTrigger.value++;
    loading.value = true;
};

const refreshData = (dataType) => {
    loading.value = true;

    // Эмитим событие для конкретного типа данных
    if (dataType === "logs") {
        // Для логов используем специальное событие
        window.dispatchEvent(new CustomEvent("refreshLogs"));
    } else if (dataType === "categories") {
        window.dispatchEvent(new CustomEvent("refreshCategories"));
    } else if (dataType === "channels") {
        window.dispatchEvent(new CustomEvent("refreshChannels"));
    } else if (dataType === "publication-channels") {
        window.dispatchEvent(new CustomEvent("refreshPublicationChannels"));
    } else if (dataType === "scheduled-posts") {
        window.dispatchEvent(new CustomEvent("refreshScheduledPosts"));
    } else if (dataType === "analytics") {
        window.dispatchEvent(new CustomEvent("refreshAnalytics"));
    } else if (dataType === "users") {
        window.dispatchEvent(new CustomEvent("refreshUsers"));
    } else if (dataType === "favorites") {
        // Для избранного используем существующий механизм
        refreshTrigger.value++;
    } else if (dataType === "settings") {
        // Для настроек используем существующий механизм
        refreshTrigger.value++;
    }

    // Сбрасываем loading через задержку, чтобы страница успела обработать событие
    // Увеличиваем задержку для надежности
    setTimeout(() => {
        loading.value = false;
    }, 500);
};

provide("setLoading", (value) => {
    loading.value = value;
});

// Глобальная проверка подключения к бэкенду
const checkBackendConnection = async () => {
    try {
        const response = await http.instance.get("/auth/check");
        if (response.data.success) {
            // Подключение восстановлено - скрываем предыдущие уведомления об ошибках
            console.log("Backend connection restored");
            if (window.$toast) {
                window.$toast.clearByType("error");
            }
        }
    } catch (error) {
        console.error("Backend connection check failed:", error);

        // Проверяем, заблокирован ли пользователь
        if (
            error.response?.status === 403 &&
            error.response?.data?.code === "USER_BANNED"
        ) {
            console.warn("User is banned, logging out...");

            // Очищаем токен и роль
            localStorage.removeItem("token");
            localStorage.removeItem("role");
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("role");

            // Показываем уведомление о блокировке
            if (window.$toast) {
                window.$toast.error("Ваш аккаунт заблокирован", 10000);
            }

            // Перенаправляем на страницу логина
            router.push("/login");
            return;
        }

        // Проверяем, не найден ли пользователь в БД
        if (
            error.response?.status === 404 &&
            error.response?.data?.code === "USER_NOT_FOUND"
        ) {
            console.warn("User not found in database, logging out...");

            // Очищаем токен и роль
            localStorage.removeItem("token");
            localStorage.removeItem("role");
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("role");

            // Показываем уведомление
            if (window.$toast) {
                window.$toast.error(
                    "Пользователь не найден в базе данных",
                    10000
                );
            }

            // Перенаправляем на страницу логина
            router.push("/login");
            return;
        }

        // Проверяем, является ли ошибка связанной с подключением
        if (
            error.code === "ERR_NETWORK" ||
            error.message?.includes("Network Error") ||
            error.message?.includes("timeout") ||
            !error.response
        ) {
            // Показываем глобальное уведомление о проблеме с подключением
            if (window.$toast) {
                window.$toast.error(
                    "Проблема с коннектом. Проверьте интернет-соединение",
                    15000
                );
            }
        }
    }
};

let connectionCheckInterval;

onMounted(() => {
    // Запускаем проверку подключения каждые 30 секунд
    connectionCheckInterval = setInterval(checkBackendConnection, 30000);

    // Первая проверка через 5 секунд после загрузки
    setTimeout(checkBackendConnection, 5000);
});

onUnmounted(() => {
    if (connectionCheckInterval) {
        clearInterval(connectionCheckInterval);
    }
});
</script>
<style scoped></style>
