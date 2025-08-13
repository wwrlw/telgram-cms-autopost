<template>
    <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-white/30"
    >
        <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs mx-2">
            <div class="mb-4 text-lg font-semibold text-gray-900 text-center whitespace-pre-line">
                {{ message }}
            </div>
            <div class="flex justify-center gap-4 mt-6">
                <button
                    @click="$emit('cancel')"
                    class="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800"
                >
                    {{ cancelText }}
                </button>
                <button
                    @click="$emit('confirm')"
                    class="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                    {{ confirmText }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
const props = defineProps({
    show: Boolean,
    message: {
        type: String,
        default: "Вы уверены?",
    },
    confirmText: {
        type: String,
        default: "Да",
    },
    cancelText: {
        type: String,
        default: "Отмена",
    },
});
const emit = defineEmits(["confirm", "cancel"]);
</script>
