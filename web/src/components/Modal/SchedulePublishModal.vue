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
                class="fixed inset-0 bg-white/30 backdrop-blur-sm overflow-y-auto h-full w-full z-50"
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
                                Отложенная публикация
                            </h3>

                            <form @submit.prevent="handleSubmit">
                                <div class="mb-4">
                                    <label
                                        for="channel"
                                        class="block text-sm font-medium text-gray-700 mb-2"
                                    >
                                        Канал
                                    </label>
                                    <div
                                        v-if="loadingChannels"
                                        class="text-sm text-gray-500"
                                    >
                                        Загружаем каналы...
                                    </div>
                                    <select
                                        v-else
                                        v-model="formData.channel"
                                        id="channel"
                                        required
                                        class="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="">Выберите канал</option>
                                        <option
                                            v-for="channel in publicationChannels"
                                            :key="channel.id"
                                            :value="channel.channel_id"
                                        >
                                            {{ channel.name }}
                                            <span v-if="!channel.is_active"
                                                >(неактивен)</span
                                            >
                                        </option>
                                    </select>
                                </div>

                                <div class="mb-4">
                                    <label
                                        for="date"
                                        class="block text-sm font-medium text-gray-700 mb-2"
                                    >
                                        Дата публикации
                                    </label>
                                    <input
                                        type="date"
                                        id="date"
                                        v-model="formData.date"
                                        :min="minDate"
                                        required
                                        class="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>

                                <div class="mb-4">
                                    <label
                                        for="time"
                                        class="block text-sm font-medium text-gray-700 mb-2"
                                    >
                                        Время публикации
                                    </label>
                                    <input
                                        type="time"
                                        id="time"
                                        v-model="formData.time"
                                        required
                                        class="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>

                                <div
                                    class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg"
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
                                        <p v-if="scheduledDateTime">
                                            <strong>Время публикации:</strong>
                                            {{ formattedDateTime }}
                                        </p>
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
                                        type="submit"
                                        :disabled="
                                            !formData.channel ||
                                            !formData.date ||
                                            !formData.time ||
                                            loadingChannels ||
                                            submitting ||
                                            !post
                                        "
                                        class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {{
                                            submitting
                                                ? "Планирование..."
                                                : "Запланировать"
                                        }}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>
    </div>
</template>

<script setup>
import { reactive, watch, ref, onMounted, computed } from "vue";
import http from "../../js/http.js";

const props = defineProps({
    show: {
        type: Boolean,
        default: false,
    },
    post: {
        type: Object,
        required: false,
        default: null,
    },
});

const emit = defineEmits(["update:show", "scheduled"]);

const publicationChannels = ref([]);
const loadingChannels = ref(false);
const submitting = ref(false);

const formData = reactive({
    channel: "",
    date: "",
    time: "",
});

const minDate = computed(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
});

const previewText = computed(() => {
    if (!props.post?.text) return "Текст поста отсутствует";
    return props.post.text.length > 100
        ? props.post.text.substring(0, 100) + "..."
        : props.post.text;
});

const scheduledDateTime = computed(() => {
    if (!formData.date || !formData.time) return null;
    return new Date(`${formData.date}T${formData.time}`);
});

const formattedDateTime = computed(() => {
    if (!scheduledDateTime.value) return "";
    return scheduledDateTime.value.toLocaleString("ru-RU");
});

const loadPublicationChannels = () => {
    loadingChannels.value = true;
    http.getActivePublicationChannels((response) => {
        loadingChannels.value = false;
        if (response.success) {
            publicationChannels.value = response.data;
        } else {
            console.error("Ошибка загрузки каналов:", response.message);
            publicationChannels.value = [];
        }
    });
};

const handleSubmit = () => {
    if (!scheduledDateTime.value || !props.post?._id) return;

    submitting.value = true;

    http.schedulePost(
        {
            postId: props.post._id.toString(),
            channelId: formData.channel,
            scheduledAt: scheduledDateTime.value.toISOString(),
        },
        (response) => {
            submitting.value = false;
            if (response.success) {
                emit("scheduled", {
                    success: true,
                    message: "Пост успешно запланирован",
                    data: response.data,
                });
                emit("update:show", false);
                formData.channel = "";
                formData.date = "";
                formData.time = "";
            } else {
                emit("scheduled", {
                    success: false,
                    message: response.message || "Ошибка планирования поста",
                });
            }
        }
    );
};

watch(
    () => props.show,
    (newShow) => {
        if (newShow) {
            loadPublicationChannels();
            const now = new Date();
            const futureTime = new Date(now.getTime() + 60 * 60 * 1000);
            formData.date = futureTime.toISOString().split("T")[0];
            formData.time = futureTime
                .toTimeString()
                .split(" ")[0]
                .substring(0, 5);
        }
    }
);

onMounted(() => {
    if (props.show) {
        loadPublicationChannels();
    }
});
</script>
