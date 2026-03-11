import { Channel, CreateChannelDto, ChannelResponse } from './channel.model';

export interface IChannelService {
  createChannel(channelData: CreateChannelDto): Promise<ChannelResponse>;
  getChannelById(id: string): Promise<ChannelResponse>;
  getAllChannels(): Promise<ChannelResponse[]>;
  getChannelsByCategory(categoryId: string): Promise<ChannelResponse[]>;
  updateChannel(id: string, channelData: Partial<Channel>): Promise<ChannelResponse>;
  updateChannelCategory(id: string, categoryId: string): Promise<ChannelResponse>;
  deleteChannel(id: string): Promise<boolean>;
  getChannelIdsForParser(): Promise<number[]>;
} 