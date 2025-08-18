<template>
    <div class="min-h-screen bg-gray-50 py-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <!-- Заголовок страницы -->
            <div class="mb-8">
                <div class="flex justify-between items-center">
                    <div>
                        <h1 class="text-3xl font-bold text-gray-900">
                            Аналитика каналов
                        </h1>
                        <p class="mt-2 text-sm text-gray-600">
                            Подробная статистика по вашим каналам публикации
                        </p>
                    </div>
                    <div class="flex items-center space-x-4">
                        <select
                            v-model="selectedChannelId"
                            @change="loadChannelAnalytics"
                            class="block w-64 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                            <option value="">Выберите канал</option>
                            <option
                                v-for="channel in channels"
                                :key="channel.id"
                                :value="channel.channel_id"
                            >
                                {{ channel.name }} ({{ channel.channel_id }})
                            </option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Загрузка -->
            <div v-if="loading" class="text-center py-12">
                <div
                    class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"
                ></div>
                <p class="mt-2 text-sm text-gray-500">Загружаем аналитику...</p>
            </div>

            <!-- Сообщение о выборе канала -->
            <div v-else-if="!selectedChannelId" class="text-center py-12">
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
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                </svg>
                <h3 class="mt-2 text-sm font-medium text-gray-900">
                    Выберите канал
                </h3>
                <p class="mt-1 text-sm text-gray-500">
                    Выберите канал из списка выше для просмотра аналитики
                </p>
            </div>

            <!-- Аналитика канала -->
            <div v-else-if="analytics" class="space-y-8">
                <!-- Основная информация о канале -->
                <div class="bg-white overflow-hidden shadow rounded-lg">
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
                                            analytics.subscribers_count
                                        )
                                    }}
                                </div>
                            </div>
                            <div class="bg-green-50 p-4 rounded-lg">
                                <div class="text-sm font-medium text-green-600">
                                    Постов
                                </div>
                                <div class="text-2xl font-bold text-green-900">
                                    {{ formatNumber(analytics.posts_count) }}
                                </div>
                            </div>
                            <div class="bg-yellow-50 p-4 rounded-lg">
                                <div
                                    class="text-sm font-medium text-yellow-600"
                                >
                                    Просмотров
                                </div>
                                <div class="text-2xl font-bold text-yellow-900">
                                    {{ formatNumber(analytics.views_count) }}
                                </div>
                            </div>
                            <div class="bg-purple-50 p-4 rounded-lg">
                                <div
                                    class="text-sm font-medium text-purple-600"
                                >
                                    Средний охват
                                </div>
                                <div class="text-2xl font-bold text-purple-900">
                                    {{ formatNumber(analytics.avg_reach) }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Графики -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <!-- График подписчиков по времени -->
                    <div class="bg-white overflow-hidden shadow rounded-lg">
                        <div class="px-4 py-5 sm:p-6">
                            <h3
                                class="text-lg leading-6 font-medium text-gray-900 mb-4"
                            >
                                Рост подписчиков
                            </h3>
                            <div class="h-64">
                                <canvas ref="subscribersChart"></canvas>
                            </div>
                        </div>
                    </div>

                    <!-- График активности постов -->
                    <div class="bg-white overflow-hidden shadow rounded-lg">
                        <div class="px-4 py-5 sm:p-6">
                            <h3
                                class="text-lg leading-6 font-medium text-gray-900 mb-4"
                            >
                                Активность постов
                            </h3>
                            <div class="h-64">
                                <canvas ref="postsChart"></canvas>
                            </div>
                        </div>
                    </div>

                    <!-- График просмотров -->
                    <div class="bg-white overflow-hidden shadow rounded-lg">
                        <div class="px-4 py-5 sm:p-6">
                            <h3
                                class="text-lg leading-6 font-medium text-gray-900 mb-4"
                            >
                                Просмотры по дням
                            </h3>
                            <div class="h-64">
                                <canvas ref="viewsChart"></canvas>
                            </div>
                        </div>
                    </div>

                    <!-- График вовлеченности -->
                    <div class="bg-white overflow-hidden shadow rounded-lg">
                        <div class="px-4 py-5 sm:p-6">
                            <h3
                                class="text-lg leading-6 font-medium text-gray-900 mb-4"
                            >
                                Вовлеченность
                            </h3>
                            <div class="h-64">
                                <canvas ref="engagementChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Детальная статистика -->
                <div class="bg-white overflow-hidden shadow rounded-lg">
                    <div class="px-4 py-5 sm:p-6">
                        <h3
                            class="text-lg leading-6 font-medium text-gray-900 mb-4"
                        >
                            Детальная статистика
                        </h3>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <h4
                                    class="text-sm font-medium text-gray-500 uppercase tracking-wide"
                                >
                                    Топ постов
                                </h4>
                                <div class="mt-2 space-y-2">
                                    <div
                                        v-for="post in analytics.top_posts"
                                        :key="post.id"
                                        class="flex justify-between items-center"
                                    >
                                        <span
                                            class="text-sm text-gray-900 truncate"
                                            >{{
                                                post.title || "Пост #" + post.id
                                            }}</span
                                        >
                                        <span
                                            class="text-sm font-medium text-gray-900"
                                            >{{
                                                formatNumber(post.views)
                                            }}</span
                                        >
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h4
                                    class="text-sm font-medium text-gray-500 uppercase tracking-wide"
                                >
                                    Время публикаций
                                </h4>
                                <div class="mt-2 space-y-2">
                                    <div
                                        v-for="time in analytics.best_posting_times"
                                        :key="time.hour"
                                        class="flex justify-between items-center"
                                    >
                                        <span class="text-sm text-gray-900"
                                            >{{ time.hour }}:00</span
                                        >
                                        <span
                                            class="text-sm font-medium text-gray-900"
                                            >{{
                                                formatNumber(time.engagement)
                                            }}%</span
                                        >
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h4
                                    class="text-sm font-medium text-gray-500 uppercase tracking-wide"
                                >
                                    Типы контента
                                </h4>
                                <div class="mt-2 space-y-2">
                                    <div
                                        v-for="type in analytics.content_types"
                                        :key="type.type"
                                        class="flex justify-between items-center"
                                    >
                                        <span class="text-sm text-gray-900">{{
                                            getContentTypeName(type.type)
                                        }}</span>
                                        <span
                                            class="text-sm font-medium text-gray-900"
                                            >{{
                                                formatNumber(type.count)
                                            }}</span
                                        >
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, inject, watch, nextTick } from "vue";
import http from "../js/http.js";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

const refreshTrigger = inject("refreshTrigger", ref(0));
const setLoading = inject("setLoading");

const channels = ref([]);
const selectedChannelId = ref("");
const selectedChannel = ref(null);
const analytics = ref(null);
const loading = ref(false);

// Ссылки на canvas для графиков
const subscribersChart = ref(null);
const postsChart = ref(null);
const viewsChart = ref(null);
const engagementChart = ref(null);

// Экземпляры графиков
let subscribersChartInstance = null;
let postsChartInstance = null;
let viewsChartInstance = null;
let engagementChartInstance = null;

const loadChannels = () => {
    if (setLoading) setLoading(true);

    http.getPublicationChannels((response) => {
        if (response.success) {
            channels.value = response.data || [];
        } else {
            window.$toast.error("Ошибка загрузки каналов: " + response.message);
        }
        if (setLoading) setLoading(false);
    });
};

const loadChannelAnalytics = async () => {
    if (!selectedChannelId.value) {
        analytics.value = null;
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
                    nextTick(() => {
                        createCharts();
                    });
                } else {
                    window.$toast.error(
                        "Ошибка загрузки аналитики: " + response.message
                    );
                }
                loading.value = false;
            },
            (error) => {
                console.error("Analytics API error:", error);
                window.$toast.error("Ошибка загрузки аналитики");
                loading.value = false;
            }
        );
    } catch (error) {
        console.error("Analytics error:", error);
        window.$toast.error("Ошибка загрузки аналитики: " + error.message);
        loading.value = false;
    }
};

const createCharts = () => {
    // График роста подписчиков
    if (subscribersChart.value) {
        if (subscribersChartInstance) {
            subscribersChartInstance.destroy();
        }

        const ctx = subscribersChart.value.getContext("2d");
        subscribersChartInstance = new Chart(ctx, {
            type: "line",
            data: {
                labels: analytics.value.subscribers_growth.map((item) =>
                    new Date(item.date).toLocaleDateString("ru-RU")
                ),
                datasets: [
                    {
                        label: "Подписчики",
                        data: analytics.value.subscribers_growth.map(
                            (item) => item.count
                        ),
                        borderColor: "rgb(59, 130, 246)",
                        backgroundColor: "rgba(59, 130, 246, 0.1)",
                        tension: 0.4,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false,
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                    },
                },
            },
        });
    }

    // График активности постов
    if (postsChart.value) {
        if (postsChartInstance) {
            postsChartInstance.destroy();
        }

        const ctx = postsChart.value.getContext("2d");
        postsChartInstance = new Chart(ctx, {
            type: "bar",
            data: {
                labels: analytics.value.posts_activity.map((item) =>
                    new Date(item.date).toLocaleDateString("ru-RU")
                ),
                datasets: [
                    {
                        label: "Посты",
                        data: analytics.value.posts_activity.map(
                            (item) => item.count
                        ),
                        backgroundColor: "rgba(34, 197, 94, 0.8)",
                        borderColor: "rgb(34, 197, 94)",
                        borderWidth: 1,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false,
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                    },
                },
            },
        });
    }

    // График просмотров
    if (viewsChart.value) {
        if (viewsChartInstance) {
            viewsChartInstance.destroy();
        }

        const ctx = viewsChart.value.getContext("2d");
        viewsChartInstance = new Chart(ctx, {
            type: "line",
            data: {
                labels: analytics.value.views_data.map((item) =>
                    new Date(item.date).toLocaleDateString("ru-RU")
                ),
                datasets: [
                    {
                        label: "Просмотры",
                        data: analytics.value.views_data.map(
                            (item) => item.views
                        ),
                        borderColor: "rgb(245, 158, 11)",
                        backgroundColor: "rgba(245, 158, 11, 0.1)",
                        tension: 0.4,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false,
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                    },
                },
            },
        });
    }

    // График вовлеченности
    if (engagementChart.value) {
        if (engagementChartInstance) {
            engagementChartInstance.destroy();
        }

        const ctx = engagementChart.value.getContext("2d");
        engagementChartInstance = new Chart(ctx, {
            type: "line",
            data: {
                labels: analytics.value.engagement_data.map((item) =>
                    new Date(item.date).toLocaleDateString("ru-RU")
                ),
                datasets: [
                    {
                        label: "Вовлеченность (%)",
                        data: analytics.value.engagement_data.map(
                            (item) => item.engagement
                        ),
                        borderColor: "rgb(147, 51, 234)",
                        backgroundColor: "rgba(147, 51, 234, 0.1)",
                        tension: 0.4,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false,
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 10,
                    },
                },
            },
        });
    }
};

const formatNumber = (num) => {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
};

const getContentTypeName = (type) => {
    const types = {
        text: "Текст",
        photo: "Фото",
        video: "Видео",
        document: "Документ",
        audio: "Аудио",
    };
    return types[type] || type;
};

// Обработчик обновления аналитики из Header
const refreshAnalyticsHandler = async () => {
    console.log('Refresh analytics event received');
    loading.value = true;
    if (setLoading) setLoading(true);
    
    try {
        loadChannels();
        if (selectedChannelId.value) {
            await loadChannelAnalytics();
        }
    } catch (error) {
        console.error('Error refreshing analytics:', error);
    } finally {
        loading.value = false;
        if (setLoading) setLoading(false);
    }
};

watch(refreshTrigger, () => {
    loadChannels();
});

onMounted(() => {
    loadChannels();
    
    // Слушаем событие обновления аналитики из Header
    window.addEventListener('refreshAnalytics', refreshAnalyticsHandler);
});

onUnmounted(() => {
    // Очищаем event listener
    window.removeEventListener('refreshAnalytics', refreshAnalyticsHandler);
});
</script>
