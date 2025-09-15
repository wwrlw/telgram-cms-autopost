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
            <div v-if="tableRows.length > 0" class="mt-8">
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
                    const docs = res.data || [];
                    buildTableRowsFromDaily(docs);
                    
                    // Обновляем средние значения за неделю
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
                    
                    // Обновляем analytics с новыми средними значениями
                    analytics.value = {
                        ...analytics.value,
                        views_count: avgViews,
                        avg_err: avgErr,
                    };
                    
                    console.log('Weekly averages calculation:', {
                        availableDays,
                        avgViews,
                        avgErr
                    });
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

// Экспортируем функции для использования в template
defineExpose({
    subscriberChange
});
</script>
