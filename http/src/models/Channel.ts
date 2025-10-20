import { ObjectId } from 'mongodb';

export interface Channel {
  _id?: ObjectId;
  username: string;
  channel_id: number;
  category_id?: ObjectId;
  is_private: boolean;
  created_at: Date;
}

export interface CreateChannelDto {
  username: string;
  channel_id: number;
  category_id?: ObjectId;
  is_private?: boolean;
}

export interface ChannelResponse {
  id: string;
  username: string;
  channel_id: number;
  category_id?: string;
  is_private: boolean;
  created_at: Date;
} 