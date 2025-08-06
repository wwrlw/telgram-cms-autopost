<template>
    <div v-if="$route.name !== 'login'">
        <Sidebar>
            <Header
                :loading="loading"
                @refreshPosts="refreshPosts"
                class="bg-white shadow-sm border-b border-gray-200 flex-shrink-0"
            />

            <div class="flex-1 overflow-auto">
                <RouterView />
            </div>
        </Sidebar>

        <!-- Глобальный компонент уведомлений -->
        <Toast />
    </div>

    <router-view v-else />
</template>

<script setup>
import Header from "@/components/Header.vue";
import Sidebar from "@/components/Sidebar.vue";
import Toast from "@/components/Shared/Toast.vue";
import { ref, provide } from "vue";
import { useRouter } from "vue-router";

const loading = ref(false);
const refreshTrigger = ref(0);
const router = useRouter();

provide("loading", loading);
provide("refreshTrigger", refreshTrigger);

const refreshPosts = () => {
    console.log("Refresh button clicked");
    console.log("Refresh trigger before increment:", refreshTrigger.value);
    loading.value = true;
    refreshTrigger.value++;
    console.log("Refresh trigger incremented to:", refreshTrigger.value);

    // Отправляем событие для обновления постов
    window.dispatchEvent(new CustomEvent("refresh-posts"));

    // Также пытаемся вызвать функцию обновления напрямую
    const currentRoute = router.currentRoute.value;
    if (currentRoute.name === "posts" || currentRoute.name === "home") {
        // Если мы на странице постов, пытаемся вызвать функцию обновления
        const postsComponent = document.querySelector("[data-posts-component]");
        if (postsComponent && postsComponent.__vueParentComponent) {
            const postsInstance = postsComponent.__vueParentComponent.exposed;
            if (postsInstance && postsInstance.refreshPosts) {
                postsInstance.refreshPosts();
            }
        }
    }

    // Сбрасываем loading через небольшую задержку
    setTimeout(() => {
        loading.value = false;
    }, 1000);
};

provide("setLoading", (value) => {
    loading.value = value;
});
</script>
<style scoped></style>
