import { ObjectId } from 'mongodb';

export interface Media {
  type: string;
  file_path: string;
}

export interface PostStats {
  views?: number;
  reactions?: number;
  comments?: number;
  forwards?: number;
  reactions_detail?: { [emoji: string]: number };
}

export interface Post {
  _id?: ObjectId;
  source_channel: string;
  text: string;
  unique_text?: string;
  timestamp: Date;
  url: string;
  media: Media[];
  is_unique: boolean;
  stats?: PostStats;
  category_id?: ObjectId;
  created_at: Date;
  scheduled_at?: Date;
  scheduled_channel_id?: string;
  is_published?: boolean;
  published_at?: Date;
  telegram_message_id?: string;
  published_channel_id?: string;
  updated_at: Date;
}

export interface CreatePostDto {
  source_channel: string;
  text: string;
  unique_text?: string;
  url: string;
  media?: Media[];
  is_unique?: boolean;
  stats?: PostStats;
  category_id?: ObjectId;
} 