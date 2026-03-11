import { PostedChannel } from '../posted-channel.types';

export interface IPostedChannelRepository {
  findAll(): Promise<PostedChannel[]>;
  findById(id: string): Promise<PostedChannel | null>;
  findByChannelId(channelId: string): Promise<PostedChannel | null>;
  create(data: Partial<PostedChannel>): Promise<PostedChannel>;
  update(id: string, data: Partial<PostedChannel>): Promise<PostedChannel | null>;
  delete(id: string): Promise<boolean>;
  findActive(): Promise<PostedChannel[]>;
} 