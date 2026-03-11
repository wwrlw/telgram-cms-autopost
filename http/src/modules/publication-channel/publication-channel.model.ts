import { ObjectId } from 'mongodb';

export interface PublicationChannel {
  _id?: ObjectId;
  name: string;
  channel_id: string;
  is_private: boolean;
  is_active: boolean;
  bot_token?: string;
  signature?: string;
  prompt?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreatePublicationChannelDto {
  name: string;
  channel_id: string;
  is_private: boolean;
  is_active?: boolean;
  bot_token?: string;
  prompt?: string;
  signature?: string;
}

export interface UpdatePublicationChannelDto {
  name?: string;
  channel_id?: string;
  is_private?: boolean;
  is_active?: boolean;
  bot_token?: string;
  prompt?: string;
  signature?: string;
}

export interface PublicationChannelResponse {
  id: string;
  name: string;
  channel_id: string;
  is_private: boolean;
  is_active: boolean;
  bot_token?: string;
  signature?: string;
  prompt?: string;
  created_at: Date;
  updated_at: Date;
} 