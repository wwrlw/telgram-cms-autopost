import { Post } from '../../models/Post';
import { PostedChannel } from '../../types/PostedChannel';

export interface ITelegramPublishService {
  publishPost(post: Post, channel: PostedChannel): Promise<{ success: boolean; message: string; messageId?: string }>;
  deletePost(messageId: string, channelId: string): Promise<{ success: boolean; message: string; messageId?: string }>;
  schedulePost(post: Post, channel: PostedChannel, scheduleDate: Date): Promise<{ success: boolean; message: string; scheduledMessageId?: string }>;
  getScheduledMessages(channelId: string): Promise<any[]>;
  editScheduledMessage(scheduledMessageId: number, channelId: string, newScheduleDate: Date): Promise<{ success: boolean; message: string }>;
  deleteScheduledMessage(scheduledMessageId: number, channelId: string): Promise<{ success: boolean; message: string }>;
  sendScheduledMessages(scheduledMessageIds: number[], channelId: string): Promise<{ success: boolean; message: string }>;
} 