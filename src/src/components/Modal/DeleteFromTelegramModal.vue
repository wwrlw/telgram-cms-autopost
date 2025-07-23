<template>
    <div>
        <Transition
            enter-active-class="transition ease-out duration-300"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition ease-in duration-200"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <div
                v-if="show"
                class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
                @click="$emit('update:show', false)"
            >
                <Transition
                    enter-active-class="transition ease-out duration-300"
                    enter-from-class="opacity-0 transform translate-y-4 sm:translate-y-0 sm:scale-95"
                    enter-to-class="opacity-100 transform translate-y-0 sm:scale-100"
                    leave-active-class="transition ease-in duration-200"
                    leave-from-class="opacity-100 transform translate-y-0 sm:scale-100"
                    leave-to-class="opacity-0 transform translate-y-4 sm:translate-y-0 sm:scale-95"
                >
                    <div
                        class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white"
                        @click.stop
                    >
                        <div class="mt-3">
                            <div
                                class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100"
                            >
                                <svg
                                    class="h-6 w-6 text-red-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                                    />
                                </svg>
                            </div>
                            <div class="mt-3 text-center">
                                <h3
                                    class="text-lg font-medium text-gray-900 mb-4"
                                >
                                    Удалить из Telegram
                                </h3>
                                <div class="mt-2 px-7 py-3">
                                    <p class="text-sm text-gray-500 mb-4">
                                        Вы уверены, что хотите удалить этот пост
                                        из Telegram? Это действие нельзя
                                        отменить.
                                    </p>
                                    <div
                                        v-if="post"
                                        class="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4"
                                    >
                                        <h4
                                            class="font-medium text-gray-900 mb-2"
                                        >
                                            Пост для удаления:
                                        </h4>
                                        <div class="text-sm text-gray-700">
                                            <p class="mb-2">
                                                <strong>Текст:</strong>
                                                {{ previewText }}
                                            </p>
                                            <p v-if="post?.url">
                                                <strong>Ссылка:</strong>
                                                {{ post.url }}
                                            </p>
                                            <p v-if="post?.media?.length">
                                                <strong>Медиафайлов:</strong>
                                                {{ post.media.length }}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    @click="$emit('update:show', false)"
                                    class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Отмена
                                </button>
                                <button
                                    type="button"
                                    @click="handleDelete"
                                    :disabled="deleting"
                                    class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span
                                        v-if="deleting"
                                        class="flex items-center"
                                    >
                                        <svg
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
                                        Удаление...
                                    </span>
                                    <span v-else>Удалить</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>
    </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import http from "../../js/http.js";

const props = defineProps({
    show: {
        type: Boolean,
        default: false,
    },
    post: {
        type: Object,
        required: true,
    },
});

const emit = defineEmits(["update:show", "deleted"]);

const deleting = ref(false);

const previewText = computed(() => {
    if (!props.post?.text) return "Текст поста отсутствует";
    return props.post.text.length > 100
        ? props.post.text.substring(0, 100) + "..."
        : props.post.text;
});

const handleDelete = () => {
    if (!props.post?._id) return;

    deleting.value = true;

    http.deletePostFromTelegram(props.post._id.toString(), (response) => {
        deleting.value = false;
        if (response.success) {
            emit("deleted", {
                success: true,
                message: response.message,
                postId: props.post._id,
            });
            emit("update:show", false);
        } else {
            emit("deleted", {
                success: false,
                message: response.message,
            });
        }
    });
};

watch(
    () => props.show,
    (newVal) => {
        if (!newVal) {
            deleting.value = false;
        }
    }
);
</script>
