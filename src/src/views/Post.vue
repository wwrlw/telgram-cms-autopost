<template>
    <div class="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 p-4 lg:p-8">
        <div class="max-w-4xl mx-auto">
            <div class="mb-6">
                <router-link 
                    to="/" 
                    class="inline-flex items-center gap-2 text-white hover:text-gray-200 transition-colors font-medium"
                >
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="m15 18-6-6 6-6"/>
                    </svg>
                    Назад к постам
                </router-link>
            </div>

            <div v-if="loading" class="text-center p-16 bg-white rounded-2xl shadow-xl">
                <div class="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p class="text-gray-600">Loading post...</p>
            </div>

            <div v-else-if="error" class="text-center p-16 bg-white rounded-2xl shadow-xl">
                <div class="text-5xl mb-4">⚠️</div>
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Error Loading Post</h2>
                <p class="text-gray-600 mb-6">{{ error }}</p>
                <button 
                    @click="loadPost" 
                    class="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                    Try Again
                </button>
            </div>

            <div v-else-if="post" class="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div class="p-8 border-b border-gray-200 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div class="flex flex-col gap-2">
                        <span class="font-semibold text-blue-500 text-lg">{{ post.source_channel }}</span>
                        <span class="text-gray-500 text-sm">{{ formatDate(post.timestamp) }}</span>
                    </div>
                    <div class="flex flex-col gap-3 w-full lg:w-44">
                        <button 
                            @click="handleEdit" 
                            class="flex items-center justify-center gap-2 text-purple-500 border border-purple-500 hover:bg-purple-500 hover:text-white px-4 py-3 rounded-lg font-medium transition-all text-sm w-full"
                        >
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="m18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            Редактировать
                        </button>
                        <a 
                            :href="post.url" 
                            target="_blank" 
                            class="flex items-center justify-center gap-2 text-blue-500 border border-blue-500 hover:bg-blue-500 hover:text-white px-4 py-3 rounded-lg font-medium transition-all text-sm w-full"
                        >
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
                            </svg>
                            View on Telegram
                        </a>
                    </div>
                </div>

                <div class="p-8">
                    <p class="text-lg leading-relaxed text-gray-700 whitespace-pre-wrap">{{ post.text }}</p>
                </div>

                <div v-if="post.media && post.media.length > 0" class="px-8 pb-8">
                    <h3 class="text-xl font-semibold text-gray-700 mb-4">Media</h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        <div 
                            v-for="(media, index) in post.media" 
                            :key="index" 
                            class="border border-gray-200 rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-105"
                            @click="openMediaModal(media, index)"
                        >
                            <div class="relative h-36 bg-gray-50 flex items-center justify-center">
                                <img 
                                    v-if="media.type === 'photo'" 
                                    :src="getMediaUrl(media.file_path)" 
                                    :alt="`Media ${index + 1}`"
                                    class="w-full h-full object-cover"
                                />
                                <div v-else-if="media.type === 'video'" class="relative w-full h-full">
                                    <video :src="getMediaUrl(media.file_path)" muted class="w-full h-full object-cover"></video>
                                    <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-70 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl">
                                        ▶️
                                    </div>
                                </div>
                                <div v-else class="flex flex-col items-center gap-2 text-gray-500">
                                    <svg class="w-12 h-12" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                        <polyline points="14,2 14,8 20,8"/>
                                        <line x1="16" y1="13" x2="8" y2="13"/>
                                        <line x1="16" y1="17" x2="8" y2="17"/>
                                        <polyline points="10,9 9,9 8,9"/>
                                    </svg>
                                    <span class="text-sm">Document</span>
                                </div>
                            </div>
                            <div class="p-3 bg-gray-50">
                                <span class="text-xs text-gray-500 capitalize">{{ media.type }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="px-8 py-6 border-t border-gray-200 bg-gray-50">
                    <div class="flex flex-col lg:flex-row gap-4 lg:gap-6">
                        <span class="flex items-center gap-2 text-gray-500 text-sm">
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                            </svg>
                            {{ post.is_unique ? 'Unique' : 'Duplicate' }}
                        </span>
                        <span class="flex items-center gap-2 text-gray-500 text-sm">
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                            {{ formatDate(post.created_at) }}
                        </span>
                    </div>
                </div>
            </div>

            <div v-else class="text-center p-16 bg-white rounded-2xl shadow-xl">
                <div class="text-6xl mb-4">📄</div>
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Post Not Found</h2>
                <p class="text-gray-600 mb-6">The post you're looking for doesn't exist or has been removed.</p>
                <router-link 
                    to="/" 
                    class="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                    Back to Posts
                </router-link>
            </div>
        </div>

        <EditPostModal 
            v-model:show="showEditModal"
            :post="post"
            @updated="handlePostUpdated" />

        <div v-if="showMediaModal" class="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" @click="closeMediaModal">
            <div class="relative max-w-[90vw] max-h-[90vh]" @click.stop>
                <button 
                    class="absolute -top-10 right-0 text-white text-3xl hover:text-gray-300 transition-colors z-10"
                    @click="closeMediaModal"
                >
                    ×
                </button>
                <div class="flex items-center justify-center">
                    <img 
                        v-if="selectedMedia && selectedMedia.type === 'photo'" 
                        :src="getMediaUrl(selectedMedia.file_path)" 
                        :alt="`Media ${selectedMediaIndex + 1}`"
                        class="max-w-full max-h-[80vh] object-contain"
                    />
                    <video 
                        v-else-if="selectedMedia && selectedMedia.type === 'video'" 
                        :src="getMediaUrl(selectedMedia.file_path)" 
                        controls
                        autoplay
                        class="max-w-full max-h-[80vh] object-contain"
                    ></video>
                </div>
                <div class="absolute -bottom-10 left-0 text-white flex gap-4">
                    <span class="capitalize">{{ selectedMedia?.type }}</span>
                    <span>{{ selectedMediaIndex + 1 }} / {{ post?.media?.length }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, getCurrentInstance } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import http from '@/js/http';
import { getMediaUrl } from '@/js/utils';
import EditPostModal from '@/components/Modal/EditPostModal.vue';

const route = useRoute();
const router = useRouter();
const postId = route.params.id;
const { proxy } = getCurrentInstance();

const post = ref(null);
const loading = ref(true);
const error = ref(null);
const showMediaModal = ref(false);
const selectedMedia = ref(null);
const selectedMediaIndex = ref(0);
const showEditModal = ref(false);

const loadPost = async () => {
    loading.value = true;
    error.value = null;
    
    try {
        await http.post({ id: postId }, (res) => {
            loading.value = false;
            if (res && res.success) {
                post.value = res.data;
            } else {
                error.value = res?.message || 'Failed to load post';
            }
        });
    } catch (err) {
        loading.value = false;
        error.value = 'Network error occurred';
        console.error('Post loading error:', err);
    }
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};


const openMediaModal = (media, index) => {
    selectedMedia.value = media;
    selectedMediaIndex.value = index;
    showMediaModal.value = true;
};

const closeMediaModal = () => {
    showMediaModal.value = false;
    selectedMedia.value = null;
    selectedMediaIndex.value = 0;
};

const handleEdit = () => {
    showEditModal.value = true;
};

const handlePostUpdated = (result) => {
    if (result.success) {
        window.$toast.success('Пост успешно обновлен');
        loadPost();
    } else {
        window.$toast.error('Ошибка обновления поста: ' + (result.message || 'Неизвестная ошибка'));
    }
};

onMounted(() => {
    loadPost();
});
</script>

<style scoped>
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
</style>