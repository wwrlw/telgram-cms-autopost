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

            <div class="space-y-8 px-8 py-8">
                <div class="overflow-hidden">
                    <div class="px-4 py-5 sm:p-6">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div class="bg-blue-50 p-4 rounded-lg">
                                <div class="text-sm font-medium text-blue-600">
                                    Подписчиков
                                </div>
                                <div class="text-2xl font-bold text-blue-900">
                                    {{ analytics?.subscribers_count || 0 }}
                                </div>
                                <div 
                                    v-if="subscriberChange !== 0"
                                    :class="{
                                        'text-green-600': subscriberChange > 0,
                                        'text-red-600': subscriberChange < 0
                                    }"
                                    class="text-sm font-medium mt-1 flex items-center"
                                >
                                    <svg 
                                        v-if="subscriberChange > 0"
                                        class="w-4 h-4 mr-1" 
                                        fill="currentColor" 
                                        viewBox="0 0 20 20"
                                    >
                                        <path fill-rule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                                    </svg>
                                    <svg 
                                        v-else-if="subscriberChange < 0"
                                        class="w-4 h-4 mr-1" 
                                        fill="currentColor" 
                                        viewBox="0 0 20 20"
                                    >
                                        <path fill-rule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                    </svg>
                                    {{ subscriberChange > 0 ? '+' : '' }}{{ formatNumber(subscriberChange) }} за неделю
                                </div>
                            </div>
                            <div class="bg-yellow-50 p-4 rounded-lg">
                                <div
                                    class="text-sm font-medium text-yellow-600"
                                >
                                    Средние просмотры
                                </div>
                                <div class="text-2xl font-bold text-yellow-900">
                                    {{ (analytics?.views_count || 0) }}
                                </div>
                            </div>
                            <div class="bg-purple-50 p-4 rounded-lg">
                                <div
                                    class="text-sm font-medium text-purple-600"
                                >
                                    Средний ERR%
                                </div>
                                <div class="text-2xl font-bold text-purple-900">
                                    {{ (analytics?.err || 0).toFixed(2) }}%
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
                                            <div class="flex items-center space-x-2">
                                                <span>{{ formatNumber(row.subscribers) }}</span>
                                                <span
                                                    v-if="row.subscriberChange !== 0"
                                                    :class="{
                                                        'text-green-600': row.subscriberChange > 0,
                                                        'text-red-600': row.subscriberChange < 0
                                                    }"
                                                    class="text-xs font-medium flex items-center"
                                                >
                                                    <svg 
                                                        v-if="row.subscriberChange > 0"
                                                        class="w-3 h-3 mr-1" 
                                                        fill="currentColor" 
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path fill-rule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                                                    </svg>
                                                    <svg 
                                                        v-else-if="row.subscriberChange < 0"
                                                        class="w-3 h-3 mr-1" 
                                                        fill="currentColor" 
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path fill-rule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                                    </svg>
                                                    {{ row.subscriberChange > 0 ? '+' : '' }}{{ formatNumber(row.subscriberChange) }}
                                                </span>
                                            </div>
                                        </td>
                                        <td
                                            class="px-4 py-2 whitespace-nowrap text-sm text-gray-900"
                                        >
                                            <div class="flex items-center space-x-2">
                                                <span>{{ formatNumber(row.views) }}</span>
                                                <span
                                                    v-if="row.viewsChange !== 0"
                                                    :class="{
                                                        'text-green-600': row.viewsChange > 0,
                                                        'text-red-600': row.viewsChange < 0
                                                    }"
                                                    class="text-xs font-medium flex items-center"
                                                >
                                                    <svg 
                                                        v-if="row.viewsChange > 0"
                                                        class="w-3 h-3 mr-1" 
                                                        fill="currentColor" 
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path fill-rule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                                                    </svg>
                                                    <svg 
                                                        v-else-if="row.viewsChange < 0"
                                                        class="w-3 h-3 mr-1" 
                                                        fill="currentColor" 
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path fill-rule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                                    </svg>
                                                    {{ row.viewsChange > 0 ? '+' : '' }}{{ formatNumber(row.viewsChange) }}
                                                </span>
                                            </div>
                                        </td>
                                        <td
                                            class="px-4 py-2 whitespace-nowrap text-sm text-gray-900"
                                        >
                                            <div class="flex items-center space-x-2">
                                                <span>{{ (row.err || 0).toFixed(2) }}%</span>
                                                <span
                                                    v-if="row.errChange !== 0"
                                                    :class="{
                                                        'text-green-600': row.errChange > 0,
                                                        'text-red-600': row.errChange < 0
                                                    }"
                                                    class="text-xs font-medium flex items-center"
                                                >
                                                    <svg 
                                                        v-if="row.errChange > 0"
                                                        class="w-3 h-3 mr-1" 
                                                        fill="currentColor" 
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path fill-rule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                                                    </svg>
                                                    <svg 
                                                        v-else-if="row.errChange < 0"
                                                        class="w-3 h-3 mr-1" 
                                                        fill="currentColor" 
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path fill-rule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                                    </svg>
                                                    {{ row.errChange > 0 ? '+' : '' }}{{ row.errChange.toFixed(2) }}%
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <!-- График трендов за период -->
            <div class="mt-8">
                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">
                        Динамика показателей за {{ Math.min(tableRows.length, 7) }} дней
                    </h3>
                    
                    <!-- Простой график трендов -->
                    <div class="relative h-80">
                        <svg 
                            class="w-full h-full" 
                            viewBox="0 0 700 280"
                            preserveAspectRatio="xMidYMid meet"
                        >
                            <!-- Сетка -->
                            <defs>
                                <pattern id="grid" width="100" height="40" patternUnits="userSpaceOnUse">
                                    <path d="M 100 0 L 0 0 0 40" fill="none" stroke="#f3f4f6" stroke-width="1"/>
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#grid)" />
                            
                            <!-- График подписчиков (синяя линия) -->
                            <polyline
                                v-if="tableRows.length > 1"
                                :points="tableRows.slice(0, Math.min(tableRows.length, 7)).reverse().map((row, index) => {
                                    const values = tableRows.slice(0, Math.min(tableRows.length, 7)).reverse().map(r => r.subscribers);
                                    const maxVal = Math.max(...values);
                                    const minVal = Math.min(...values);
                                    const range = maxVal - minVal || 1;
                                    const x = (index * 500) / (Math.min(tableRows.length, 7) - 1) + 80;
                                    const y = 200 - (((row.subscribers - minVal) / range) * 140);
                                    return `${x},${y}`;
                                }).join(' ')"
                                fill="none"
                                stroke="#3b82f6"
                                stroke-width="3"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                            
                            <!-- График просмотров (оранжевая линия) -->
                            <polyline
                                v-if="tableRows.length > 1"
                                :points="tableRows.slice(0, Math.min(tableRows.length, 7)).reverse().map((row, index) => {
                                    const values = tableRows.slice(0, Math.min(tableRows.length, 7)).reverse().map(r => r.views);
                                    const maxVal = Math.max(...values);
                                    const minVal = Math.min(...values);
                                    const range = maxVal - minVal || 1;
                                    const x = (index * 500) / (Math.min(tableRows.length, 7) - 1) + 80;
                                    const y = 200 - (((row.views - minVal) / range) * 140);
                                    return `${x},${y}`;
                                }).join(' ')"
                                fill="none"
                                stroke="#f59e0b"
                                stroke-width="3"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                            
                            <!-- Точки данных для подписчиков -->
                            <g v-for="(row, index) in tableRows.slice(0, Math.min(tableRows.length, 7)).reverse()" :key="'subs-' + index">
                                <circle
                                    :cx="(index * 500) / (Math.min(tableRows.length, 7) - 1) + 80"
                                    :cy="200 - (((row.subscribers - Math.min(...tableRows.slice(0, Math.min(tableRows.length, 7)).reverse().map(r => r.subscribers))) / (Math.max(...tableRows.slice(0, Math.min(tableRows.length, 7)).reverse().map(r => r.subscribers)) - Math.min(...tableRows.slice(0, Math.min(tableRows.length, 7)).reverse().map(r => r.subscribers)) || 1)) * 140)"
                                    r="4"
                                    fill="#3b82f6"
                                />
                                <!-- Значения подписчиков -->
                                <text
                                    :x="(index * 500) / (Math.min(tableRows.length, 7) - 1) + 80 - 40"
                                    :y="200 - (((row.subscribers - Math.min(...tableRows.slice(0, Math.min(tableRows.length, 7)).reverse().map(r => r.subscribers))) / (Math.max(...tableRows.slice(0, Math.min(tableRows.length, 7)).reverse().map(r => r.subscribers)) - Math.min(...tableRows.slice(0, Math.min(tableRows.length, 7)).reverse().map(r => r.subscribers)) || 1)) * 140) - 8"
                                    text-anchor="middle"
                                    class="text-xs fill-blue-600"
                                    font-size="10"
                                    font-weight="bold"
                                >
                                    {{ formatNumber(row.subscribers) }}
                                </text>
                            </g>
                            
                            <!-- Точки данных для просмотров -->
                            <g v-for="(row, index) in tableRows.slice(0, Math.min(tableRows.length, 7)).reverse()" :key="'views-' + index">
                                <circle
                                    :cx="(index * 500) / (Math.min(tableRows.length, 7) - 1) + 80"
                                    :cy="200 - (((row.views - Math.min(...tableRows.slice(0, Math.min(tableRows.length, 7)).reverse().map(r => r.views))) / (Math.max(...tableRows.slice(0, Math.min(tableRows.length, 7)).reverse().map(r => r.views)) - Math.min(...tableRows.slice(0, Math.min(tableRows.length, 7)).reverse().map(r => r.views)) || 1)) * 140)"
                                    r="4"
                                    fill="#f59e0b"
                                />
                                <!-- Значения просмотров -->
                                <text
                                    :x="(index * 500) / (Math.min(tableRows.length, 7) - 1) + 80 + 40"
                                    :y="200 - (((row.views - Math.min(...tableRows.slice(0, Math.min(tableRows.length, 7)).reverse().map(r => r.views))) / (Math.max(...tableRows.slice(0, Math.min(tableRows.length, 7)).reverse().map(r => r.views)) - Math.min(...tableRows.slice(0, Math.min(tableRows.length, 7)).reverse().map(r => r.views)) || 1)) * 140) + 15"
                                    text-anchor="middle"
                                    class="text-xs fill-orange-600"
                                    font-size="10"
                                    font-weight="bold"
                                >
                                    {{ formatNumber(row.views) }}
                                </text>
                            </g>
                            
                            <!-- Подписи дат -->
                            <g v-for="(row, index) in tableRows.slice(0, Math.min(tableRows.length, 7)).reverse()" :key="'date-' + index">
                                <text
                                    :x="(index * 500) / (Math.min(tableRows.length, 7) - 1) + 80"
                                    y="240"
                                    text-anchor="middle"
                                    class="text-xs fill-gray-600"
                                    font-size="11"
                                    font-weight="bold"
                                >
                                    {{ new Date(row.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) }}
                                </text>
                            </g>
                            
                            <!-- Оси -->
                            <line x1="80" y1="200" x2="580" y2="200" stroke="#374151" stroke-width="2"/>
                            <line x1="80" y1="60" x2="80" y2="200" stroke="#374151" stroke-width="2"/>
                            
                            <!-- Подписи осей -->
                            <text x="330" y="270" text-anchor="middle" class="text-sm fill-gray-700" font-size="12" font-weight="bold">
                                Дата
                            </text>
                            <text x="20" y="130" text-anchor="middle" class="text-sm fill-gray-700" font-size="12" font-weight="bold" transform="rotate(-90 20 130)">
                                Значения
                            </text>
                        </svg>
                        
                        <!-- Легенда -->
                        <div class="absolute top-2 right-2 bg-white rounded-lg shadow p-3">
                            <div class="flex flex-col space-y-2 text-xs">
                                <div class="flex items-center">
                                    <div class="w-4 h-1 bg-blue-500 mr-2"></div>
                                    <span class="text-gray-700 font-medium">Подписчики</span>
                                </div>
                                <div class="flex items-center">
                                    <div class="w-4 h-1 bg-orange-500 mr-2"></div>
                                    <span class="text-gray-700 font-medium">Просмотры</span>
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
import { ref, onMounted, onUnmounted, inject, watch, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ChevronLeft } from "lucide-vue-next";
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
        http.getAnalyticsDaily(
            channelId.value,
            { limit: 60 },
            (res) => {
                if (res.success) {
                    const docs = res.data || [];
                    buildTableRowsFromDaily(docs);
                    
                    // Берем данные из последнего (самого свежего) дня для подписчиков
                    const latestDoc = docs[0] || {};
                    
                    // Вычисляем средние значения за последние 7 дней (или за доступный период)
                    const availableDays = Math.min(docs.length, 7);
                    const recentDocs = docs.slice(0, availableDays);
                    
                    const avgViews = Math.round(recentDocs.reduce((sum, doc) => {
                        return sum + (doc.views_day || doc.views || 0);
                    }, 0) / availableDays);
                    
                    // Рассчитываем средний ERR% как среднее арифметическое от (просмотры / подписчики) * 100
                    const avgErr = recentDocs.reduce((sum, doc) => {
                        const views = doc.views_day || doc.views || 0;
                        const subscribers = doc.subscribers_count || 0;
                        const err = subscribers > 0 ? (views / subscribers) * 100 : 0;
                        return sum + err;
                    }, 0) / availableDays;
                    
                    console.log('Weekly averages calculation:', {
                        availableDays,
                        recentDocs: recentDocs.map(d => ({
                            date: d.date,
                            views: d.views_day || d.views || 0,
                            err: d.err_day || d.err || d.er_day || d.er || 0
                        })),
                        avgViews,
                        avgErr
                    });
                    
                    analytics.value = {
                        subscribers_count: latestDoc.subscribers_count || 0,
                        views_count: avgViews,
                        err: avgErr,
                    };
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
    const rows = (docs || []).map((d, index) => {
        const currentSubscribers = d.subscribers_count || 0;
        const currentViews = d.views_day || d.views || 0;
        
        // Вычисляем изменение подписчиков по сравнению со следующим днем (снизу вверх)
        let subscriberChange = 0;
        if (index < docs.length - 1) {
            const nextDoc = docs[index + 1];
            subscriberChange = currentSubscribers - (nextDoc.subscribers_count || 0);
        }
        
        // Вычисляем изменение просмотров по сравнению со следующим днем (снизу вверх)
        let viewsChange = 0;
        if (index < docs.length - 1) {
            const nextDoc = docs[index + 1];
            const nextViews = nextDoc.views_day || nextDoc.views || 0;
            viewsChange = currentViews - nextViews;
        }
        
        // Рассчитываем ERR% как (просмотры / подписчики) * 100
        const currentErr = currentSubscribers > 0 ? (currentViews / currentSubscribers) * 100 : 0;
        
        // Вычисляем изменение ERR по сравнению со следующим днем (снизу вверх)
        let errChange = 0;
        if (index < docs.length - 1) {
            const nextDoc = docs[index + 1];
            const nextViews = nextDoc.views_day || nextDoc.views || 0;
            const nextSubscribers = nextDoc.subscribers_count || 0;
            const nextErr = nextSubscribers > 0 ? (nextViews / nextSubscribers) * 100 : 0;
            errChange = currentErr - nextErr;
        }
        
        return {
            date: d.date,
            subscribers: currentSubscribers,
            subscriberChange: subscriberChange,
            views: currentViews,
            viewsChange: viewsChange,
            err: currentErr,
            errChange: errChange,
        };
    });
    tableRows.value = rows.sort((a, b) => new Date(b.date) - new Date(a.date));
};

const subscriberChange = computed(() => {
    console.log('Calculating subscriber change, total rows:', tableRows.value.length);
    
    if (tableRows.value.length < 2) {
        console.log('Not enough data for change calculation (need at least 2 days)');
        return 0;
    }
    
    const latestRow = tableRows.value[0]; // Первый элемент после сортировки по убыванию
    
    // Если есть данные за неделю (8+ дней), сравниваем с неделей назад
    if (tableRows.value.length >= 8) {
        const weekAgoRow = tableRows.value[7]; // 7-й элемент (7 дней назад)
        const change = (latestRow.subscribers || 0) - (weekAgoRow.subscribers || 0);
        
        console.log('Weekly change calculation:', {
            latest: latestRow.subscribers,
            weekAgo: weekAgoRow.subscribers,
            change: change,
            latestDate: latestRow.date,
            weekAgoDate: weekAgoRow.date
        });
        
        return change;
    } else {
        // Если данных меньше недели, сравниваем с самым старым днем (исключаем первичные данные)
        const oldestRow = tableRows.value[tableRows.value.length - 1];
        const change = (latestRow.subscribers || 0) - (oldestRow.subscribers || 0);
        
        console.log('Limited period change calculation:', {
            latest: latestRow.subscribers,
            oldest: oldestRow.subscribers,
            change: change,
            latestDate: latestRow.date,
            oldestDate: oldestRow.date,
            totalDays: tableRows.value.length
        });
        
        return change;
    }
});


const refreshAnalyticsHandler = async () => {
    console.log("Refresh analytics event received");
    await loadChannelAnalytics();
};

watch(refreshTrigger, () => {
    loadChannelInfo();
});

watch(
    () => route.params.id,
    (newId) => {
        if (newId) {
            channelId.value = newId;
            loadChannelInfo();
            loadChannelAnalytics();
        }
    }
);

onMounted(() => {
    loadChannelInfo();
    loadChannelAnalytics();
    window.addEventListener("refreshAnalytics", refreshAnalyticsHandler);
});

onUnmounted(() => {
    window.removeEventListener("refreshAnalytics", refreshAnalyticsHandler);
});

// Экспортируем функции для использования в template
defineExpose({
    subscriberChange
});
</script>
