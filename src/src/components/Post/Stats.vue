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

        <div class="space-y-3 mb-6">
            <div v-if="originalUrl || isPrivate" class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Оригинал поста:</span>
                <template v-if="isPrivate">
                    <span class="text-sm font-medium text-gray-900">Приватный канал</span>
                </template>
                <template v-else>
                    <a
                        :href="originalUrl"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-sm font-medium text-blue-600 hover:underline truncate max-w-40 text-right"
                        title="Открыть оригинал поста"
                    >
                        {{ originalUrl }}
                    </a>
                </template>
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
                        <LucideEye class="w-4 h-4 text-blue-600" />
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
                        <LucideThumbsUp class="w-4 h-4 text-green-600" />
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
                        <LucideMessageCircle class="w-4 h-4 text-purple-600" />
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
                        <LucideShare2 class="w-4 h-4 text-orange-600" />
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
                <LucideCheckCircle class="w-4 h-4 text-green-600" />
                <span class="text-sm text-green-700 font-medium"
                    >Уникальный контент</span
                >
            </div>

            <div v-if="postData?.is_published" class="flex items-center gap-2">
                <LucideCheckCircle class="w-4 h-4 text-blue-600" />
                <span class="text-sm text-blue-700 font-medium"
                    >Опубликован</span
                >
            </div>

            <div
                v-if="postData?.media && postData.media.length > 0"
                class="flex items-center gap-2"
            >
                <LucideImage class="w-4 h-4 text-purple-600" />
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
import {
    LucideEye,
    LucideMessageCircle,
    LucideShare2,
    LucideThumbsUp,
    LucideImage,
    LucideCheckCircle,
} from "lucide-vue-next";

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

// Ссылка на оригинал из поля posts.url, если канал публичный
const originalUrl = computed(() => {
    const url = props.postData?.url || "";
    if (!url) return "";
    // Если url уже полноценная ссылка — возвращаем как есть
    if (/^https?:\/\//i.test(url)) return url;
    // Если у поста есть username канала — формируем ссылку на t.me
    const username = props.postData?.channel_username || props.postData?.source_channel || "";
    if (username && /^@?\w+$/i.test(username)) {
        const clean = username.replace(/^@/,'');
        // Если url похож на message_id — формируем ссылку t.me/<channel>/<id>
        if (/^\d+$/.test(url)) {
            return `https://t.me/${clean}/${url}`;
        }
    }
    // Иначе показываем как есть (мог быть сохранён относительный или внешний путь)
    return url;
});

// Признак приватного канала: ссылки вида t.me/c/<id>/... или отсутствие username при числовом message_id
const isPrivate = computed(() => {
    const url = props.postData?.url || "";
    if (!url) return false;
    // Явные признаки приватного:
    // 1) t.me/c/<channelId>/...
    if (/^https?:\/\/t\.me\/c\//i.test(url)) return true;
    // 2) t.me/<numericChannelId>/<message_id>
    if (/^https?:\/\/t\.me\/\d+\/\d+/i.test(url)) return true;
    // Если url — число (message_id), но нет username/source_channel — считаем приватным
    const hasUsername = !!(props.postData?.channel_username || props.postData?.source_channel);
    if (!hasUsername && /^\d+$/.test(url)) return true;
    return false;
});
</script>
