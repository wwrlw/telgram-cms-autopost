<template>
    <div
        v-if="show"
        class="fixed inset-0 z-50 overflow-y-auto"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
    >
        <div
            class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
        >
            <div
                class="fixed inset-0 bg-white/30 backdrop-blur-sm transition-opacity"
                aria-hidden="true"
                @click="closeModal"
            ></div>

            <span
                class="hidden sm:inline-block sm:align-middle sm:h-screen"
                aria-hidden="true"
                >&#8203;</span
            >

            <div
                class="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
            >
                <form @submit.prevent="submitForm">
                    <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div class="sm:flex sm:items-start">
                            <div
                                class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10"
                            >
                                <svg
                                    class="h-6 w-6 text-indigo-600"
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
                            <div
                                class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full"
                            >
                                <h3
                                    class="text-lg leading-6 font-medium text-gray-900"
                                    id="modal-title"
                                >
                                    {{
                                        isEditing
                                            ? "Редактировать канал"
                                            : "Добавить новый канал"
                                    }}
                                </h3>
                                <div class="mt-4 space-y-4">
                                    <div>
                                        <label
                                            for="username"
                                            class="block text-sm font-medium text-gray-700"
                                        >
                                            Имя пользователя канала *
                                        </label>
                                        <div class="mt-1 relative">
                                            <input
                                                v-model="formData.username"
                                                type="text"
                                                name="username"
                                                id="username"
                                                required
                                                placeholder="@channel_name"
                                                class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md px-3 py-2"
                                                :class="{
                                                    'border-red-300':
                                                        errors.username,
                                                }"
                                            />
                                        </div>
                                        <p
                                            v-if="errors.username"
                                            class="mt-1 text-sm text-red-600"
                                        >
                                            {{ errors.username }}
                                        </p>
                                        <p class="mt-1 text-sm text-gray-500">
                                            Введите имя пользователя канала
                                            (например: @mychannel)
                                        </p>
                                    </div>

                                    <div>
                                        <label
                                            for="channel_id"
                                            class="block text-sm font-medium text-gray-700"
                                        >
                                            Channel ID *
                                        </label>
                                        <div class="mt-1">
                                            <input
                                                v-model.number="
                                                    formData.channel_id
                                                "
                                                type="number"
                                                name="channel_id"
                                                id="channel_id"
                                                required
                                                placeholder="1234567890"
                                                class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md px-3 py-2"
                                                :class="{
                                                    'border-red-300':
                                                        errors.channel_id,
                                                }"
                                            />
                                        </div>
                                        <p
                                            v-if="errors.channel_id"
                                            class="mt-1 text-sm text-red-600"
                                        >
                                            {{ errors.channel_id }}
                                        </p>
                                        <p class="mt-1 text-sm text-gray-500">
                                            Уникальный числовой идентификатор
                                            Telegram канала
                                        </p>
                                    </div>

                                    <div>
                                        <label
                                            for="is_private"
                                            class="block text-sm font-medium text-gray-700"
                                        >
                                            Тип канала
                                        </label>
                                        <div class="mt-1">
                                            <select
                                                v-model="formData.is_private"
                                                name="is_private"
                                                id="is_private"
                                                class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md px-3 py-2"
                                            >
                                                <option :value="false">
                                                    Публичный
                                                </option>
                                                <option :value="true">
                                                    Приватный
                                                </option>
                                            </select>
                                        </div>
                                        <p class="mt-1 text-sm text-gray-500">
                                            Публичные каналы имеют username,
                                            приватные - только ID
                                        </p>
                                    </div>

                                    <div>
                                        <label
                                            for="category_id"
                                            class="block text-sm font-medium text-gray-700"
                                        >
                                            Категория
                                        </label>
                                        <div class="mt-1">
                                            <select
                                                v-model="formData.category_id"
                                                name="category_id"
                                                id="category_id"
                                                class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md px-3 py-2"
                                                :class="{
                                                    'border-red-300':
                                                        errors.category_id,
                                                }"
                                            >
                                                <option value="">
                                                    Выберите категорию
                                                </option>
                                                <option
                                                    v-for="category in categories"
                                                    :key="category.id"
                                                    :value="category.id"
                                                >
                                                    {{ category.name }}
                                                </option>
                                            </select>
                                        </div>
                                        <p
                                            v-if="errors.category_id"
                                            class="mt-1 text-sm text-red-600"
                                        >
                                            {{ errors.category_id }}
                                        </p>
                                        <p class="mt-1 text-sm text-gray-500">
                                            Выберите категорию для группировки
                                            канала (необязательно)
                                        </p>
                                    </div>

                                    <div>
                                        <label
                                            for="prompt"
                                            class="block text-sm font-medium text-gray-700"
                                        >
                                            Промпт для AI обработки
                                        </label>
                                        <div class="mt-1">
                                            <textarea
                                                v-model="formData.prompt"
                                                name="prompt"
                                                id="prompt"
                                                rows="4"
                                                placeholder="Введите промпт для обработки текста постов этого канала..."
                                                class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md px-3 py-2"
                                                :class="{
                                                    'border-red-300':
                                                        errors.prompt,
                                                }"
                                            ></textarea>
                                        </div>
                                        <p
                                            v-if="errors.prompt"
                                            class="mt-1 text-sm text-red-600"
                                        >
                                            {{ errors.prompt }}
                                        </p>
                                        <p class="mt-1 text-sm text-gray-500">
                                            Промпт для AI обработки текста
                                            постов. Если не указан, будет
                                            использован стандартный промпт.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div
                        class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse"
                    >
                        <button
                            type="submit"
                            :disabled="isSubmitting"
                            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg
                                v-if="isSubmitting"
                                class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    class="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    stroke-width="4"
                                ></circle>
                                <path
                                    class="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                            {{
                                isSubmitting
                                    ? "Сохранение..."
                                    : isEditing
                                      ? "Сохранить"
                                      : "Добавить"
                            }}
                        </button>
                        <button
                            type="button"
                            @click="closeModal"
                            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Отмена
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import http from "@/js/http";

const props = defineProps({
    show: {
        type: Boolean,
        default: false,
    },
    channel: {
        type: Object,
        default: null,
    },
});

const emit = defineEmits(["update:show", "submit"]);

const formData = ref({
    username: "",
    channel_id: null,
    category_id: "",
    is_private: false,
    prompt: "",
});

const errors = ref({});
const isSubmitting = ref(false);
const categories = ref([]);

const isEditing = computed(() => !!props.channel);

const validateForm = () => {
    errors.value = {};

    if (!formData.value.username) {
        errors.value.username = "Имя пользователя обязательно";
    } else if (!formData.value.username.startsWith("@")) {
        formData.value.username =
            "@" + formData.value.username.replace("@", "");
    }

    if (!formData.value.channel_id) {
        errors.value.channel_id = "Channel ID обязателен";
    } else if (!Number.isInteger(formData.value.channel_id)) {
        errors.value.channel_id = "Channel ID должен быть числом";
    }

    return Object.keys(errors.value).length === 0;
};

const submitForm = async () => {
    if (!validateForm()) return;

    isSubmitting.value = true;

    try {
        const submitData = {
            ...formData.value,
            ...(isEditing.value && { id: props.channel.id }),
        };

        emit("submit", submitData);
        closeModal();
    } catch (error) {
        console.error("Error submitting form:", error);
    } finally {
        isSubmitting.value = false;
    }
};

const closeModal = () => {
    emit("update:show", false);
    resetForm();
};

const loadCategories = () => {
    http.categories((response) => {
        if (response.success && response.data) {
            categories.value = response.data;
        }
    });
};

const resetForm = () => {
    formData.value = {
        username: "",
        channel_id: null,
        category_id: "",
        is_private: false,
        prompt: "",
    };
    errors.value = {};
    isSubmitting.value = false;
};

watch(
    () => props.show,
    (newValue) => {
        if (newValue && props.channel) {
            formData.value = {
                username: props.channel.username,
                channel_id: props.channel.channel_id,
                category_id: props.channel.category_id || "",
                is_private: props.channel.is_private || false,
                prompt: props.channel.prompt || "",
            };
        } else if (newValue) {
            resetForm();
        }
    }
);

onMounted(() => {
    loadCategories();
});
</script>
