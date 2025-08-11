<template>
    <div class="min-h-screen bg-gray-50" data-settings-component>
        <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div class="mb-6 p-4 bg-white shadow rounded">
                <h3 class="text-lg font-semibold mb-3">Настройки</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label class="block text-sm text-gray-600 mb-1"
                            >Тема</label
                        >
                        <select
                            v-model="settings.theme"
                            class="w-full border rounded px-3 py-2"
                        >
                            <option value="light">Светлая</option>
                            <option value="dark">Тёмная</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm text-gray-600 mb-1"
                            >Язык</label
                        >
                        <select
                            v-model="settings.language"
                            class="w-full border rounded px-3 py-2"
                        >
                            <option value="en">Английский</option>
                            <option value="ru">Русский</option>
                        </select>
                    </div>
                </div>
                <div class="mt-4 flex justify-end">
                    <button
                        @click="saveSettings"
                        class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                    >
                        Сохранить
                    </button>
                </div>
            </div>
            <ClearDb />
        </main>
    </div>
</template>

<script setup>
import { ref } from "vue";
import ClearDb from "@/components/ClearDb.vue";

const settings = ref({
    theme: "light",
    language: "en",
});

// const toggleTheme = () => {
//     settings.value.theme = settings.value.theme === "light" ? "dark" : "light";
// };

// const toggleLanguage = () => {
//     settings.value.language = settings.value.language === "en" ? "ru" : "en";
// };

// const saveSettings = () => {
//     console.log(settings.value);
// };

// const loadSettings = () => {
//     console.log(settings.value);
// };
</script>

<style scoped></style>
