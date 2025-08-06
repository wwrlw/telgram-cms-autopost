<template>
    <div
        class="post-skeleton bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
    >
        <div class="aspect-video bg-gray-200 skeleton"></div>
        <div class="p-4 space-y-3">
            <div class="h-4 bg-gray-200 rounded skeleton w-3/4"></div>
            <div class="space-y-2">
                <div class="h-3 bg-gray-200 rounded skeleton"></div>
                <div class="h-3 bg-gray-200 rounded skeleton w-5/6"></div>
                <div class="h-3 bg-gray-200 rounded skeleton w-4/5"></div>
            </div>
            <div class="flex items-center justify-between">
                <div class="h-6 bg-gray-200 rounded skeleton w-20"></div>
                <div class="h-3 bg-gray-200 rounded skeleton w-16"></div>
            </div>
        </div>
    </div>
</template>

<script setup>
// Компонент скелетона для постов
</script>

<style scoped>
.post-skeleton {
    animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
