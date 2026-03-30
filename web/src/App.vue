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
import { ref, provide } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
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

</script>
<style scoped></style>
