import { Types } from 'mongoose'; 
export interface IPost {
    _id?: Types.ObjectId;
    source_channel: string;
    text: string;
    timestamp: Date;
    url: string;
    is_unique: boolean;
    unique_text?: string;
    media?: {
        url: string;
        type: 'image' | 'video' | 'document';
    }[];
}