<template>
    <div class="mb-6">
        <div :class="gridClasses">
            <div
                v-for="stat in computedStats"
                :key="stat.key"
                class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-3"
            >
                <div
                    class="flex-shrink-0"
                    :class="stat.iconBg ? 'p-2.5 rounded-xl' : ''"
                    :style="stat.iconBg ? { backgroundColor: '' } : {}"
                >
                    <div
                        v-if="stat.iconBg"
                        :class="`inline-flex items-center justify-center rounded-xl ${stat.iconBg} bg-opacity-90`"
                    >
                        <svg
                            class="w-4 h-4 text-white"
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
                        :class="`h-5 w-5 ${stat.iconColor || 'text-gray-400'}`"
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
                <div class="flex-1 min-w-0">
                    <p class="text-xs text-gray-500 font-medium truncate">
                        {{ stat.label }}
                    </p>
                    <p class="text-2xl font-semibold text-gray-900 leading-tight">
                        {{ stat.value }}
                    </p>
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
    todayCount: {
        type: Number,
        default: 0,
    },
    activeCount: {
        type: Number,
        default: 0,
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
            getValue: (totalCount) => totalCount,
        },
        {
            key: "unique",
            label: "Уникальные",
            iconPath: "M5 13l4 4L19 7",
            iconBg: "bg-green-500",
            getValue: (totalCount, data) =>
                data.filter((post) => post.is_unique).length,
        },
        {
            key: "today",
            label: "За сегодня",
            iconPath: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
            iconBg: "bg-yellow-500",
            getValue: (totalCount, data, todayCount) => todayCount,
        },
    ],
    channels: [
        {
            key: "total",
            label: "Всего каналов",
            iconPath:
                "M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V3a1 1 0 011 1v10.586l2.707 2.707A1 1 0 0119 19H5a1 1 0 01-.707-1.707L7 14.586V4z",
            iconColor: "text-gray-400",
            getValue: (totalCount) => totalCount,
        },
        {
            key: "active",
            label: "Активных каналов",
            iconPath: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
            iconColor: "text-green-400",
            getValue: (totalCount, data, activeCount) => activeCount,
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
            getValue: (totalCount) => totalCount,
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
    const thirdArg =
        props.type === "posts" ? props.todayCount : props.activeCount;
    return config.map((stat) => ({
        ...stat,
        value: stat.getValue(props.totalCount, props.data, thirdArg),
    }));
});
</script>
