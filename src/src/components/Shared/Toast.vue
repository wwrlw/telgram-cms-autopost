<template>
    <div
        v-if="notifications.length > 0"
        class="fixed top-4 right-4 z-50 space-y-2"
    >
        <div
            v-for="notification in notifications"
            :key="notification.id"
            :class="[
                'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg min-w-80 max-w-96 transform transition-all duration-300',
                notification.type === 'success'
                    ? 'bg-green-500 text-white'
                    : 'bg-red-500 text-white',
            ]"
        >
            <div class="flex-shrink-0">
                <svg
                    v-if="notification.type === 'success'"
                    class="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                    />
                </svg>
                <svg
                    v-else
                    class="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clip-rule="evenodd"
                    />
                </svg>
            </div>

            <div class="flex-1 font-medium">
                {{ notification.message }}
            </div>

            <button
                @click="remove(notification.id)"
                class="flex-shrink-0 text-white hover:text-gray-200 transition-colors"
            >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        fill-rule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clip-rule="evenodd"
                    />
                </svg>
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, inject } from "vue";

const notifications = ref([]);
let nextId = 1;

const add = (type, message, duration = 5000) => {
    const notification = {
        id: nextId++,
        type,
        message,
        duration,
    };

    notifications.value.push(notification);

    setTimeout(() => {
        remove(notification.id);
    }, duration);

    return notification.id;
};

const remove = (id) => {
    const index = notifications.value.findIndex((n) => n.id === id);
    if (index > -1) {
        notifications.value.splice(index, 1);
    }
};

const success = (message, duration = 5000) => {
    return add("success", message, duration);
};

const error = (message, duration = 8000) => {
    return add("error", message, duration);
};

const clear = () => {
    notifications.value = [];
};

defineExpose({
    success,
    error,
    clear,
    add,
    remove,
});

const registerToast = inject("registerToast", null);

onMounted(() => {
    if (registerToast) {
        registerToast({
            success,
            error,
            clear,
            add,
            remove,
        });
    }

    if (typeof window !== "undefined") {
        window.$toast = {
            success,
            error,
            clear,
        };
    }
});
</script>

<style scoped>
.v-enter-active,
.v-leave-active {
    transition: all 0.3s ease;
}

.v-enter-from {
    opacity: 0;
    transform: translateX(100%);
}

.v-leave-to {
    opacity: 0;
    transform: translateX(100%);
}
</style>
