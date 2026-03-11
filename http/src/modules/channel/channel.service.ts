import { ObjectId } from 'mongodb';
import { IChannelService } from './channel.service.interface';
import { IChannelRepository } from './repositories/channel.repository.interface';
import { 
  Channel, 
  CreateChannelDto, 
  ChannelResponse 
} from './channel.model';
import { NotFoundError } from '../../shared/exceptions/not-found.error';

export class ChannelService implements IChannelService {
  constructor(private channelRepository: IChannelRepository) {}

  async createChannel(channelData: CreateChannelDto): Promise<ChannelResponse> {
    const channel = await this.channelRepository.create({
      ...channelData,
      is_private: channelData.is_private ?? false
    });

    return {
      id: channel._id?.toString() || '',
      username: channel.username,
      channel_id: channel.channel_id,
      category_id: channel.category_id?.toString(),
      is_private: channel.is_private,
      prompt: channel.prompt,
      created_at: channel.created_at
    };
  }

  async getChannelById(id: string): Promise<ChannelResponse> {
    const channel = await this.channelRepository.findById(id);
    
    if (!channel) {
      throw new NotFoundError('Channel not found');
    }

    return {
      id: channel._id?.toString() || '',
      username: channel.username,
      channel_id: channel.channel_id,
      category_id: channel.category_id?.toString(),
      is_private: channel.is_private,
      prompt: channel.prompt,
      created_at: channel.created_at
    };
  }

  async getAllChannels(): Promise<ChannelResponse[]> {
    const channels = await this.channelRepository.findAll();
    
    return channels.map(channel => ({
      id: channel._id?.toString() || '',
      username: channel.username,
      channel_id: channel.channel_id,
      category_id: channel.category_id?.toString(),
      is_private: channel.is_private,
      prompt: channel.prompt,
      created_at: channel.created_at
    }));
  }

  async updateChannel(id: string, channelData: Partial<Channel>): Promise<ChannelResponse> {
    const updatedChannel = await this.channelRepository.update(id, channelData);
    
    if (!updatedChannel) {
      throw new NotFoundError('Channel not found');
    }

    return {
      id: updatedChannel._id?.toString() || '',
      username: updatedChannel.username,
      channel_id: updatedChannel.channel_id,
      category_id: updatedChannel.category_id?.toString(),
      is_private: updatedChannel.is_private,
      prompt: updatedChannel.prompt,
      created_at: updatedChannel.created_at
    };
  }

  async deleteChannel(id: string): Promise<boolean> {
    const deleted = await this.channelRepository.deleteById(id);
    if (!deleted) {
      throw new NotFoundError('Channel not found');
    }
    return deleted;
  }

  async getChannelIdsForParser(): Promise<number[]> {
    const channels = await this.channelRepository.findAll();
    return channels.map(channel => channel.channel_id);
  }

  async getChannelsByCategory(categoryId: string): Promise<ChannelResponse[]> {
    const channels = await this.channelRepository.findByCategory(categoryId);
    
    return channels.map(channel => ({
      id: channel._id?.toString() || '',
      username: channel.username,
      channel_id: channel.channel_id,
      category_id: channel.category_id?.toString(),
      is_private: channel.is_private,
      prompt: channel.prompt,
      created_at: channel.created_at
    }));
  }

  async updateChannelCategory(id: string, categoryId: string): Promise<ChannelResponse> {
    const updatedChannel = await this.channelRepository.update(id, {
      category_id: new ObjectId(categoryId)
    });
    
    if (!updatedChannel) {
      throw new NotFoundError('Channel not found');
    }

    return {
      id: updatedChannel._id?.toString() || '',
      username: updatedChannel.username,
      channel_id: updatedChannel.channel_id,
      category_id: updatedChannel.category_id?.toString(),
      is_private: updatedChannel.is_private,
      prompt: updatedChannel.prompt,
      created_at: updatedChannel.created_at
    };
  }
} 