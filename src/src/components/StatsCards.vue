<template>
    <div class="mb-6">
        <div :class="gridClasses">
            <div
                v-for="stat in computedStats"
                :key="stat.key"
                class="bg-white overflow-hidden shadow rounded-lg"
            >
                <div class="p-5">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <div
                                v-if="stat.iconBg"
                                :class="`w-8 h-8 ${stat.iconBg} rounded-md flex items-center justify-center`"
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
                                        :d="stat.iconPath"
                                    />
                                </svg>
                            </div>
                            <svg
                                v-else
                                :class="`h-6 w-6 ${stat.iconColor || 'text-gray-400'}`"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    :d="stat.iconPath"
                                />
                            </svg>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                            <dl>
                                <dt
                                    class="text-sm font-medium text-gray-500 truncate"
                                >
                                    {{ stat.label }}
                                </dt>
                                <dd class="text-lg font-medium text-gray-900">
                                    {{ stat.value }}
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
    totalCount: {
        type: Number,
        default: 0,
    },
    data: {
        type: Array,
        default: () => [],
    },
    type: {
        type: String,
        required: true,
        validator: (value) =>
            ["posts", "channels", "categories"].includes(value),
    },
    stats: {
        type: Object,
        default: () => ({
            total: 0,
            unique: 0,
            today: 0
        }),
    },
});

const gridClasses = computed(() => {
    const baseClasses = "grid grid-cols-1 gap-5";
    switch (props.type) {
        case "posts":
            return `${baseClasses} sm:grid-cols-3`;
        case "channels":
            return `${baseClasses} sm:grid-cols-2 lg:grid-cols-3`;
        case "categories":
            return `${baseClasses} sm:grid-cols-2 lg:grid-cols-4`;
        default:
            return `${baseClasses} sm:grid-cols-3`;
    }
});

const statsConfig = {
    posts: [
        {
            key: "total",
            label: "Всего постов",
            iconPath:
                "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
            iconBg: "bg-indigo-500",
            getValue: (totalCount, data, stats) => stats.total,
        },
        {
            key: "unique",
            label: "Уникальные",
            iconPath: "M5 13l4 4L19 7",
            iconBg: "bg-green-500",
            getValue: (totalCount, data, stats) => stats.unique,
        },
        {
            key: "today",
            label: "За сегодня",
            iconPath: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
            iconBg: "bg-yellow-500",
            getValue: (totalCount, data, stats) => stats.today,
        },
    ],
    channels: [
        {
            key: "total",
            label: "Всего каналов",
            iconPath:
                "M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V3a1 1 0 011 1v10.586l2.707 2.707A1 1 0 0119 19H5a1 1 0 01-.707-1.707L7 14.586V4z",
            iconColor: "text-gray-400",
            getValue: (totalCount, data) => totalCount,
        },
        {
            key: "active",
            label: "Активных каналов",
            iconPath: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
            iconColor: "text-green-400",
            getValue: (totalCount, data) => data.length,
        },
        {
            key: "recent",
            label: "Недавно добавлены",
            iconPath: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
            iconColor: "text-blue-400",
            getValue: (totalCount, data) => {
                const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                return data.filter(
                    (channel) => new Date(channel.created_at) > oneDayAgo
                ).length;
            },
        },
    ],
    categories: [
        {
            key: "total",
            label: "Всего категорий",
            iconPath:
                "M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V3a1 1 0 011 1v10.586l2.707 2.707A1 1 0 0119 19H5a1 1 0 01-.707-1.707L7 14.586V4z",
            iconColor: "text-gray-400",
            getValue: (totalCount, data) => totalCount,
        },
        {
            key: "active",
            label: "Активные",
            iconPath: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
            iconColor: "text-green-400",
            getValue: (totalCount, data) =>
                data.filter((category) => category.is_active).length,
        },
        {
            key: "inactive",
            label: "Неактивные",
            iconPath:
                "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728",
            iconColor: "text-gray-400",
            getValue: (totalCount, data) =>
                data.filter((category) => !category.is_active).length,
        },
        {
            key: "withDescription",
            label: "С описанием",
            iconPath:
                "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
            iconColor: "text-blue-400",
            getValue: (totalCount, data) =>
                data.filter(
                    (category) =>
                        category.description && category.description.trim()
                ).length,
        },
    ],
};

const computedStats = computed(() => {
    const config = statsConfig[props.type] || [];
    return config.map((stat) => ({
        ...stat,
        value: stat.getValue(props.totalCount, props.data, props.stats),
    }));
});
</script>
