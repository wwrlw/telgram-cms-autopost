<template>
    <div class="flex-1 p-6 bg-gray-50 overflow-auto">
        <div class="max-w-7xl mx-auto">
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900">
                        Системные логи
                    </h1>
                    <div class="text-sm text-gray-600 mt-1">
                        <p v-if="selectedUserId">
                            Фильтр:
                            <span v-if="usersLoading" class="text-gray-400"
                                >Загрузка...</span
                            >
                            <span v-else>
                                {{
                                    users.find((u) => u._id === selectedUserId)
                                        ?.username || "Неизвестный пользователь"
                                }}
                            </span>
                        </p>
                        <p>
                            Сортировка:
                            {{
                                sortOrder === "desc"
                                    ? "Сначала новые"
                                    : "Сначала старые"
                            }}
                        </p>
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    <select
                        v-model="selectedUserId"
                        @change="handleFilterChange"
                        class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        :disabled="usersLoading"
                    >
                        <option value="">Все пользователи</option>
                        <option v-if="usersLoading" value="" disabled>
                            Загрузка пользователей...
                        </option>
                        <option
                            v-else
                            v-for="user in users"
                            :key="user._id"
                            :value="user._id"
                        >
                            {{ user.username }}
                        </option>
                    </select>
                    <select
                        v-model="sortOrder"
                        @change="handleFilterChange"
                        class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="desc">Сначала новые</option>
                        <option value="asc">Сначала старые</option>
                    </select>
                    <button
                        v-if="selectedUserId"
                        @click="clearFilter"
                        class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 flex items-center gap-2"
                    >
                        <svg
                            class="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                        Сбросить фильтр
                    </button>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow overflow-hidden">
                <!-- Loading indicator -->
                <div
                    v-if="loading && logs.length === 0"
                    class="flex justify-center py-8"
                >
                    <LoadingSpinner size="medium" text="Загружаем логи..." />
                </div>

                <div
                    v-else-if="!loading && logs.length === 0"
                    class="flex justify-center py-8"
                >
                    <div class="text-center">
                        <div class="text-gray-400 mb-2">
                            <svg
                                class="mx-auto h-12 w-12"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                        </div>
                        <p class="text-gray-500">Логи не найдены</p>
                    </div>
                </div>

                <div v-else class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Время
                                </th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Пользователь
                                </th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Действие
                                </th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Детали
                                </th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            <tr v-for="log in sortedLogs" :key="log._id">
                                <td
                                    class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                >
                                    {{ formatDate(log.timestamp) }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div
                                        class="text-sm font-medium text-gray-900"
                                    >
                                        {{ log.username }}
                                    </div>
                                    <div class="text-sm text-gray-500">
                                        {{ log.userId }}
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span
                                        :class="getActionBadgeClass(log.method)"
                                        class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                                    >
                                        {{ log.method }}
                                    </span>
                                    <div class="text-sm text-gray-500 mt-1">
                                        {{ log.url }}
                                    </div>
                                </td>
                                <td
                                    class="px-6 py-4 whitespace-nowrap text-sm font-medium"
                                >
                                    <button
                                        @click="showLogDetails(log)"
                                        class="text-indigo-600 hover:text-indigo-900"
                                    >
                                        Показать детали
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div
                    v-if="hasMore && !loading"
                    ref="infiniteScrollTrigger"
                    class="h-20 flex items-center justify-center"
                ></div>

                <div
                    v-if="infiniteScrollLoading"
                    class="flex justify-center py-8"
                >
                    <LoadingSpinner
                        size="medium"
                        text="Загружаем еще логи..."
                    />
                </div>
            </div>
        </div>
    </div>

    <div
        v-if="showDetailsModal"
        class="fixed inset-0 bg-white/30 backdrop-blur-sm overflow-y-auto h-full w-full z-50"
    >
        <div
            class="relative top-20 mx-auto p-5 border w-3/4 max-w-4xl shadow-lg rounded-md bg-white"
        >
            <div class="mt-3">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-medium text-gray-900">
                        Детали лога
                    </h3>
                    <button
                        @click="showDetailsModal = false"
                        class="text-gray-400 hover:text-gray-600"
                    >
                        <svg
                            class="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700"
                            >Действие</label
                        >
                        <p class="mt-1 text-sm text-gray-900">
                            {{ selectedLog?.action }}
                        </p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700"
                            >URL</label
                        >
                        <p class="mt-1 text-sm text-gray-900">
                            {{ selectedLog?.url }}
                        </p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700"
                            >User Agent</label
                        >
                        <p class="mt-1 text-sm text-gray-900">
                            {{ selectedLog?.userAgent || "N/A" }}
                        </p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700"
                            >Тело запроса</label
                        >
                        <pre
                            class="mt-1 text-sm text-gray-900 bg-gray-100 p-4 rounded-md overflow-auto max-h-64"
                            >{{
                                JSON.stringify(selectedLog?.body, null, 2)
                            }}</pre
                        >
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import {
    ref,
    onMounted,
    onUnmounted,
    computed,
    watch,
    nextTick,
    inject,
} from "vue";
import { useRoute } from "vue-router";
import http from "@/js/http";
import { useInfiniteScroll } from "@/composables/useInfiniteScroll";
import LoadingSpinner from "@/components/Shared/LoadingSpinner.vue";

const route = useRoute();
const logs = ref([]);
const users = ref([]);
const selectedUserId = ref("");
const sortOrder = ref("desc");
const loading = ref(false);
const usersLoading = ref(false);
const infiniteScrollLoading = ref(false);
const hasMore = ref(true);
const showDetailsModal = ref(false);
const selectedLog = ref(null);

const setLoading = inject("setLoading", null);

const { createObserver, destroy } = useInfiniteScroll();
const infiniteScrollTrigger = ref(null);

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("ru-RU", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
};

const getActionBadgeClass = (method) => {
    switch (method) {
        case "GET":
            return "bg-green-100 text-green-800";
        case "POST":
            return "bg-blue-100 text-blue-800";
        case "PUT":
            return "bg-yellow-100 text-yellow-800";
        case "DELETE":
            return "bg-red-100 text-red-800";
        default:
            return "bg-gray-100 text-gray-800";
    }
};

const loadUsers = () => {
    return new Promise((resolve, reject) => {
        usersLoading.value = true;
        http.getAllUsers(
            (response) => {
                usersLoading.value = false;
                if (response.success) {
                    users.value = response.data;
                    resolve(response.data);
                } else {
                    console.error("Error loading users:", response.message);
                    users.value = [];
                    reject(new Error(response.message));
                }
            },
            (error) => {
                usersLoading.value = false;
                console.error("Error loading users:", error);
                users.value = [];
                reject(error);
            }
        );
    });
};

const logsService = async (params = {}, isInfiniteScroll = false) => {
    if (isInfiniteScroll) {
        infiniteScrollLoading.value = true;
    } else {
        loading.value = true;
        if (setLoading) setLoading(true);
    }

    try {
        if (
            http.logsInfiniteScroll &&
            typeof http.logsInfiniteScroll === "function"
        ) {
            const requestParams = {
                limit: params.limit || 50,
                lastId: params.lastId || undefined,
                sort: sortOrder.value,
                userId: selectedUserId.value || undefined,
            };

            Object.keys(requestParams).forEach((key) => {
                if (requestParams[key] === undefined) {
                    delete requestParams[key];
                }
            });

            const response = await new Promise((resolve, reject) => {
                http.logsInfiniteScroll(
                    requestParams,
                    (result) => {
                        if (result && result.success) {
                            resolve(result);
                        } else {
                            reject(
                                new Error(
                                    result?.message || "Failed to load logs"
                                )
                            );
                        }
                    },
                    (error) => {
                        reject(error);
                    }
                );
            });

            if (isInfiniteScroll) {
                const newLogs = response.data || [];
                logs.value = [...logs.value, ...newLogs];
                hasMore.value = response.params?.hasMore || false;
            } else {
                logs.value = response.data || [];
                hasMore.value = response.params?.hasMore || false;
            }
        } else {
            if (selectedUserId.value && selectedUserId.value !== "undefined") {
                return new Promise((resolve, reject) => {
                    http.getUserLogs(
                        selectedUserId.value,
                        1,
                        50,
                        sortOrder.value,
                        (response) => {
                            if (response.success) {
                                logs.value = response.data || [];
                                hasMore.value = false;
                                resolve(response.data);
                            } else {
                                logs.value = [];
                                hasMore.value = false;
                                reject(
                                    new Error(
                                        response.message ||
                                            "Failed to load user logs"
                                    )
                                );
                            }
                        },
                        (error) => {
                            console.error("Error loading user logs:", error);
                            reject(error);
                        }
                    );
                });
            } else {
                return new Promise((resolve, reject) => {
                    http.getLogs(
                        1,
                        50,
                        sortOrder.value,
                        (response) => {
                            if (response.success) {
                                logs.value = response.data || [];
                                hasMore.value = false;
                                resolve(response.data);
                            } else {
                                logs.value = [];
                                hasMore.value = false;
                                reject(
                                    new Error(
                                        response.message ||
                                            "Failed to load logs"
                                    )
                                );
                            }
                        },
                        (error) => {
                            console.error("Error loading logs:", error);
                            reject(error);
                        }
                    );
                });
            }
        }

        if (isInfiniteScroll) {
            infiniteScrollLoading.value = false;
        } else {
            loading.value = false;
            if (setLoading) setLoading(false);
        }

        return logs.value;
    } catch (error) {
        console.error("Error in logsService:", error);

        if (isInfiniteScroll) {
            infiniteScrollLoading.value = false;
        } else {
            loading.value = false;
            if (setLoading) setLoading(false);
        }

        throw error;
    }
};

const loadMoreLogs = async () => {
    if (!hasMore.value || infiniteScrollLoading.value) {
        return;
    }

    try {
        // Получаем ID последнего лога для курсорной пагинации
        const lastLog = logs.value[logs.value.length - 1];
        const lastId = lastLog?._id;

        await logsService(
            {
                lastId: lastId,
            },
            true
        );
    } catch (error) {
        console.error("Error loading more logs:", error);

        if (window.$toast) {
            window.$toast.error(
                "Ошибка загрузки дополнительных логов: " +
                    (error.message || "Неизвестная ошибка")
            );
        }

        infiniteScrollLoading.value = false;
    }
};

const loadLogs = async () => {
    try {
        const result = await logsService({}, false);
        console.log(result);
    } catch (error) {
        console.error("Error in loadLogs:", error);
        logs.value = [];
        hasMore.value = false;

        if (window.$toast) {
            window.$toast.error(
                "Ошибка загрузки логов: " +
                    (error.message || "Неизвестная ошибка")
            );
        }
    }
};

const clearFilter = async () => {
    try {
        selectedUserId.value = "";
        sortOrder.value = "desc";
        logs.value = [];
        hasMore.value = true;
        await loadLogs();
    } catch (error) {
        console.error("Error in clearFilter:", error);
    }
};

const handleFilterChange = async () => {
    try {
        logs.value = [];
        hasMore.value = true;
        await loadLogs();
    } catch (error) {
        console.error("Error in handleFilterChange:", error);
    }
};

const showLogDetails = (log) => {
    selectedLog.value = log;
    showDetailsModal.value = true;
};

const initializeInfiniteScroll = () => {
    try {
        destroy();
        const observer = createObserver(loadMoreLogs);
        if (observer && infiniteScrollTrigger.value) {
            observer.observe(infiniteScrollTrigger.value);
        }
    } catch (error) {
        console.error("Error in initializeInfiniteScroll:", error);
    }
};

const sortedLogs = computed(() => {
    return logs.value;
});

watch(
    () => route.query.userId,
    async (newUserId) => {
        try {
            if (newUserId && newUserId !== "undefined") {
                selectedUserId.value = newUserId;
                logs.value = [];
                hasMore.value = true;
                await loadLogs();
            } else {
                selectedUserId.value = "";
                logs.value = [];
                hasMore.value = true;
                await loadLogs();
            }
        } catch (error) {
            console.error("Error in route query watch:", error);
        }
    }
);

watch(sortOrder, async () => {
    try {
        logs.value = [];
        hasMore.value = true;
        await loadLogs();
    } catch (error) {
        console.error("Error in sortOrder watch:", error);
    }
});

const refreshLogsHandler = async () => {
    logs.value = [];
    hasMore.value = true;
    loading.value = true;
    if (setLoading) setLoading(true);

    try {
        await loadLogs();
        await nextTick();
        initializeInfiniteScroll();
    } catch (error) {
        console.error("Error refreshing logs:", error);

        if (window.$toast) {
            window.$toast.error(
                "Ошибка обновления логов: " +
                    (error.message || "Неизвестная ошибка")
            );
        }

        logs.value = [];
        hasMore.value = false;
    } finally {
        loading.value = false;
        if (setLoading) setLoading(false);
    }
};

onMounted(async () => {
    if (route.query.userId && route.query.userId !== "undefined") {
        selectedUserId.value = route.query.userId;
    } else {
        selectedUserId.value = "";
    }

    try {
        await loadUsers();
        setTimeout(async () => {
            await loadLogs();
            await nextTick();
            initializeInfiniteScroll();
        }, 100);
    } catch (error) {
        console.error("Error in onMounted:", error);
    }

    window.addEventListener("refreshLogs", refreshLogsHandler);
});

onUnmounted(() => {
    window.removeEventListener("refreshLogs", refreshLogsHandler);
});

watch(loading, async (val) => {
    try {
        if (!val && hasMore.value) {
            await nextTick();
            initializeInfiniteScroll();
        }
    } catch (error) {
        console.error("Error in loading watch:", error);
    }
});
</script>
