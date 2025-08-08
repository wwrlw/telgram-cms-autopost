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
                    console.log("IntersectionObserver entry:", {
                        isIntersecting: entry.isIntersecting,
                        isLoading: isLoading.value,
                        hasMore: hasMore.value,
                        enabled: enabled,
                    });

                    if (
                        entry.isIntersecting &&
                        !isLoading.value &&
                        hasMore.value &&
                        enabled
                    ) {
                        console.log("Triggering infinite scroll callback");
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
        console.log("Created IntersectionObserver with options:", {
            threshold,
            rootMargin,
        });
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
        console.log("Started loading");
    };

    const stopLoading = () => {
        isLoading.value = false;
        console.log("Stopped loading");
    };

    const setHasMore = (value) => {
        hasMore.value = value;
        console.log("Set hasMore to:", value);
    };

    const destroy = () => {
        if (observer.value) {
            observer.value.disconnect();
            observer.value = null;
            console.log("Destroyed observer");
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
