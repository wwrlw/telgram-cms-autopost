import { ObjectId } from 'mongodb';

export interface Channel {
  _id?: ObjectId;
  username: string;
  channel_id: number;
  category_id?: ObjectId;
  created_at: Date;
}

export interface CreateChannelDto {
  username: string;
  channel_id: number;
  category_id?: ObjectId;
}

export interface ChannelResponse {
  id: string;
  username: string;
  channel_id: number;
  category_id?: string;
  created_at: Date;
} 