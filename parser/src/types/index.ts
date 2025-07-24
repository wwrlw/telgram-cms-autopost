import { ObjectId } from 'mongodb';

export interface Media {
  type: string;
  file_path: string;
  thumbnail_path?: string;
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
  channel_id: number;
  text: string;
  unique_text?: string;
  timestamp: Date;
  url: string;
  media: Media[];
  is_unique: boolean;
  conversion_metrics?: ConversionMetrics; // Только метрики конверсии
  created_at: Date;
  updated_at?: Date;
}

export interface CreatePostDto {
  source_channel: string;
  channel_id: number;
  text: string;
  unique_text?: string;
  url: string;
  media?: Media[];
  is_unique?: boolean;
  conversion_metrics?: ConversionMetrics; // Только метрики конверсии
}

export interface ChannelConfig {
  id: number;
  username?: string;
  title?: string;
  is_private: boolean;
}

export interface ParserConfig {
  apiId: number;
  apiHash: string;
  sessionString: string;
  targetChannelIds: number[];
  mongoUri: string;
  MONGO_DB: string;
  mediaPath: string;
}