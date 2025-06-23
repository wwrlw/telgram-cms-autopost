<template>
    <div class="w-full border-xl bg-blue">
        <h1>Пост: {{ postId }}</h1>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import http from '@/js/http';
import { useRoute } from 'vue-router'
const route = useRoute();
const postId = route.params.id;

const data = ref(null);

const postService = () => {
  http.post({ id: postId }, (res) => {
    data.value = res;
  });
};

onMounted(() => {
    postService();
});

</script>