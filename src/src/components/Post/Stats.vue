<template>
    <div class="min-h-64 max-w-64 p-4 rounded-md bg-white shadow-sm">
        <h3 class="text-sm font-semibold mb-4 text-gray-700">
            Статистика поста
        </h3>

        <div class="space-y-3 mb-6">
            <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Создан:</span>
                <span class="text-sm font-medium text-gray-900">
                    {{ formatDate(postData?.created_at) }}
                </span>
            </div>

            <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Обновлён:</span>
                <span class="text-sm font-medium text-gray-900">
                    {{ formatDate(postData?.updated_at) }}
                </span>
            </div>

            <div
                v-if="postData?.timestamp"
                class="flex items-center justify-between"
            >
                <span class="text-sm text-gray-600"
                    >Опубликован в Telegram:</span
                >
                <span class="text-sm font-medium text-gray-900">
                    {{ formatDate(postData.timestamp) }}
                </span>
            </div>

            <div
                v-if="postData?.scheduled_at"
                class="flex items-center justify-between"
            >
                <span class="text-sm text-gray-600">Запланирован на:</span>
                <span class="text-sm font-medium text-gray-900">
                    {{ formatDate(postData.scheduled_at) }}
                </span>
            </div>

            <div
                v-if="postData?.published_at"
                class="flex items-center justify-between"
            >
                <span class="text-sm text-gray-600"
                    >Опубликован на канале:</span
                >
                <span class="text-sm font-medium text-gray-900">
                    {{ formatDate(postData.published_at) }}
                </span>
            </div>
        </div>

        <div v-if="hasConversionMetrics" class="space-y-4">
            <h4 class="text-sm font-semibold text-gray-700 border-t pt-4">
                Метрики конверсии
            </h4>

            <div class="flex flex-col gap-3">
                <div
                    v-if="postData.conversion_metrics?.views !== undefined"
                    class="bg-blue-50 p-3 rounded-lg"
                >
                    <div class="flex items-center gap-2">
                        <svg
                            class="w-4 h-4 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                        </svg>
                        <span class="text-xs text-blue-600 font-medium"
                            >Просмотры</span
                        >
                    </div>
                    <div class="text-lg font-bold text-blue-900 mt-1">
                        {{ formatNumber(postData.conversion_metrics.views) }}
                    </div>
                </div>

                <div
                    v-if="postData.conversion_metrics?.reactions !== undefined"
                    class="bg-green-50 p-3 rounded-lg"
                >
                    <div class="flex items-center gap-2">
                        <svg
                            class="w-4 h-4 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <span class="text-xs text-green-600 font-medium"
                            >Реакции</span
                        >
                    </div>
                    <div class="text-lg font-bold text-green-900 mt-1">
                        {{
                            formatNumber(postData.conversion_metrics.reactions)
                        }}
                    </div>
                </div>

                <div
                    v-if="postData.conversion_metrics?.comments !== undefined"
                    class="bg-purple-50 p-3 rounded-lg"
                >
                    <div class="flex items-center gap-2">
                        <svg
                            class="w-4 h-4 text-purple-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                        </svg>
                        <span class="text-xs text-purple-600 font-medium"
                            >Комментарии</span
                        >
                    </div>
                    <div class="text-lg font-bold text-purple-900 mt-1">
                        {{ formatNumber(postData.conversion_metrics.comments) }}
                    </div>
                </div>

                <div
                    v-if="postData.conversion_metrics?.forwards !== undefined"
                    class="bg-orange-50 p-3 rounded-lg"
                >
                    <div class="flex items-center gap-2">
                        <svg
                            class="w-4 h-4 text-orange-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                            />
                        </svg>
                        <span class="text-xs text-orange-600 font-medium"
                            >Пересылки</span
                        >
                    </div>
                    <div class="text-lg font-bold text-orange-900 mt-1">
                        {{ formatNumber(postData.conversion_metrics.forwards) }}
                    </div>
                </div>
            </div>

            <div v-if="hasEfficiencyMetrics" class="space-y-3">
                <h5
                    class="text-xs font-semibold text-gray-600 uppercase tracking-wide"
                >
                    Показатели эффективности
                </h5>

                <div class="grid grid-cols-2 gap-3">
                    <div
                        v-if="postData.conversion_metrics?.er !== undefined"
                        class="bg-emerald-50 p-3 rounded-lg"
                    >
                        <div class="text-center">
                            <div
                                class="text-xs text-emerald-600 font-medium mb-1"
                            >
                                ER (Engagement Rate)
                            </div>
                            <div class="text-lg font-bold text-emerald-900">
                                {{ postData.conversion_metrics.er }}%
                            </div>
                            <div class="text-xs text-emerald-500">
                                Реакции/Просмотры
                            </div>
                        </div>
                    </div>

                    <div
                        v-if="postData.conversion_metrics?.err !== undefined"
                        class="bg-indigo-50 p-3 rounded-lg"
                    >
                        <div class="text-center">
                            <div
                                class="text-xs text-indigo-600 font-medium mb-1"
                            >
                                ERR (Exposure Rate)
                            </div>
                            <div class="text-lg font-bold text-indigo-900">
                                {{ postData.conversion_metrics.err }}%
                            </div>
                            <div class="text-xs text-indigo-500">
                                Просмотры/Подписчики
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="space-y-3 mt-6 pt-4 border-t">
            <div v-if="postData?.is_unique" class="flex items-center gap-2">
                <svg
                    class="w-4 h-4 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
                <span class="text-sm text-green-700 font-medium"
                    >Уникальный контент</span
                >
            </div>

            <div v-if="postData?.is_published" class="flex items-center gap-2">
                <svg
                    class="w-4 h-4 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 13l4 4L19 7"
                    />
                </svg>
                <span class="text-sm text-blue-700 font-medium"
                    >Опубликован</span
                >
            </div>

            <div
                v-if="postData?.media && postData.media.length > 0"
                class="flex items-center gap-2"
            >
                <svg
                    class="w-4 h-4 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                </svg>
                <span class="text-sm text-purple-700 font-medium">
                    {{ postData.media.length }}
                    {{ getMediaCountText(postData.media.length) }}
                </span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from "vue";
import { formatDate, formatNumber } from "@/js/utils";

const props = defineProps({
    postData: {
        type: Object,
    },
});

const hasConversionMetrics = computed(() => {
    return (
        props.postData?.conversion_metrics &&
        Object.keys(props.postData.conversion_metrics).length > 0
    );
});

const hasEfficiencyMetrics = computed(() => {
    return (
        props.postData?.conversion_metrics?.er !== undefined ||
        props.postData?.conversion_metrics?.err !== undefined
    );
});

const getMediaCountText = (count) => {
    if (count === 1) return "медиафайл";
    if (count >= 2 && count <= 4) return "медиафайла";
    return "медиафайлов";
};
</script>
