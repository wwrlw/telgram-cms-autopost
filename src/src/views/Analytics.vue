<template>
    <div class="min-h-screen bg-white">
        <div class="w-full h-full">
            <div v-if="loading" class="text-center py-12">
                <div
                    class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"
                ></div>
                <p class="mt-2 text-sm text-gray-500">Загружаем аналитику...</p>
            </div>

            <div v-else-if="!selectedChannelId" class="py-12 px-8">
                <div class="text-center max-w-4xl mx-auto">
                    <div class="flex justify-center mb-6">
                        <svg
                            class="h-12 w-12 text-indigo-500"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M3 3v18h18M7 13l3 3 7-7"
                            />
                        </svg>
                    </div>
                    <div>
                        <h3 class="text-xl font-semibold text-gray-900">
                            Добро пожаловать в аналитику каналов
                        </h3>
                        <p class="mt-2 text-gray-600">
                            Нажмите на один из быстрых вариантов ниже, чтобы
                            увидеть показатели подписчиков, постов и просмотров.
                        </p>
                    </div>

                    <div class="mt-6">
                        <div class="text-sm text-gray-500 mb-4">
                            Быстрый выбор канала
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div
                                v-for="c in channels.slice(0, 8)"
                                :key="c.channel_id"
                                @click="
                                    $router.push(`/analytics/${c.channel_id}`)
                                "
                                class="group cursor-pointer bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-indigo-300 hover:from-indigo-50 hover:to-white transition-all duration-200 transform hover:-translate-y-1"
                            >
                                <div class="flex items-center space-x-3">
                                    <div class="flex-shrink-0">
                                        <div
                                            class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:from-indigo-600 group-hover:to-purple-700 transition-all duration-200"
                                        >
                                            <svg
                                                class="w-5 h-5 text-white"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2h-3l-4 4z"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                    <div class="min-w-0 flex-1">
                                        <p
                                            class="text-sm font-medium text-gray-900 group-hover:text-indigo-700 transition-colors duration-200 truncate"
                                        >
                                            {{ c.name }}
                                        </p>
                                        <p
                                            class="text-xs text-gray-500 group-hover:text-indigo-600 transition-colors duration-200"
                                        >
                                            ID: {{ c.channel_id }}
                                        </p>
                                    </div>
                                    <div
                                        class="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                    >
                                        <svg
                                            class="w-4 h-4 text-indigo-500"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M9 5l7 7-7 7"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div
                                v-if="channels.length === 0"
                                class="col-span-full text-center py-8"
                            >
                                <svg
                                    class="mx-auto h-12 w-12 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                    />
                                </svg>
                                <p class="mt-2 text-sm text-gray-500">
                                    Каналов пока нет
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="p-4 rounded-md bg-indigo-50">
                            <div class="text-sm font-medium text-indigo-700">
                                Шаг 1
                            </div>
                            <div class="text-sm text-indigo-900 mt-1">
                                Выберите канал публикации для просмотра
                                статистики.
                            </div>
                        </div>
                        <div class="p-4 rounded-md bg-green-50">
                            <div class="text-sm font-medium text-green-700">
                                Шаг 2
                            </div>
                            <div class="text-sm text-green-900 mt-1">
                                Снимок аналитики делается ежедневно в
                                <span class="font-semibold">{{
                                    settings.analytics_daily_time
                                }}</span
                                >. Изменить можно в настройках.
                            </div>
                        </div>
                        <div class="p-4 rounded-md bg-yellow-50">
                            <div class="text-sm font-medium text-yellow-700">
                                Совет
                            </div>
                            <div class="text-sm text-yellow-900 mt-1">
                                Нажмите «Обновить» в шапке, чтобы перезагрузить
                                данные после изменений.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Аналитика канала -->
            <div v-else-if="analytics" class="space-y-8 px-8 py-8">
                <!-- Основная информация о канале -->
                <div class="overflow-hidden">
                    <div class="px-4 py-5 sm:p-6">
                        <h3
                            class="text-lg leading-6 font-medium text-gray-900 mb-4"
                        >
                            {{ selectedChannel?.name }}
                        </h3>
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
                                    Средний ERR%
                                </div>
                                <div class="text-2xl font-bold text-purple-900">
                                    {{ (analytics?.avg_err || 0).toFixed(2) }}%
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Табличный вид, объединяющий метрики по датам -->
                <div class="overflow-hidden">
                    <div class="px-4 py-5 sm:p-6">
                        <h3
                            class="text-lg leading-6 font-medium text-gray-900 mb-4"
                        >
                            Таблица по датам
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
                                            ERR%
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
                                            {{ ((row.err ?? row.er ?? 0)).toFixed(2) }}%
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
import { useRoute } from "vue-router";
import http from "@/js/http";
import { formatNumber } from "@/js/utils";

const route = useRoute();

const refreshTrigger = inject("refreshTrigger", ref(0));
const setLoading = inject("setLoading");

const channels = ref([]);
const selectedChannelId = ref("");
const selectedChannel = ref(null);
const analytics = ref({
    subscribers_count: 0,
    posts_count: 0,
    views_count: 0,
    avg_reach: 0,
});
const loading = ref(false);
const settings = ref({ analytics_daily_time: "10:00" });

const tableRows = ref([]);

const loadChannels = () => {
    if (setLoading) setLoading(true);

    http.getPublicationChannels((response) => {
        if (response.success) {
            channels.value = response.data || [];
        } else {
            window.$toast.error("Ошибка загрузки каналов: " + response.message);
            channels.value = [];
        }
        if (setLoading) setLoading(false);
    });
};

const loadSettings = () => {
    if (!http.getSettings) return;
    http.getSettings((res) => {
        if (res.success) {
            settings.value = res.data || settings.value;
        }
    });
};

const loadChannelAnalytics = async () => {
    if (!selectedChannelId.value) {
        analytics.value = {
            subscribers_count: 0,
            posts_count: 0,
            views_count: 0,
            avg_err: 0,
        };
        selectedChannel.value = null;
        return;
    }

    loading.value = true;
    selectedChannel.value = channels.value.find(
        (c) => c.channel_id === selectedChannelId.value
    );

    try {
        http.getChannelAnalytics(
            selectedChannelId.value,
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
            selectedChannelId.value,
            {},
            (res) => {
                if (res.success) {
                    buildTableRowsFromDaily(res.data || []);
                }
                loading.value = false;
            },
            (err) => {
                console.error("Analytics daily error:", err);
                loading.value = false;
                tableRows.value = [];
            }
        );
    } catch (error) {
        console.error("Analytics error:", error);
        window.$toast.error("Ошибка загрузки аналитики: " + error.message);
        loading.value = false;
        tableRows.value = [];
    }
};

const buildTableRowsFromDaily = (docs) => {
    const rows = (docs || []).map((d) => ({
        date: d.date,
        subscribers: d.subscribers_count || 0,
        views: d.views_day ?? d.views ?? 0,
        err: d.err_day ?? d.err ?? 0,
    }));
    tableRows.value = rows.sort((a, b) => new Date(a.date) - new Date(b.date));
};

const refreshAnalyticsHandler = async () => {
    console.log("Refresh analytics event received");
    loading.value = true;
    if (setLoading) setLoading(true);

    try {
        loadChannels();
        loadSettings();
        if (selectedChannelId.value) {
            await loadChannelAnalytics();
        }
    } catch (error) {
        console.error("Error refreshing analytics:", error);
        analytics.value = {
            subscribers_count: 0,
            posts_count: 0,
            views_count: 0,
            avg_reach: 0,
        };
        tableRows.value = [];
    } finally {
        loading.value = false;
        if (setLoading) setLoading(false);
    }
};

const initFromRoute = () => {
    const id = route.params && route.params.id ? String(route.params.id) : "";
    if (id) {
        selectedChannelId.value = id;
    }
};

watch(refreshTrigger, () => {
    loadChannels();
});

onMounted(() => {
    loadChannels();
    loadSettings();
    initFromRoute();
    if (selectedChannelId.value) {
        loadChannelAnalytics();
    }
    window.addEventListener("refreshAnalytics", refreshAnalyticsHandler);
});

watch(
    () => route.params.id,
    (newId) => {
        if (newId && String(newId) !== selectedChannelId.value) {
            selectedChannelId.value = String(newId);
            loadChannelAnalytics();
        }
    }
);

onUnmounted(() => {
    window.removeEventListener("refreshAnalytics", refreshAnalyticsHandler);
});
</script>
