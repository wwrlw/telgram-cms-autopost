<template>
    <div class="min-h-screen bg-gray-50 flex items-center justify-center">
        <div class="max-w-2xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <!-- Иконка 404 -->
            <div class="mb-8">
                <div
                    class="mx-auto w-32 h-32 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center"
                >
                    <svg
                        class="w-20 h-20 text-red-600"
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
                </div>
            </div>

            <!-- Заголовок -->
            <h1 class="text-6xl font-bold text-gray-900 mb-4">404</h1>
            <h2 class="text-2xl font-semibold text-gray-700 mb-4">
                Страница не найдена
            </h2>

            <!-- Описание -->
            <p class="text-lg text-gray-600 mb-8 max-w-md mx-auto">
                К сожалению, запрашиваемая страница не существует или была
                перемещена.
            </p>

            <!-- Кнопки действий -->
            <div
                class="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
                <router-link
                    to="/"
                    class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 shadow-lg hover:shadow-xl"
                >
                    <svg
                        class="mr-2 h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                    </svg>
                    На главную
                </router-link>

                <button
                    @click="goBack"
                    class="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 shadow-lg hover:shadow-xl"
                >
                    <svg
                        class="mr-2 h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M10 19l-7-7m0 0l7-7m-7 7h18"
                        />
                    </svg>
                    Назад
                </button>
            </div>
            <!-- Код ошибки -->
            <div class="mt-8 text-xs text-gray-400 space-y-1">
                <div>Код ошибки: 404 • Время: {{ currentTime }}</div>
                <div>URL: {{ currentUrl }}</div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();
const currentTime = ref("");
const currentUrl = ref("");

const goBack = () => {
    if (window.history.length > 1) {
        router.go(-1);
    } else {
        router.push("/");
    }
};

onMounted(() => {
    currentTime.value = new Date().toLocaleString("ru-RU");
    currentUrl.value = window.location.href;
});
</script>

<style scoped>
/* Дополнительные анимации */
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.min-h-screen {
    animation: fadeInUp 0.6s ease-out;
}

/* Градиент для иконки */
.bg-gradient-to-br {
    background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
}

/* Hover эффекты для кнопок */
.transition-colors {
    transition: all 0.2s ease-in-out;
}

/* Тень для кнопок */
.shadow-lg {
    box-shadow:
        0 10px 15px -3px rgba(0, 0, 0, 0.1),
        0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.shadow-xl {
    box-shadow:
        0 20px 25px -5px rgba(0, 0, 0, 0.1),
        0 10px 10px -5px rgba(0, 0, 0, 0.04);
}
</style>
