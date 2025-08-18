<template>
    <div v-if="canManagePosts">
        <!-- Отображение ошибок -->
        <div v-if="error" class="mb-6 p-4 bg-red-50 border border-red-200 rounded">
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <svg class="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <h3 class="text-sm font-medium text-red-800">Ошибка очистки</h3>
                        <p class="text-sm text-red-700 mt-1">{{ error }}</p>
                    </div>
                </div>
                <button
                    @click="clearError"
                    class="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-800 rounded border border-red-300"
                >
                    Скрыть
                </button>
            </div>
        </div>

        <div class="mb-6 p-4 bg-white shadow rounded">
            <h3 class="text-lg font-semibold mb-3">Очистка старых постов</h3>
            <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div>
                    <label class="block text-sm text-gray-600 mb-1"
                        >Порог (threshold)</label
                    >
                    <input
                        type="number"
                        v-model.number="cleanupThreshold"
                        class="w-full border rounded px-3 py-2"
                        min="0"
                    />
                </div>
                <div>
                    <label class="block text-sm text-gray-600 mb-1"
                        >Удалить (removeCount)</label
                    >
                    <input
                        type="number"
                        v-model.number="cleanupRemoveCount"
                        class="w-full border rounded px-3 py-2"
                        min="1"
                    />
                </div>
                <div class="flex items-center space-x-2">
                    <input
                        id="dryrun"
                        type="checkbox"
                        v-model="cleanupDryRun"
                    />
                    <label for="dryrun" class="text-sm text-gray-700"
                        >Dry run</label
                    >
                </div>
                <div>
                    <button
                        @click="confirmCleanup"
                        class="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                    >
                        Запустить очистку
                    </button>
                </div>
            </div>
        </div>

        <!-- Модальное окно для подтверждения очистки -->
        <ConfirmModal 
            :show="showConfirmModal" 
            :message="confirmMessage"
            confirm-text="Да"
            cancel-text="Отмена"
            @confirm="executeCleanup"
            @cancel="showConfirmModal = false"
        />
    </div>
</template>

<script setup>
import { ref, computed, inject } from "vue";
import http from "@/js/http";
import ConfirmModal from "@/components/Modal/ConfirmModal.vue";

const cleanupThreshold = ref(2500);
const cleanupRemoveCount = ref(500);
const cleanupDryRun = ref(false);
const error = ref("");

// Получаем функцию showError из родительского компонента
const showError = inject('showError', null);

const canManagePosts = computed(() => {
    try {
        const roleFromStorage = localStorage.getItem("role");
        return roleFromStorage === "super_admin";
    } catch (error) {
        return false;
    }
});

const showConfirmModal = ref(false);
const confirmMessage = ref("");

const clearError = () => {
    error.value = "";
    // Также очищаем ошибку в родительском компоненте
    if (showError) {
        showError("");
    }
};

const confirmCleanup = () => {
    // Очищаем предыдущие ошибки при новой попытке
    error.value = "";
    if (showError) {
        showError("");
    }
    
    const message = `Запустить очистку?\nthreshold=${cleanupThreshold.value}, removeCount=${cleanupRemoveCount.value}, dryRun=${cleanupDryRun.value}`;
    confirmMessage.value = message;
    showConfirmModal.value = true;
};

const executeCleanup = async () => {
    try {
        const res = await new Promise((resolve, reject) => {
            http.cleanupPosts(
                {
                    threshold: cleanupThreshold.value,
                    removeCount: cleanupRemoveCount.value,
                    dryRun: cleanupDryRun.value,
                },
                resolve,
                reject
            );
        });
        if (res.success) {
            window.$toast?.success(
                `Готово. Всего до: ${res.data.totalBefore}, будет удалено: ${res.data.toDelete}, удалено: ${res.data.deleted}, ошибок файлов: ${res.data.errors}`
            );
        } else {
            const errorMessage = res.message || "Ошибка очистки";
            error.value = errorMessage;
            if (showError) {
                showError(errorMessage);
            }
            window.$toast?.error(errorMessage);
        }
    } catch (e) {
        // Обрабатываем различные типы ошибок
        let errorMessage = "";
        if (e.response?.status === 403) {
            errorMessage = "У вас нет прав для выполнения очистки. Недостаточно прав.";
        } else if (e.code === 'ERR_NETWORK' || !e.response) {
            errorMessage = "Ошибка подключения к серверу. Проверьте интернет-соединение.";
        } else if (e.response?.data?.message) {
            errorMessage = e.response.data.message;
        } else {
            errorMessage = `Ошибка запроса очистки: ${e.message}`;
        }
        
        error.value = errorMessage;
        if (showError) {
            showError(errorMessage);
        }
        
        window.$toast?.error("Ошибка запроса очистки");
    } finally {
        showConfirmModal.value = false;
    }
};
</script>

<style scoped></style>
