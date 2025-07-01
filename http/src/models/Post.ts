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
  scheduled_at?: Date;
  scheduled_channel_id?: string;
  is_published?: boolean;
  published_at?: Date;
  updated_at?: Date;
}

export interface CreatePostDto {
  source_channel: string;
  text: string;
  url: string;
  media?: Media[];
  is_unique?: boolean;
} 