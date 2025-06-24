<template>
    <div class="post-page">
        <div class="container">
            <div v-if="loading" class="loading-container">
                <div class="loading-spinner"></div>
                <p>Loading post...</p>
            </div>

            <div v-else-if="error" class="error-container">
                <div class="error-icon">⚠️</div>
                <h2>Error Loading Post</h2>
                <p>{{ error }}</p>
                <button @click="loadPost" class="retry-button">Try Again</button>
            </div>

            <div v-else-if="post" class="post-content">
                <div class="post-header">
                    <div class="post-meta">
                        <span class="channel-name">{{ post.source_channel }}</span>
                        <span class="post-date">{{ formatDate(post.timestamp) }}</span>
                    </div>
                    <div class="post-actions">
                        <a :href="post.url" target="_blank" class="external-link">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
                            </svg>
                            View on Telegram
                        </a>
                    </div>
                </div>

                <div class="post-text">
                    <p>{{ post.text }}</p>
                </div>

                <div v-if="post.media && post.media.length > 0" class="media-gallery">
                    <h3>Media</h3>
                    <div class="media-grid">
                        <div 
                            v-for="(media, index) in post.media" 
                            :key="index" 
                            class="media-item"
                            @click="openMediaModal(media, index)"
                        >
                            <div class="media-preview">
                                <img 
                                    v-if="media.type === 'photo'" 
                                    :src="getMediaUrl(media.file_path)" 
                                    :alt="`Media ${index + 1}`"
                                />
                                <div v-else-if="media.type === 'video'" class="video-preview">
                                    <video :src="getMediaUrl(media.file_path)" muted></video>
                                    <div class="play-icon">▶️</div>
                                </div>
                                <div v-else class="document-preview">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                        <polyline points="14,2 14,8 20,8"/>
                                        <line x1="16" y1="13" x2="8" y2="13"/>
                                        <line x1="16" y1="17" x2="8" y2="17"/>
                                        <polyline points="10,9 9,9 8,9"/>
                                    </svg>
                                    <span>Document</span>
                                </div>
                            </div>
                            <div class="media-info">
                                <span class="media-type">{{ media.type }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="post-footer">
                    <div class="post-stats">
                        <span class="stat">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                            </svg>
                            {{ post.is_unique ? 'Unique' : 'Duplicate' }}
                        </span>
                        <span class="stat">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                            {{ formatDate(post.created_at) }}
                        </span>
                    </div>
                </div>
            </div>

            <div v-else class="not-found">
                <div class="not-found-icon">📄</div>
                <h2>Post Not Found</h2>
                <p>The post you're looking for doesn't exist or has been removed.</p>
                <router-link to="/" class="back-button">Back to Posts</router-link>
            </div>
        </div>

        <div v-if="showMediaModal" class="media-modal" @click="closeMediaModal">
            <div class="modal-content" @click.stop>
                <button class="modal-close" @click="closeMediaModal">×</button>
                <div class="modal-media">
                    <img 
                        v-if="selectedMedia && selectedMedia.type === 'photo'" 
                        :src="getMediaUrl(selectedMedia.file_path)" 
                        :alt="`Media ${selectedMediaIndex + 1}`"
                    />
                    <video 
                        v-else-if="selectedMedia && selectedMedia.type === 'video'" 
                        :src="getMediaUrl(selectedMedia.file_path)" 
                        controls
                        autoplay
                    ></video>
                </div>
                <div class="modal-info">
                    <span class="media-type">{{ selectedMedia?.type }}</span>
                    <span class="media-index">{{ selectedMediaIndex + 1 }} / {{ post?.media?.length }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import http from '@/js/http';

const route = useRoute();
const router = useRouter();
const postId = route.params.id;

const post = ref(null);
const loading = ref(true);
const error = ref(null);
const showMediaModal = ref(false);
const selectedMedia = ref(null);
const selectedMediaIndex = ref(0);

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

const getMediaUrl = (filePath) => {
    const cleanPath = filePath.replace('/app/', '');
    return `http://127.0.0.1:3001/${cleanPath}`;
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

onMounted(() => {
    loadPost();
});
</script>

<style scoped>
.post-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 2rem 1rem;
}

.container {
    max-width: 800px;
    margin: 0 auto;
}

/* Loading state */
.loading-container {
    text-align: center;
    padding: 4rem 2rem;
    background: white;
    border-radius: 1rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.error-container {
    text-align: center;
    padding: 4rem 2rem;
    background: white;
    border-radius: 1rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.error-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.retry-button {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    cursor: pointer;
    font-weight: 600;
    margin-top: 1rem;
}

.retry-button:hover {
    background: #2563eb;
}

.post-content {
    background: white;
    border-radius: 1rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

.post-header {
    padding: 2rem;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.post-meta {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.channel-name {
    font-weight: 600;
    color: #3b82f6;
    font-size: 1.1rem;
}

.post-date {
    color: #6b7280;
    font-size: 0.9rem;
}

.external-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #3b82f6;
    text-decoration: none;
    font-weight: 500;
    padding: 0.5rem 1rem;
    border: 1px solid #3b82f6;
    border-radius: 0.5rem;
    transition: all 0.2s;
}

.external-link:hover {
    background: #3b82f6;
    color: white;
}

.external-link svg {
    width: 16px;
    height: 16px;
}

.post-text {
    padding: 2rem;
    font-size: 1.1rem;
    line-height: 1.6;
    color: #374151;
}

.post-text p {
    margin: 0;
    white-space: pre-wrap;
}

.media-gallery {
    padding: 0 2rem 2rem;
}

.media-gallery h3 {
    margin-bottom: 1rem;
    color: #374151;
    font-size: 1.2rem;
}

.media-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
}

.media-item {
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.2s;
}

.media-item:hover {
    transform: scale(1.02);
}

.media-preview {
    position: relative;
    height: 150px;
    background: #f9fafb;
    display: flex;
    align-items: center;
    justify-content: center;
}

.media-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.video-preview {
    position: relative;
    width: 100%;
    height: 100%;
}

.video-preview video {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.play-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 2rem;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    border-radius: 50%;
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.document-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    color: #6b7280;
}

.document-preview svg {
    width: 48px;
    height: 48px;
}

.media-info {
    padding: 0.75rem;
    background: #f9fafb;
}

.media-type {
    font-size: 0.8rem;
    color: #6b7280;
    text-transform: capitalize;
}

.post-footer {
    padding: 1.5rem 2rem;
    border-top: 1px solid #e5e7eb;
    background: #f9fafb;
}

.post-stats {
    display: flex;
    gap: 1.5rem;
}

.stat {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #6b7280;
    font-size: 0.9rem;
}

.stat svg {
    width: 16px;
    height: 16px;
}

.not-found {
    text-align: center;
    padding: 4rem 2rem;
    background: white;
    border-radius: 1rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.not-found-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
}

.back-button {
    display: inline-block;
    background: #3b82f6;
    color: white;
    text-decoration: none;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 600;
    margin-top: 1rem;
}

.back-button:hover {
    background: #2563eb;
}

.media-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    position: relative;
    max-width: 90vw;
    max-height: 90vh;
}

.modal-close {
    position: absolute;
    top: -40px;
    right: 0;
    background: none;
    border: none;
    color: white;
    font-size: 2rem;
    cursor: pointer;
    z-index: 1001;
}

.modal-media img,
.modal-media video {
    max-width: 100%;
    max-height: 80vh;
    object-fit: contain;
}

.modal-info {
    position: absolute;
    bottom: -40px;
    left: 0;
    color: white;
    display: flex;
    gap: 1rem;
}

@media (max-width: 768px) {
    .post-header {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
    }
    
    .media-grid {
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    }
    
    .post-stats {
        flex-direction: column;
        gap: 0.5rem;
    }
}
</style>