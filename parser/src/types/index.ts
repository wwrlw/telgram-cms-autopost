import { ObjectId } from 'mongodb';

export interface Media {
  type: string;
  file_path: string;
}

export interface Post {
  _id?: ObjectId;
  source_channel: string;
  text: string;
  timestamp: Date;
  url: string;
  media: Media[];
  is_unique: boolean;
  created_at: Date;
}

export interface CreatePostDto {
  source_channel: string;
  text: string;
  url: string;
  media?: Media[];
  is_unique?: boolean;
}

export interface ChannelConfig {
  id: number;
  username?: string;
  title?: string;
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