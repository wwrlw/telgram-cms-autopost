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
                            <h3 class="text-lg font-medium text-gray-900 mb-4">
                                Опубликовать в Telegram
                            </h3>

                            <div class="mb-4">
                                <p class="text-sm text-gray-600 mb-4">
                                    Выберите канал для публикации поста. Пост
                                    будет опубликован с оригинальным текстом и
                                    медиафайлами.
                                </p>

                                <div
                                    class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4"
                                >
                                    <h4 class="font-medium text-blue-900 mb-2">
                                        Предварительный просмотр:
                                    </h4>
                                    <div class="text-sm text-blue-800">
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

                            <div class="flex justify-between space-x-3">
                                <button
                                    type="button"
                                    @click="showScheduleModal = true"
                                    class="px-4 py-2 border border-orange-300 rounded-md text-sm font-medium text-orange-700 hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                                >
                                    📅 Отложенная публикация
                                </button>
                                <div class="flex space-x-3">
                                    <button
                                        type="button"
                                        @click="$emit('update:show', false)"
                                        class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Отмена
                                    </button>
                                    <button
                                        type="button"
                                        @click="showChannelSelector = true"
                                        class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Выбрать канал
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>

        <PublishChannelModal
            :show="showChannelSelector"
            :post-id="postId"
            @close="showChannelSelector = false"
            @published="handlePublished"
        />

        <SchedulePublishModal
            :show="showScheduleModal"
            :post="post"
            @update:show="showScheduleModal = $event"
            @scheduled="handleScheduled"
        />
    </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import PublishChannelModal from "./PublishChannelModal.vue";
import SchedulePublishModal from "./SchedulePublishModal.vue";

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

const emit = defineEmits(["update:show", "published"]);

const showChannelSelector = ref(false);
const showScheduleModal = ref(false);
const postId = computed(() => props.post?._id?.toString() || "");

const previewText = computed(() => {
    if (!props.post?.text) return "Текст поста отсутствует";
    return props.post.text.length > 100
        ? props.post.text.substring(0, 100) + "..."
        : props.post.text;
});

const handlePublished = (result) => {
    showChannelSelector.value = false;
    emit("published", result);

    if (result.success) {
        emit("update:show", false);
    }
};

const handleScheduled = (result) => {
    showScheduleModal.value = false;
    emit("published", result);

    if (result.success) {
        emit("update:show", false);
    }
};

watch(
    () => props.show,
    (newVal) => {
        if (!newVal) {
            showChannelSelector.value = false;
            showScheduleModal.value = false;
        }
    }
);
</script>
