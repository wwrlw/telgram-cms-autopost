<template>
    <Transition
        enter-active-class="transition ease-out duration-300"
        enter-from-class="opacity-0 transform translate-y-4 sm:translate-y-0 sm:scale-95"
        enter-to-class="opacity-100 transform translate-y-0 sm:scale-100"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="opacity-100 transform translate-y-0 sm:scale-100"
        leave-to-class="opacity-0 transform translate-y-4 sm:translate-y-0 sm:scale-95"
    >
        <div
            v-if="(selectedPosts?.length > 0) || (selectedCategories?.length > 0) || (selectedChannels?.length > 0)"
            class="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border border-gray-200 px-6 py-4 z-10"
        >
            <div class="flex items-center space-x-4">
                <span v-if="route.name === 'categories'" class="text-sm text-gray-600"
                    >{{ selectedCategories.length }} выбрано</span
                >
                <span v-else class="text-sm text-gray-600"
                    >{{ selectedChannels.length }} выбрано</span
                >
                <button
                    v-if="route.name === '!channels'"
                    @click="$emit('bulkPublish')"
                    class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                    Опубликовать все
                </button>
                <button
                    @click="$emit('bulkDelete')"
                    class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                    Удалить все
                </button>
                <button
                    @click="$emit('clearSelection')"
                    class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Отменить
                </button>
            </div>
        </div>
    </Transition>
</template>

<script setup>
import { useRoute } from "vue-router";
const route = useRoute();

const props = defineProps({
    selectedPosts: {
        type: Array,
        default: () => [],
    },
    selectedCategories: {
        type: Array,
        default: () => [],
    },
    selectedChannels: {
        type: Array,
        default: () => [],
    },
});

const emit = defineEmits(["bulkPublish", "bulkDelete", "clearSelection"]);
</script>
