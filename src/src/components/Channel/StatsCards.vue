<template>
    <div class="mb-6">
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div class="bg-white overflow-hidden shadow rounded-lg">
                <div class="p-5">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <svg
                                class="h-6 w-6 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V3a1 1 0 011 1v10.586l2.707 2.707A1 1 0 0119 19H5a1 1 0 01-.707-1.707L7 14.586V4z"
                                />
                            </svg>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                            <dl>
                                <dt
                                    class="text-sm font-medium text-gray-500 truncate"
                                >
                                    Всего каналов
                                </dt>
                                <dd class="text-lg font-medium text-gray-900">
                                    {{ totalCount }}
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white overflow-hidden shadow rounded-lg">
                <div class="p-5">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <svg
                                class="h-6 w-6 text-green-400"
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
                        </div>
                        <div class="ml-5 w-0 flex-1">
                            <dl>
                                <dt
                                    class="text-sm font-medium text-gray-500 truncate"
                                >
                                    Активных каналов
                                </dt>
                                <dd class="text-lg font-medium text-gray-900">
                                    {{ activeChannels }}
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white overflow-hidden shadow rounded-lg">
                <div class="p-5">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <svg
                                class="h-6 w-6 text-blue-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                            <dl>
                                <dt
                                    class="text-sm font-medium text-gray-500 truncate"
                                >
                                    Недавно добавлены
                                </dt>
                                <dd class="text-lg font-medium text-gray-900">
                                    {{ recentChannels }}
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
    channels: {
        type: Array,
        default: () => [],
    },
});

const activeChannels = computed(() => {
    // Все каналы считаем активными
    return props.channels.length;
});

const recentChannels = computed(() => {
    // Каналы добавленные за последние 24 часа
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return props.channels.filter(
        (channel) => new Date(channel.created_at) > oneDayAgo
    ).length;
});
</script>
