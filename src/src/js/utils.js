export const getMediaUrl = (filePath) => {
    const cleanPath = filePath.replace('/app/', '');
    return `http://127.0.0.1:3001/${cleanPath}`;
};