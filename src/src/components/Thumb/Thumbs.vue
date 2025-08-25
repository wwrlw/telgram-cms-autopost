<template>
    <div class="space-y-6">
        <div v-if="!loading || posts.length > 0" class="posts-grid">
            <PostThumb
                v-for="post in posts"
                :key="post._id"
                :post="post"
                :categories="categories"
                @publish="$emit('publish', $event)"
                @delete="$emit('delete', $event)"
                @quickview="handleQuickview"
                @cancel="$emit('cancel', $event)"
            />
        </div>

        <MediaViewer
            :show="showQuickviewer"
            :media="currentQuickviewMedia"
            :current-index="currentQuickviewIndex"
            :total-count="quickviewPost?.media?.length || 0"
            :can-go-previous="currentQuickviewIndex > 0"
            :can-go-next="
                currentQuickviewIndex < (quickviewPost?.media?.length || 0) - 1
            "
            @close="closeQuickview"
            @previous="previousQuickviewMedia"
            @next="nextQuickviewMedia"
        />

        <div v-if="loading && posts.length === 0" class="posts-grid">
            <PostSkeleton v-for="i in 12" :key="i" />
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">Нет постов</h3>
            <p class="mt-1 text-sm text-gray-500">
                Попробуйте изменить фильтры или добавить новые посты.
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
import { ref } from "vue";
import PostThumb from "@/components/Thumb/PostThumb.vue";
import MediaViewer from "@/components/Media/MediaViewer.vue";
import PostSkeleton from "@/components/PostSkeleton.vue";

const props = defineProps({
    posts: {
        type: Array,
        default: () => [],
    },
    categories: {
        type: Array,
        default: () => [],
    },
    loading: {
        type: Boolean,
        default: false,
    },
    pagination: {
        type: Object,
        default: () => ({
            page: 1,
            limit: 12,
            total: 0,
            totalPages: 0,
        }),
    },
});

const emit = defineEmits(["publish", "delete", "cancel"]);

const showQuickviewer = ref(false);
const currentQuickviewMedia = ref(null);
const currentQuickviewIndex = ref(0);
const quickviewPost = ref(null);

const handleQuickview = (post) => {
    if (post.media && post.media.length > 0) {
        quickviewPost.value = post;
        currentQuickviewMedia.value = post.media[0];
        currentQuickviewIndex.value = 0;
        showQuickviewer.value = true;
    }
};

const closeQuickview = () => {
    showQuickviewer.value = false;
    quickviewPost.value = null;
    currentQuickviewMedia.value = null;
    currentQuickviewIndex.value = 0;
};

const nextQuickviewMedia = () => {
    if (
        quickviewPost.value &&
        currentQuickviewIndex.value < quickviewPost.value.media.length - 1
    ) {
        currentQuickviewIndex.value++;
        currentQuickviewMedia.value =
            quickviewPost.value.media[currentQuickviewIndex.value];
    }
};

const previousQuickviewMedia = () => {
    if (quickviewPost.value && currentQuickviewIndex.value > 0) {
        currentQuickviewIndex.value--;
        currentQuickviewMedia.value =
            quickviewPost.value.media[currentQuickviewIndex.value];
    }
};
</script>
