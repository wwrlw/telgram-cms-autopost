import { ObjectId } from 'mongodb';

export interface Media {
  type: string;
  file_path: string;
  thumbnail_path?: string;
  has_spoiler?: boolean;
}

export interface PostStats {
  views?: number;
  reactions?: number;
  comments?: number;
  forwards?: number;
  reactions_detail?: { [emoji: string]: number };
}

export interface ConversionMetrics {
  er?: number;
  err?: number;
  views?: number;
  reactions?: number;
  reactions_detail?: { [emoji: string]: number };
  comments?: number;
  forwards?: number;
}

export interface ChannelStats {
  channel_id: number;
  source_channel: string;
  subscribers_count: number;
  last_updated: Date;
}

export interface Post {
  _id?: ObjectId;
  source_channel: string;
  channel_id?: number;
  text: string;
  unique_text?: string;
  timestamp: Date;
  url: string;
  media: Media[];
  is_unique: boolean;
  format?: 'html' | 'markdown';
  conversion_metrics?: ConversionMetrics; // Только метрики конверсии
  category_id?: ObjectId;
  category_name?: string;
  category_color?: string;
  channel_username?: string;
  created_at: Date;
  scheduled_at?: Date;
  scheduled_channel_id?: string;
  scheduled_message_id?: string;
  is_published?: boolean;
  published_at?: Date;
  telegram_message_id?: string;
  published_channel_id?: string;
  updated_at: Date;
}

export interface CreatePostDto {
  source_channel: string;
  channel_id?: number;
  text: string;
  unique_text?: string;
  url: string;
  media?: Media[];
  is_unique?: boolean;
  format?: 'html' | 'markdown';
  conversion_metrics?: ConversionMetrics; // Только метрики конверсии
  category_id?: ObjectId;
  has_spoiler?: boolean;
} 