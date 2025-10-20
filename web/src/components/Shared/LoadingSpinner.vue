<template>
    <div class="loading-spinner" :class="size">
        <div class="spinner"></div>
        <div v-if="text" class="loading-text">{{ text }}</div>
    </div>
</template>

<script setup>
defineProps({
    size: {
        type: String,
        default: "medium",
        validator: (value) => ["small", "medium", "large"].includes(value),
    },
    text: {
        type: String,
        default: "",
    },
});
</script>

<style scoped>
.loading-spinner {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

.spinner {
    border: 2px solid #f3f3f3;
    border-top: 2px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

.loading-spinner.small .spinner {
    width: 1rem;
    height: 1rem;
    border-width: 1px;
}

.loading-spinner.medium .spinner {
    width: 2rem;
    height: 2rem;
    border-width: 2px;
}

.loading-spinner.large .spinner {
    width: 3rem;
    height: 3rem;
    border-width: 3px;
}

.loading-text {
    font-size: 0.875rem;
    color: #6b7280;
    text-align: center;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}
</style>
