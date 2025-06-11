<template>
    <div>
        <h1>This is index page</h1>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

const nameOf = ref('Tima')

onMounted(() => {
    alert(`hello, ${nameOf}`);
})
</script>