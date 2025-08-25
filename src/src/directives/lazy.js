function setImage(el, l) {
    if (el.nodeName === "IMG") {
        el.src = l;
    } else {
        el.style.backgroundImage = 'url("' + l + '")';
    }
}
export default {
    created(el, binding) {
        if (binding.value) {
            let l = binding.value.split(" ").join("%20");
            if (typeof IntersectionObserver === "undefined") {
                setImage(el, l);
                return;
            }

            if (!("isIntersecting" in IntersectionObserverEntry.prototype)) {
                setImage(el);
                return;
            }

            var io = new IntersectionObserver((entries, observer) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setImage(el, l);
                        observer.disconnect();
                    }
                });
            });
            io.observe(el);
        }
    },

    updated(el, binding) {
        if (binding.value) {
            let l = binding.value.split(" ").join("%20");
            if (typeof IntersectionObserver === "undefined") {
                setImage(el, l);
                return;
            }

            if (!("isIntersecting" in IntersectionObserverEntry.prototype)) {
                setImage(el, l);
                return;
            }

            var io = new IntersectionObserver((entries, observer) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setImage(el, l);
                        observer.disconnect();
                    }
                });
            });
            io.observe(el);
        }
    },
};
