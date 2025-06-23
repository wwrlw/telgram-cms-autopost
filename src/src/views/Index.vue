<template>
  <div class="news-container">
    <h1 class="page-title">Новостная лента</h1>

    <div class="news-grid">
      <router-link :key="item._id" :to="{ name: 'post', params: { id: item._id } }" v-for="item in posts"
        class="news-card">
        <div class="news-header">
          <span class="news-date">{{ formatDate(item.timestamp) }}</span>
          <a :href="item.url" target="_blank" class="news-source">Источник</a>
        </div>

        <div class="news-content">
          <h3 :class="[news - title, { unique: item.is_unique }]">{{ extractTitle(item.text) }}</h3>
          <p class="news-text">{{ truncateText(item.text, 200) }}</p>

          <div v-if="item.media" class="news-media">
            <img v-if="item.media.type === 'MessageMediaPhoto'" :src="getMediaPath(item.media.file_path)"
              alt="News image" class="news-image">
          </div>

          <div v-if="item.is_unique" class="unique-badge">IsUnique</div>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import http from '@/js/http';

const posts = ref([]);

const postsService = () => {
  http.posts((res) => {
    posts.value = res.data;
  }, (err) => {
    console.error(err);
  });
}

onMounted(() => {
  postsService();
});

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('ru-RU');
};

const extractTitle = (text) => {
  const firstSentence = text.split('\n\n')[0];
  return firstSentence.length > 80 ? firstSentence.substring(0, 80) + '...' : firstSentence;
};

const truncateText = (text, length) => {
  if (text.length > length) {
    return text.substring(0, length) + '...';
  }
  return text;
};

const getMediaPath = (filePath) => {
  return `/api/media${filePath.split('/media').pop()}`;
};
</script>

<style scoped>
.news-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-title {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.news-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 25px;
}

.news-card {
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.3s ease;
}

.news-card:hover {
  transform: translateY(-5px);
}

.news-header {
  display: flex;
  justify-content: space-between;
  padding: 15px;
  background: #f5f5f5;
  border-bottom: 1px solid #eee;
}

.news-date {
  color: #666;
  font-size: 0.9em;
}

.news-source {
  color: #2c3e50;
  text-decoration: none;
  font-weight: bold;
}

.news-source:hover {
  text-decoration: underline;
}

.news-content {
  padding: 15px;
  position: relative;
}

.news-title {
  margin-top: 0;
  margin-bottom: 10px;
  color: #2c3e50;
}

.news-text {
  color: #555;
  line-height: 1.5;
  margin-bottom: 15px;
}

.news-image {
  width: 100%;
  border-radius: 5px;
  margin-bottom: 10px;
}

.unique {
  padding: 20px
}

.unique-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #ff4757;
  color: white;
  padding: 3px 8px;
  border-radius: 3px;
  font-size: 0.8em;
  font-weight: bold;
}

@media (max-width: 768px) {
  .news-grid {
    grid-template-columns: 1fr;
  }
}
</style>