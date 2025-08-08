import { ref, onUnmounted } from "vue";

export function useInfiniteScroll(options = {}) {
    const { threshold = 100, rootMargin = "0px", enabled = true } = options;

    const isLoading = ref(false);
    const hasMore = ref(true);
    const observer = ref(null);

    const createObserver = (callback) => {
        if (typeof IntersectionObserver === "undefined") {
            console.warn("IntersectionObserver not supported");
            return null;
        }

        const obs = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (
                        entry.isIntersecting &&
                        !isLoading.value &&
                        hasMore.value &&
                        enabled
                    ) {
                        callback();
                    }
                });
            },
            {
                rootMargin: `${threshold}px ${rootMargin}`,
                threshold: 0.1,
            }
        );

        observer.value = obs;
        return obs;
    };

    const observeElement = (element) => {
        if (!element || !observer.value) return;

        observer.value.observe(element);
    };

    const unobserveElement = (element) => {
        if (!element || !observer.value) return;

        observer.value.unobserve(element);
    };

    const startLoading = () => {
        isLoading.value = true;
    };

    const stopLoading = () => {
        isLoading.value = false;
    };

    const setHasMore = (value) => {
        hasMore.value = value;
    };

    const destroy = () => {
        if (observer.value) {
            observer.value.disconnect();
            observer.value = null;
        }
    };

    onUnmounted(() => {
        destroy();
    });

    return {
        isLoading,
        hasMore,
        createObserver,
        observeElement,
        unobserveElement,
        startLoading,
        stopLoading,
        setHasMore,
        destroy,
    };
}
