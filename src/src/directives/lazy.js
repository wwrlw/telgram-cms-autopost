function setImage(el, src) {
    if (el.nodeName === "IMG") {
        el.src = src;
        el.classList.remove("lazy-loading");
        el.classList.add("lazy-loaded");
        // Убираем любые фильтры размытия
        el.style.filter = "none";
    } else if (el.nodeName === "VIDEO") {
        el.src = src;
        el.classList.remove("lazy-loading");
        el.classList.add("lazy-loaded");
        // Убираем любые фильтры размытия
        el.style.filter = "none";
    } else {
        el.style.backgroundImage = `url("${src}")`;
        el.classList.remove("lazy-loading");
        el.classList.add("lazy-loaded");
    }
}

function createPlaceholder(el) {
    if (el.nodeName === "IMG") {
        el.classList.add("lazy-loading");
        // Убираем размытие, оставляем только прозрачность для плавности
        el.style.opacity = "0.7";
        el.style.transition = "opacity 0.3s ease";
    } else if (el.nodeName === "VIDEO") {
        el.classList.add("lazy-loading");
        // Убираем размытие, оставляем только прозрачность для плавности
        el.style.opacity = "0.7";
        el.style.transition = "opacity 0.3s ease";
    }
}

export default {
    created(el, binding) {
        if (binding.value) {
            let src = binding.value.split(" ").join("%20");

            // Создаем placeholder
            createPlaceholder(el);

            if (typeof IntersectionObserver === "undefined") {
                setImage(el, src);
                return;
            }

            if (!("isIntersecting" in IntersectionObserverEntry.prototype)) {
                setImage(el, src);
                return;
            }

            // Создаем IntersectionObserver с rootMargin для предзагрузки
            const io = new IntersectionObserver(
                (entries, observer) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            // Добавляем небольшую задержку для плавности
                            setTimeout(() => {
                                setImage(el, src);
                            }, 50);
                            observer.disconnect();
                        }
                    });
                },
                {
                    rootMargin: "50px 0px", // Предзагружаем за 50px до появления
                    threshold: 0.1,
                }
            );

            io.observe(el);
        }
    },

    updated(el, binding) {
        if (binding.value) {
            let src = binding.value.split(" ").join("%20");

            // Создаем placeholder
            createPlaceholder(el);

            if (typeof IntersectionObserver === "undefined") {
                setImage(el, src);
                return;
            }

            if (!("isIntersecting" in IntersectionObserverEntry.prototype)) {
                setImage(el, src);
                return;
            }

            // Создаем IntersectionObserver с rootMargin для предзагрузки
            const io = new IntersectionObserver(
                (entries, observer) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            // Добавляем небольшую задержку для плавности
                            setTimeout(() => {
                                setImage(el, src);
                            }, 50);
                            observer.disconnect();
                        }
                    });
                },
                {
                    rootMargin: "50px 0px", // Предзагружаем за 50px до появления
                    threshold: 0.1,
                }
            );

            io.observe(el);
        }
    },
};
