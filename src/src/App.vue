<template>
  <div class="">
    <Header :loading="loading" @refreshPosts="refreshPosts" />
    <RouterView></RouterView>
  </div>    
</template>

<script setup>
import Header from '@/components/HeaderComponent.vue';
import { ref, provide } from 'vue';

const loading = ref(false);
const refreshTrigger = ref(0);

provide('loading', loading);
provide('refreshTrigger', refreshTrigger);

const refreshPosts = () => {
  loading.value = true;
  refreshTrigger.value++;
};

provide('setLoading', (value) => {
  loading.value = value;
});
</script>

<style scoped>
</style>
