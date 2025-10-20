export interface PostedChannel {
  _id?: string;
  name: string;
  channel_id: string;
  is_private: boolean;
  is_active: boolean;
  signature: string;
  prompt?: string;
}