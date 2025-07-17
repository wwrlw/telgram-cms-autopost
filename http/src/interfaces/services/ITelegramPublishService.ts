import { Post } from '../../models/Post';
import { PostedChannel } from '../../types/PostedChannel';

export interface ITelegramPublishService {
  publishPost(post: Post, channel: PostedChannel): Promise<{ success: boolean; message: string; messageId?: string }>;
  deletePost(messageId: string, channelId: string): Promise<{ success: boolean; message: string }>;
  getChannelAnalytics(channelId: string): Promise<any>;
} 