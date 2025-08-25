<template>
    <div v-if="$route.name !== 'login'">
        <Sidebar>
            <Header
                v-if="route.name !== 'post'"
                :loading="loading"
                @refreshPosts="refreshPosts"
                @refreshData="refreshData"
                class="bg-white shadow-sm border-b border-gray-200 flex-shrink-0"
            />

            <div id="app-scroller" class="flex-1 overflow-auto">
                <RouterView v-slot="{ Component }">
                    <keep-alive>
                        <component
                            :is="Component"
                            v-if="$route.meta?.keepAlive"
                        />
                    </keep-alive>
                    <component :is="Component" v-if="!$route.meta?.keepAlive" />
                </RouterView>
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
import { useRouter, useRoute } from "vue-router";
import http from "@/js/http";

const route = useRoute();
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

    if (dataType === "logs") {
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
        refreshTrigger.value++;
    } else if (dataType === "settings") {
        refreshTrigger.value++;
    }
};

provide("setLoading", (value) => {
    loading.value = value;
});

const checkBackendConnection = async () => {
    try {
        const response = await http.instance.get("/auth/check");
        if (response.data.success) {
            console.log("Backend connection restored");
            if (window.$toast) {
                window.$toast.clearByType("error");
            }
        }
    } catch (error) {
        console.error("Backend connection check failed:", error);

        if (
            error.response?.status === 403 &&
            error.response?.data?.code === "USER_BANNED"
        ) {
            console.warn("User is banned, logging out...");

            localStorage.removeItem("token");
            localStorage.removeItem("role");
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("role");

            if (window.$toast) {
                window.$toast.error("Ваш аккаунт заблокирован", 10000);
            }

            router.push("/login");
            return;
        }

        if (
            error.response?.status === 404 &&
            error.response?.data?.code === "USER_NOT_FOUND"
        ) {
            console.warn("User not found in database, logging out...");

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

            router.push("/login");
            return;
        }

        if (
            error.code === "ERR_NETWORK" ||
            error.message?.includes("Network Error") ||
            error.message?.includes("timeout") ||
            !error.response
        ) {
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
    connectionCheckInterval = setInterval(checkBackendConnection, 30000);

    setTimeout(checkBackendConnection, 30000);
});

onUnmounted(() => {
    if (connectionCheckInterval) {
        clearInterval(connectionCheckInterval);
    }
});
</script>
<style scoped></style>
