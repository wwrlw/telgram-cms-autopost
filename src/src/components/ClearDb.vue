<template>
    <div>
        <div v-if="canManagePosts" class="mb-6 p-4 bg-white shadow rounded">
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
    </div>
</template>

<script setup>
import { ref, computed } from "vue";
import http from "@/js/http";

const cleanupThreshold = ref(2500);
const cleanupRemoveCount = ref(500);
const cleanupDryRun = ref(false);

const canManagePosts = computed(() => true);

const confirmCleanup = async () => {
    const message = `Запустить очистку?\nthreshold=${cleanupThreshold.value}, removeCount=${cleanupRemoveCount.value}, dryRun=${cleanupDryRun.value}`;
    const ok = window.confirm(message);
    if (!ok) return;

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
            window.$toast?.error(res.message || "Ошибка очистки");
        }
    } catch (e) {
        window.$toast?.error("Ошибка запроса очистки", e.message);
    }
};
</script>

<style scoped></style>
