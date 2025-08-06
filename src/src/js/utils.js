export const getMediaUrl = (filePath) => {
    if (!filePath || typeof filePath !== "string") {
        console.warn("Invalid filePath:", filePath);
        return "";
    }

    try {
        const cleanPath = filePath.replace("/app/", "");
        const baseUrl =
            import.meta.env.VITE_API_URL || "https://tg.chiorio.com";

        // Если путь уже полный URL, возвращаем как есть
        if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
            return filePath;
        }

        // Убираем лишние слеши и нормализуем путь
        const normalizedPath = cleanPath
            .replace(/^\/+/, "")
            .replace(/\/+/g, "/");

        // Создаем базовый URL без параметров качества
        let url = `${baseUrl}/${normalizedPath}`;

        return url;
    } catch (error) {
        console.warn("Error creating media URL:", error);
        return "";
    }
};

// Отдельная функция для получения URL изображений без параметров качества
export const getCoverImageUrl = (filePath) => {
    if (!filePath || typeof filePath !== "string") {
        console.warn("Invalid filePath:", filePath);
        return "";
    }

    try {
        const cleanPath = filePath.replace("/app/", "");
        const baseUrl =
            import.meta.env.VITE_API_URL || "https://tg.chiorio.com";

        // Если путь уже полный URL, возвращаем как есть
        if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
            return filePath;
        }

        // Убираем лишние слеши и нормализуем путь
        const normalizedPath = cleanPath
            .replace(/^\/+/, "")
            .replace(/\/+/g, "/");

        // Создаем базовый URL БЕЗ параметров
        let url = `${baseUrl}/${normalizedPath}`;

        return url;
    } catch (error) {
        console.warn("Error creating cover image URL:", error);
        return "";
    }
};

// Функция для определения оптимального object-fit на основе ориентации
export const getOptimalObjectFit = (mediaType, isVertical = false) => {
    // Для вертикальных медиа используем contain, чтобы не обрезать
    if (isVertical) {
        return "object-contain";
    }

    // Для горизонтальных медиа используем cover для лучшего заполнения
    return "object-cover";
};

// Функция для определения ориентации медиа по размеру
export const detectMediaOrientation = (width, height) => {
    if (!width || !height) return "horizontal";
    return width > height ? "horizontal" : "vertical";
};

// Функция для получения единого квадратного формата для всех медиа
export const getSquareMediaClasses = (context = "preview") => {
    const baseClasses = "transition-all duration-300";

    if (context === "preview") {
        return `${baseClasses} w-full h-full object-cover`;
    } else if (context === "viewer") {
        return `${baseClasses} max-w-full max-h-full object-contain`;
    } else if (context === "thumbnail") {
        return `${baseClasses} w-full h-full object-cover`;
    }

    return `${baseClasses} w-full h-full object-cover`;
};

// Функция для получения стандартных классов для медиа (устаревшая, используйте getSquareMediaClasses)
export const getMediaClasses = (
    mediaType,
    isVertical = false,
    context = "preview"
) => {
    return getSquareMediaClasses(context);
};

// Функции для работы с медиа
export const hasPhoto = (post) => {
    if (!post.media) return false;
    if (Array.isArray(post.media)) {
        return post.media.some(
            (m) => m.type === "photo" || m.type === "MessageMediaPhoto"
        );
    }
    return (
        post.media.type === "photo" || post.media.type === "MessageMediaPhoto"
    );
};

export const hasVideo = (post) => {
    if (!post.media) return false;
    if (Array.isArray(post.media)) {
        return post.media.some(
            (m) =>
                m.type === "video" ||
                m.type === "MessageMediaDocument" ||
                m.type === "document"
        );
    }
    return (
        post.media.type === "video" ||
        post.media.type === "MessageMediaDocument" ||
        post.media.type === "document"
    );
};

export const getFirstPhoto = (post) => {
    if (!post.media || !Array.isArray(post.media)) return null;
    return post.media.find(
        (media) => media.type === "photo" || media.type === "MessageMediaPhoto"
    );
};

export const getFirstVideo = (post) => {
    if (!post.media || !Array.isArray(post.media)) return null;
    return post.media.find(
        (media) =>
            media.type === "video" ||
            media.type === "MessageMediaDocument" ||
            media.type === "document"
    );
};

export const formatNumber = (num) => {
    if (typeof num !== "number") {
        return "";
    }
    return num.toLocaleString("ru-RU");
};

export const extractTitle = (text) => {
    if (!text) return "Без заголовка";
    const firstSentence = text.split("\n\n")[0];
    return firstSentence.length > 80
        ? firstSentence.substring(0, 80) + "..."
        : firstSentence;
};

export const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};
