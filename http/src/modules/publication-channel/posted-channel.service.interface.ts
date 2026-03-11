import { PostedChannel } from './posted-channel.types';

export interface IPostedChannelService {
  getAllPostedChannels(): Promise<PostedChannel[]>;
  getPostedChannelById(id: string): Promise<PostedChannel | null>;
  getPostedChannelByChannelId(channelId: string): Promise<PostedChannel | null>;
  createPostedChannel(data: Partial<PostedChannel>): Promise<PostedChannel>;
  updatePostedChannel(id: string, data: Partial<PostedChannel>): Promise<PostedChannel | null>;
  deletePostedChannel(id: string): Promise<boolean>;
  getActivePostedChannels(): Promise<PostedChannel[]>;
} 