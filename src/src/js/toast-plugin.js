let toastInstance = null;

export default {
    install(app) {
        const toast = {
            success: (message, duration = 5000) => {
                if (toastInstance) {
                    return toastInstance.success(message, duration);
                }
                console.warn("Toast instance not ready");
            },
            error: (message, duration = 8000) => {
                if (toastInstance) {
                    return toastInstance.error(message, duration);
                }
                console.warn("Toast instance not ready");
            },
            clear: () => {
                if (toastInstance) {
                    return toastInstance.clear();
                }
            },
        };

        app.config.globalProperties.$toast = toast;

        if (typeof window !== "undefined") {
            window.$toast = toast;
        }

        app.provide("registerToast", (instance) => {
            toastInstance = instance;
        });
    },
};

export const setToastInstance = (instance) => {
    toastInstance = instance;
};
