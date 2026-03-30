<template>
    <div v-if="canManage">
        <div v-if="error" class="mb-6 p-4 bg-red-50 border border-red-200 rounded">
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <svg class="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <h3 class="text-sm font-medium text-red-800">Ошибка</h3>
                        <p class="text-sm text-red-700 mt-1">{{ error }}</p>
                    </div>
                </div>
                <button @click="error = ''" class="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-800 rounded border border-red-300">
                    Скрыть
                </button>
            </div>
        </div>

        <div class="mb-6 p-4 bg-white shadow rounded">
            <div class="flex items-center justify-between mb-3">
                <h3 class="text-lg font-semibold">Telegram авторизация</h3>
                <button @click="loadConfigs" :disabled="loading" class="text-sm text-indigo-600 hover:text-indigo-800 disabled:opacity-50">
                    Обновить
                </button>
            </div>

            <div v-if="loading" class="text-sm text-gray-500">Загрузка...</div>

            <div v-else-if="configs.length === 0" class="text-sm text-gray-500 italic">
                Конфигурации не найдены. Добавьте первую.
            </div>

            <div v-else class="space-y-2 mb-4">
                <div v-for="cfg in configs" :key="cfg._id"
                    class="flex items-center justify-between p-3 border rounded bg-gray-50">
                    <div>
                        <span class="font-medium text-sm">{{ cfg.label }}</span>
                        <span class="text-xs text-gray-500 ml-2">{{ cfg.phone }}</span>
                        <span :class="statusClass(cfg.status)" class="ml-2 px-2 py-0.5 rounded-full text-xs font-medium">
                            {{ statusLabel(cfg.status) }}
                        </span>
                    </div>
                    <div class="flex items-center gap-2">
                        <button
                            v-if="cfg.status !== 'active'"
                            @click="startAuth(cfg)"
                            :disabled="authLoading"
                            class="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded disabled:opacity-50"
                        >
                            Авторизовать
                        </button>
                        <button @click="confirmDelete(cfg)" class="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded">
                            Удалить
                        </button>
                    </div>
                </div>
            </div>

            <div class="border-t pt-4">
                <h4 class="text-sm font-medium text-gray-700 mb-3">Добавить конфигурацию</h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs text-gray-600 mb-1">Название</label>
                        <input v-model="form.label" type="text" placeholder="Мой аккаунт"
                            class="w-full border rounded px-3 py-2 text-sm" />
                    </div>
                    <div>
                        <label class="block text-xs text-gray-600 mb-1">Телефон</label>
                        <input v-model="form.phone" type="text" placeholder="+79001234567"
                            class="w-full border rounded px-3 py-2 text-sm" />
                    </div>
                    <div>
                        <label class="block text-xs text-gray-600 mb-1">API ID</label>
                        <input v-model="form.api_id" type="text" placeholder="12345678"
                            class="w-full border rounded px-3 py-2 text-sm" />
                    </div>
                    <div>
                        <label class="block text-xs text-gray-600 mb-1">API Hash</label>
                        <input v-model="form.api_hash" type="text" placeholder="abcdef1234567890..."
                            class="w-full border rounded px-3 py-2 text-sm" />
                    </div>
                </div>
                <div class="mt-3 flex justify-end">
                    <button @click="createConfig" :disabled="createLoading || !formValid"
                        class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        {{ createLoading ? 'Создание...' : 'Добавить' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Модал ввода кода -->
        <div v-if="showCodeModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
                <h3 class="text-lg font-semibold mb-2">Введите код</h3>
                <p class="text-sm text-gray-600 mb-4">
                    Код отправлен на номер <strong>{{ pendingConfig?.phone }}</strong>
                </p>
                <input v-model="verifyCode" type="text" placeholder="12345" maxlength="10"
                    class="w-full border rounded px-3 py-2 text-sm mb-4"
                    @keyup.enter="submitCode" />
                <div class="flex justify-end gap-2">
                    <button @click="cancelCode" class="px-4 py-2 text-sm rounded border hover:bg-gray-50">
                        Отмена
                    </button>
                    <button @click="submitCode" :disabled="!verifyCode.trim() || authLoading"
                        class="px-4 py-2 text-sm rounded bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50">
                        {{ authLoading ? 'Проверка...' : 'Подтвердить' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Модал ввода пароля 2FA -->
        <div v-if="showPasswordModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
                <h3 class="text-lg font-semibold mb-2">Двухфакторная аутентификация</h3>
                <p class="text-sm text-gray-600 mb-4">
                    На аккаунте включён облачный пароль. Введите его для завершения входа.
                </p>
                <input v-model="twoFaPassword" type="password" placeholder="Облачный пароль"
                    class="w-full border rounded px-3 py-2 text-sm mb-4"
                    @keyup.enter="submitPassword" />
                <div class="flex justify-end gap-2">
                    <button @click="cancelPassword" class="px-4 py-2 text-sm rounded border hover:bg-gray-50">
                        Отмена
                    </button>
                    <button @click="submitPassword" :disabled="!twoFaPassword.trim() || authLoading"
                        class="px-4 py-2 text-sm rounded bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50">
                        {{ authLoading ? 'Проверка...' : 'Войти' }}
                    </button>
                </div>
            </div>
        </div>

        <ConfirmModal
            :show="showDeleteModal"
            :message="deleteMessage"
            confirm-text="Удалить"
            cancel-text="Отмена"
            @confirm="executeDelete"
            @cancel="showDeleteModal = false"
        />
    </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from "vue";
import http from "@/js/http";
import ConfirmModal from "@/components/Modal/ConfirmModal.vue";

const showError = inject("showError", null);

const configs = ref([]);
const loading = ref(false);
const createLoading = ref(false);
const authLoading = ref(false);
const error = ref("");

const form = ref({ label: "", phone: "", api_id: "", api_hash: "" });
const formValid = computed(() =>
    form.value.label.trim() && form.value.phone.trim() &&
    form.value.api_id.trim() && form.value.api_hash.trim()
);

const showCodeModal = ref(false);
const verifyCode = ref("");
const pendingConfig = ref(null);
const pendingPhoneCodeHash = ref("");

const showPasswordModal = ref(false);
const twoFaPassword = ref("");

const showDeleteModal = ref(false);
const deleteMessage = ref("");
const deletingConfig = ref(null);

const canManage = computed(() => {
    try {
        return localStorage.getItem("role") === "super_admin";
    } catch {
        return false;
    }
});

const statusLabel = (status) => {
    if (status === "active") return "Активна";
    if (status === "pending_code") return "Ожидает кода";
    return "Не активна";
};

const statusClass = (status) => {
    if (status === "active") return "bg-green-100 text-green-700";
    if (status === "pending_code") return "bg-yellow-100 text-yellow-700";
    return "bg-gray-100 text-gray-600";
};

const setError = (msg) => {
    error.value = msg;
    if (showError) showError(msg);
};

const loadConfigs = async () => {
    loading.value = true;
    try {
        const res = await new Promise((resolve, reject) =>
            http.telegramConfigGetAll(resolve, reject)
        );
        if (res.success) {
            configs.value = res.data;
        } else {
            setError(res.message || "Ошибка загрузки конфигураций");
        }
    } catch (e) {
        setError(e.response?.data?.message || "Ошибка загрузки конфигураций");
    } finally {
        loading.value = false;
    }
};

const createConfig = async () => {
    createLoading.value = true;
    error.value = "";
    try {
        const res = await new Promise((resolve, reject) =>
            http.telegramConfigCreate({ ...form.value }, resolve, reject)
        );
        if (res.success) {
            form.value = { label: "", phone: "", api_id: "", api_hash: "" };
            window.$toast?.success("Конфигурация добавлена");
            await loadConfigs();
        } else {
            setError(res.message || "Ошибка создания конфигурации");
        }
    } catch (e) {
        if (e.response?.status === 403) {
            setError("Недостаточно прав");
        } else if (e.code === "ERR_NETWORK" || !e.response) {
            setError("Ошибка подключения к серверу");
        } else {
            setError(e.response?.data?.message || `Ошибка: ${e.message}`);
        }
    } finally {
        createLoading.value = false;
    }
};

const startAuth = async (cfg) => {
    authLoading.value = true;
    error.value = "";
    try {
        const res = await new Promise((resolve, reject) =>
            http.telegramConfigSendCode(cfg._id, resolve, reject)
        );
        if (res.success) {
            pendingConfig.value = cfg;
            pendingPhoneCodeHash.value = res.data.phoneCodeHash;
            verifyCode.value = "";
            showCodeModal.value = true;
            await loadConfigs();
        } else {
            setError(res.message || "Ошибка отправки кода");
        }
    } catch (e) {
        if (e.code === "ERR_NETWORK" || !e.response) {
            setError("Ошибка подключения. Убедитесь, что парсер запущен.");
        } else {
            setError(e.response?.data?.message || `Ошибка: ${e.message}`);
        }
    } finally {
        authLoading.value = false;
    }
};

const submitCode = async () => {
    if (!verifyCode.value.trim() || !pendingConfig.value) return;
    authLoading.value = true;
    error.value = "";
    try {
        const res = await new Promise((resolve, reject) =>
            http.telegramConfigVerifyCode(
                pendingConfig.value._id,
                verifyCode.value.trim(),
                pendingPhoneCodeHash.value,
                resolve,
                reject
            )
        );
        if (res.success) {
            showCodeModal.value = false;
            if (res.data?.needsPassword) {
                twoFaPassword.value = "";
                showPasswordModal.value = true;
            } else {
                pendingConfig.value = null;
                window.$toast?.success("Авторизация успешна! Парсер перезапускается...");
                setTimeout(() => loadConfigs(), 3000);
            }
        } else {
            setError(res.message || "Неверный код");
        }
    } catch (e) {
        setError(e.response?.data?.message || `Ошибка проверки кода: ${e.message}`);
    } finally {
        authLoading.value = false;
    }
};

const cancelCode = () => {
    showCodeModal.value = false;
    pendingConfig.value = null;
    verifyCode.value = "";
    pendingPhoneCodeHash.value = "";
};

const submitPassword = async () => {
    if (!twoFaPassword.value.trim() || !pendingConfig.value) return;
    authLoading.value = true;
    error.value = "";
    try {
        const res = await new Promise((resolve, reject) =>
            http.telegramConfigVerifyPassword(
                pendingConfig.value._id,
                twoFaPassword.value.trim(),
                resolve,
                reject
            )
        );
        if (res.success) {
            showPasswordModal.value = false;
            pendingConfig.value = null;
            twoFaPassword.value = "";
            window.$toast?.success("Авторизация успешна! Парсер перезапускается...");
            setTimeout(() => loadConfigs(), 3000);
        } else {
            setError(res.message || "Неверный пароль");
        }
    } catch (e) {
        setError(e.response?.data?.message || `Ошибка проверки пароля: ${e.message}`);
    } finally {
        authLoading.value = false;
    }
};

const cancelPassword = () => {
    showPasswordModal.value = false;
    twoFaPassword.value = "";
};

const confirmDelete = (cfg) => {
    deletingConfig.value = cfg;
    deleteMessage.value = `Удалить конфигурацию «${cfg.label}» (${cfg.phone})?`;
    showDeleteModal.value = true;
};

const executeDelete = async () => {
    if (!deletingConfig.value) return;
    try {
        const res = await new Promise((resolve, reject) =>
            http.telegramConfigDelete(deletingConfig.value._id, resolve, reject)
        );
        if (res.success) {
            window.$toast?.success("Конфигурация удалена");
            await loadConfigs();
        } else {
            setError(res.message || "Ошибка удаления");
        }
    } catch (e) {
        setError(e.response?.data?.message || `Ошибка: ${e.message}`);
    } finally {
        showDeleteModal.value = false;
        deletingConfig.value = null;
    }
};

onMounted(() => loadConfigs());
</script>

<style scoped></style>
