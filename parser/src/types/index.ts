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
  stats?: PostStats;
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
  stats?: PostStats;
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