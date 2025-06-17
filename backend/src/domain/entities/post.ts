import { IPost } from "../interface/post.interface";

export const postEntities = (data: IPost) => {
    return {
        id: data._id?.toString(),
        source_channel: data.source_channel,
        text: data.text,
        timestamp: data.timestamp,
        url: data.url,
        is_unique: data.is_unique,
        unique_text: data.unique_text || '',
        media: data.media || [],
        has_media: Boolean(data.media && data.media.length > 0)
    };
};