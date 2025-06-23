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