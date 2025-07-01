export const getMediaUrl = (filePath) => {
    const cleanPath = filePath.replace('/app/', '');
    const baseUrl = import.meta.env.VITE_API_URL;
    return `${baseUrl}${cleanPath}`;
};