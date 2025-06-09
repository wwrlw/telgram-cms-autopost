<template>
    <div :class="['mb-2 p-3 rounded-xl', isUser ? 'bg-blue-100 text-right' : 'bg-gray-200 text-left']">
        <strong>{{ isUser ? 'Ты' : 'LLaMA' }}:</strong> {{ message }}
    </div>
</template>

<script setup>
defineProps({
    message: String,
    isUser: Boolean
});
</script>