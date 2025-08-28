<template>
    <div class="mb-3 bg-white p-4 rounded-lg shadow" v-if="!loading || hasData">
        <div class="space-y-4">
            <div
                class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4"
            >
                <div class="flex-1">
                    <label for="search" class="sr-only">Поиск</label>
                    <div class="relative">
                        <div
                            class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                        >
                            <Search class="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            v-model="searchQuery"
                            @input="updateSearch"
                            type="text"
                            name="search"
                            id="search"
                            class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Поиск по названию или описанию..."
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { Search } from "lucide-vue-next";

const props = defineProps({
    loading: {
        type: Boolean,
        default: false,
    },
    posts: {
        type: Array,
        default: () => [],
    },
    categories: {
        type: Array,
        default: () => [],
    },
    channels: {
        type: Array,
        default: () => [],
    },
});

const emit = defineEmits(["update:searchQuery", "clearFilters"]);

const searchQuery = ref("");

const hasData = computed(() => {
    return (
        props.posts.length > 0 ||
        props.categories.length > 0 ||
        props.channels.length > 0
    );
});

const updateSearch = () => {
    emit("update:searchQuery", searchQuery.value);
};
</script>
