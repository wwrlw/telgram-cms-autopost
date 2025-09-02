<template>
    <div class="min-h-screen bg-white">
        <div class="w-full h-full">
            <div class="bg-white border-b border-gray-200 px-8 py-4">
                <div class="flex items-center space-x-4">
                    <button
                        @click="$router.push('/analytics')"
                        class="flex items-center space-x-2 text-gray-600 hover:text-indigo-600 transition-colors duration-200"
                    >
                        <ChevronLeft class="w-5 h-5" />
                        <span>Назад к списку</span>
                    </button>
                    <div class="h-6 w-px bg-gray-300"></div>
                    <h1 class="text-2xl font-bold text-gray-900">
                        {{ selectedChannel?.name || "Аналитика канала" }}
                    </h1>
                </div>
            </div>

            <!-- <div v-if="loading" class="text-center py-12">
                <div
                    class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"
                ></div>
                <p class="mt-2 text-sm text-gray-500">Загружаем аналитику...</p>
            </div>

            <div v-else-if="!analytics" class="py-12 px-8 text-center">
                <AlertCircle class="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p class="text-gray-500">Данные аналитики не найдены</p>
            </div> -->

            <div class="space-y-8 px-8 py-8">
                <div class="overflow-hidden">
                    <div class="px-4 py-5 sm:p-6">
                        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div class="bg-blue-50 p-4 rounded-lg">
                                <div class="text-sm font-medium text-blue-600">
                                    Подписчиков
                                </div>
                                <div class="text-2xl font-bold text-blue-900">
                                    {{
                                        formatNumber(
                                            analytics?.subscribers_count || 0
                                        )
                                    }}
                                </div>
                            </div>
                            <div class="bg-green-50 p-4 rounded-lg">
                                <div class="text-sm font-medium text-green-600">
                                    Постов
                                </div>
                                <div class="text-2xl font-bold text-green-900">
                                    {{
                                        formatNumber(
                                            analytics?.posts_count || 0
                                        )
                                    }}
                                </div>
                            </div>
                            <div class="bg-yellow-50 p-4 rounded-lg">
                                <div
                                    class="text-sm font-medium text-yellow-600"
                                >
                                    Просмотров
                                </div>
                                <div class="text-2xl font-bold text-yellow-900">
                                    {{
                                        formatNumber(
                                            analytics?.views_count || 0
                                        )
                                    }}
                                </div>
                            </div>
                            <div class="bg-purple-50 p-4 rounded-lg">
                                <div
                                    class="text-sm font-medium text-purple-600"
                                >
                                    Средний ER%
                                </div>
                                <div class="text-2xl font-bold text-purple-900">
                                    {{ (analytics?.avg_er || 0).toFixed(2) }}%
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="overflow-hidden">
                    <div class="px-4 py-5 sm:p-6">
                        <h3
                            class="text-lg leading-6 font-medium text-gray-900 mb-4"
                        >
                            Статистика по датам
                        </h3>
                        <div class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th
                                            class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            Дата
                                        </th>
                                        <th
                                            class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            Подписчики
                                        </th>
                                        <th
                                            class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            Просмотры
                                        </th>
                                        <th
                                            class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            ER%
                                        </th>
                                    </tr>
                                </thead>
                                <tbody
                                    class="bg-white divide-y divide-gray-200"
                                >
                                    <tr
                                        v-for="row in tableRows"
                                        :key="row.date"
                                    >
                                        <td
                                            class="px-4 py-2 whitespace-nowrap text-sm text-gray-900"
                                        >
                                            {{
                                                new Date(
                                                    row.date
                                                ).toLocaleDateString("ru-RU")
                                            }}
                                        </td>
                                        <td
                                            class="px-4 py-2 whitespace-nowrap text-sm text-gray-900"
                                        >
                                            {{ formatNumber(row.subscribers) }}
                                        </td>
                                        <td
                                            class="px-4 py-2 whitespace-nowrap text-sm text-gray-900"
                                        >
                                            {{ formatNumber(row.views) }}
                                        </td>
                                        <td
                                            class="px-4 py-2 whitespace-nowrap text-sm text-gray-900"
                                        >
                                            {{ (row.er || 0).toFixed(2) }}%
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, inject, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ChevronLeft, AlertCircle } from "lucide-vue-next";
import http from "@/js/http";
import { formatNumber } from "@/js/utils";

const route = useRoute();
const router = useRouter();
const refreshTrigger = inject("refreshTrigger", ref(0));
const setLoading = inject("setLoading");

const channelId = ref(route.params.id);
const selectedChannel = ref(null);
const analytics = ref(null);
const loading = ref(false);
const tableRows = ref([]);

const loadChannelInfo = async () => {
    if (!channelId.value) return;

    try {
        http.getPublicationChannels((response) => {
            if (response.success) {
                const channel = response.data.find(
                    (c) => c.channel_id === channelId.value
                );
                if (channel) {
                    selectedChannel.value = channel;
                } else {
                    router.push("/analytics");
                }
            }
        });
    } catch (error) {
        console.error("Error loading channel info:", error);
    }
};

const loadChannelAnalytics = async () => {
    if (!channelId.value) return;

    loading.value = true;
    if (setLoading) setLoading(true);

    try {
        http.getChannelAnalytics(
            channelId.value,
            (response) => {
                if (response.success) {
                    analytics.value = response.data;
                } else {
                    window.$toast.error(
                        "Ошибка загрузки аналитики: " + response.message
                    );
                }
            },
            (error) => {
                console.error("Analytics API error:", error);
                window.$toast.error("Ошибка загрузки аналитики");
            }
        );

        http.getAnalyticsDaily(
            channelId.value,
            {},
            (res) => {
                if (res.success) {
                    buildTableRowsFromDaily(res.data || []);
                }
                loading.value = false;
                if (setLoading) setLoading(false);
            },
            (err) => {
                console.error("Analytics daily error:", err);
                loading.value = false;
                if (setLoading) setLoading(false);
                tableRows.value = [];
            }
        );
    } catch (error) {
        console.error("Analytics error:", error);
        window.$toast.error("Ошибка загрузки аналитики: " + error.message);
        loading.value = false;
        if (setLoading) setLoading(false);
        tableRows.value = [];
    }
};

const buildTableRowsFromDaily = (docs) => {
    const rows = (docs || []).map((d) => ({
        date: d.date,
        subscribers: d.subscribers_count || 0,
        views: d.views_sum || 0,
        er: d.engagement_avg || 0,
    }));
    tableRows.value = rows.sort((a, b) => new Date(a.date) - new Date(b.date));
};

const refreshAnalyticsHandler = async () => {
    console.log("Refresh analytics event received");
    await loadChannelAnalytics();
};

// watch(refreshTrigger, () => {
//     loadChannelInfo();
// });

watch(
    () => route.params.id,
    (newId) => {
        if (newId) {
            channelId.value = newId;
            // loadChannelInfo();
            // loadChannelAnalytics();
        }
    }
);

onMounted(() => {
    // loadChannelInfo();
    // loadChannelAnalytics();
    // window.addEventListener("refreshAnalytics", refreshAnalyticsHandler);
});

onUnmounted(() => {
    // window.removeEventListener("refreshAnalytics", refreshAnalyticsHandler);
});
</script>
