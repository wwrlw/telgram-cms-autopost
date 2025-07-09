export const getMediaUrl = (filePath) => {
  const cleanPath = filePath.replace("/app/", "");
  const baseUrl = import.meta.env.VITE_API_URL;
  return `${baseUrl}${cleanPath}`;
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

export const hasPhoto = (post) => {
  if (!post.media) return false;
  if (Array.isArray(post.media)) {
    return post.media.some(
      (m) => m.type === "photo" || m.type === "MessageMediaPhoto"
    );
  }
  return post.media.type === "photo" || post.media.type === "MessageMediaPhoto";
};
