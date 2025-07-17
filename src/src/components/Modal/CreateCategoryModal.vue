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
                class="fixed inset-0 bg-opacity-75 transition-opacity"
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
                                            ? "Редактировать категорию"
                                            : "Добавить новую категорию"
                                    }}
                                </h3>
                                <div class="mt-4 space-y-4">
                                    <div>
                                        <label
                                            for="name"
                                            class="block text-sm font-medium text-gray-700"
                                        >
                                            Название категории *
                                        </label>
                                        <div class="mt-1 relative">
                                            <input
                                                v-model="formData.name"
                                                type="text"
                                                name="name"
                                                id="name"
                                                required
                                                placeholder="Название категории"
                                                class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md px-3 py-2"
                                                :class="{
                                                    'border-red-300':
                                                        errors.name,
                                                }"
                                            />
                                        </div>
                                        <p
                                            v-if="errors.name"
                                            class="mt-1 text-sm text-red-600"
                                        >
                                            {{ errors.name }}
                                        </p>
                                    </div>

                                    <div>
                                        <label
                                            for="description"
                                            class="block text-sm font-medium text-gray-700"
                                        >
                                            Описание
                                        </label>
                                        <div class="mt-1">
                                            <textarea
                                                v-model="formData.description"
                                                name="description"
                                                id="description"
                                                rows="3"
                                                placeholder="Описание категории (необязательно)"
                                                class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md px-3 py-2"
                                                :class="{
                                                    'border-red-300':
                                                        errors.description,
                                                }"
                                            ></textarea>
                                        </div>
                                        <p
                                            v-if="errors.description"
                                            class="mt-1 text-sm text-red-600"
                                        >
                                            {{ errors.description }}
                                        </p>
                                    </div>

                                    <div>
                                        <label
                                            for="color"
                                            class="block text-sm font-medium text-gray-700"
                                        >
                                            Цвет категории
                                        </label>
                                        <div
                                            class="mt-1 flex items-center space-x-3"
                                        >
                                            <input
                                                v-model="formData.color"
                                                type="color"
                                                name="color"
                                                id="color"
                                                class="h-10 w-16 border border-gray-300 rounded-md shadow-sm"
                                                :class="{
                                                    'border-red-300':
                                                        errors.color,
                                                }"
                                            />
                                            <input
                                                v-model="formData.color"
                                                type="text"
                                                placeholder="#3B82F6"
                                                class="flex-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md px-3 py-2"
                                                :class="{
                                                    'border-red-300':
                                                        errors.color,
                                                }"
                                            />
                                        </div>
                                        <p
                                            v-if="errors.color"
                                            class="mt-1 text-sm text-red-600"
                                        >
                                            {{ errors.color }}
                                        </p>
                                        <p class="mt-1 text-sm text-gray-500">
                                            Выберите цвет для отображения
                                            категории в интерфейсе
                                        </p>
                                    </div>

                                    <div class="flex items-center">
                                        <input
                                            v-model="formData.is_active"
                                            type="checkbox"
                                            name="is_active"
                                            id="is_active"
                                            class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        />
                                        <label
                                            for="is_active"
                                            class="ml-2 block text-sm text-gray-900"
                                        >
                                            Активная категория
                                        </label>
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
import { ref, computed, watch } from "vue";

const props = defineProps({
    show: {
        type: Boolean,
        default: false,
    },
    category: {
        type: Object,
        default: null,
    },
});

const emit = defineEmits(["update:show", "submit"]);

const formData = ref({
    name: "",
    description: "",
    color: "#3B82F6",
    is_active: true,
});

const errors = ref({});
const isSubmitting = ref(false);

const isEditing = computed(() => !!props.category);

const validateForm = () => {
    errors.value = {};

    if (!formData.value.name) {
        errors.value.name = "Название категории обязательно";
    }

    if (
        formData.value.color &&
        !formData.value.color.match(/^#[0-9A-F]{6}$/i)
    ) {
        errors.value.color =
            "Цвет должен быть в формате HEX (например: #3B82F6)";
    }

    return Object.keys(errors.value).length === 0;
};

const submitForm = async () => {
    if (!validateForm()) return;

    isSubmitting.value = true;

    try {
        const submitData = {
            ...formData.value,
            ...(isEditing.value && { id: props.category.id }),
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

const resetForm = () => {
    formData.value = {
        name: "",
        description: "",
        color: "#3B82F6",
        is_active: true,
    };
    errors.value = {};
    isSubmitting.value = false;
};

watch(
    () => props.show,
    (newValue) => {
        if (newValue && props.category) {
            // Editing mode
            formData.value = {
                name: props.category.name,
                description: props.category.description || "",
                color: props.category.color || "#3B82F6",
                is_active: props.category.is_active !== false,
            };
        } else if (newValue) {
            // Create mode
            resetForm();
        }
    }
);
</script>
