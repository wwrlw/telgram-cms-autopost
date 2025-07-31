<template>
    <div class="space-y-6">
        <div
            v-if="!loading || posts.length > 0"
            class="posts-grid"
        >
            <ScheduledPostThumb
                v-for="post in posts"
                :key="post._id"
                :post="post"
                :categories="categories"
                :channels="channels"
                @edit="$emit('edit', $event)"
                @cancel="$emit('cancel', $event)"
            />
        </div>

        <div
            v-if="loading && posts.length === 0"
            class="posts-grid"
        >
            <PostSkeleton
                v-for="i in 12"
                :key="i"
            />
        </div>

        <div v-if="!loading && posts.length === 0" class="text-center py-12">
            <svg
                class="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">Нет запланированных постов</h3>
            <p class="mt-1 text-sm text-gray-500">
                Запланированные посты появятся здесь.
            </p>
            <div class="mt-6">
                <router-link
                    :to="{ name: 'create-post' }"
                    class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Создать пост
                </router-link>
            </div>
        </div>
    </div>
</template>

<script setup>
import ScheduledPostThumb from "./ScheduledPostThumb.vue";
import PostSkeleton from "./PostSkeleton.vue";

const props = defineProps({
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
    loading: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(['edit', 'cancel']);
</script>

<style scoped>
.posts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
}

@media (max-width: 640px) {
    .posts-grid {
        grid-template-columns: 1fr;
    }
}
</style> 