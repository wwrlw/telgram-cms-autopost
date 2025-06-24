<template>
  <div :class="containerClass" class="relative overflow-hidden">
    <img
      v-if="loaded"
      :src="src"
      :alt="alt"
      :class="imageClass"
      class="transition-opacity duration-300"
      @load="onLoad"
      @error="onError"
    />
    <div
      v-else
      :class="placeholderClass"
      class="flex items-center justify-center bg-gray-200 animate-pulse"
    >
      <svg
        v-if="!error"
        class="h-8 w-8 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <svg
        v-else
        class="h-8 w-8 text-red-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    default: ''
  },
  containerClass: {
    type: String,
    default: ''
  },
  imageClass: {
    type: String,
    default: 'w-full h-full object-cover'
  },
  placeholderClass: {
    type: String,
    default: 'w-full h-full'
  },
  lazy: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['load', 'error']);

const loaded = ref(false);
const error = ref(false);
const observer = ref(null);
const imageRef = ref(null);

const onLoad = () => {
  loaded.value = true;
  emit('load');
};

const onError = () => {
  error.value = true;
  emit('error');
};

const loadImage = () => {
  if (!props.src) return;
  
  const img = new Image();
  img.onload = onLoad;
  img.onerror = onError;
  img.src = props.src;
};

onMounted(() => {
  if (!props.lazy) {
    loadImage();
    return;
  }

  if ('IntersectionObserver' in window) {
    observer.value = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadImage();
            observer.value?.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px'
      }
    );

    if (imageRef.value) {
      observer.value.observe(imageRef.value);
    }
  } else {
    loadImage();
  }
});

onUnmounted(() => {
  if (observer.value) {
    observer.value.disconnect();
  }
});
</script> 