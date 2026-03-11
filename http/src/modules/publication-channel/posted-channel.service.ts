import { IPostedChannelService } from './posted-channel.service.interface';
import { IPostedChannelRepository } from './repositories/posted-channel.repository.interface';
import { PostedChannel } from './posted-channel.types';

export class PostedChannelService implements IPostedChannelService {
  constructor(private postedChannelRepository: IPostedChannelRepository) {}

  async getAllPostedChannels(): Promise<PostedChannel[]> {
    return await this.postedChannelRepository.findAll();
  }

  async getPostedChannelById(id: string): Promise<PostedChannel | null> {
    return await this.postedChannelRepository.findById(id);
  }

  async getPostedChannelByChannelId(channelId: string): Promise<PostedChannel | null> {
    return await this.postedChannelRepository.findByChannelId(channelId);
  }

  async createPostedChannel(data: Partial<PostedChannel>): Promise<PostedChannel> {
    return await this.postedChannelRepository.create(data);
  }

  async updatePostedChannel(id: string, data: Partial<PostedChannel>): Promise<PostedChannel | null> {
    return await this.postedChannelRepository.update(id, data);
  }

  async deletePostedChannel(id: string): Promise<boolean> {
    return await this.postedChannelRepository.delete(id);
  }

  async getActivePostedChannels(): Promise<PostedChannel[]> {
    return await this.postedChannelRepository.findActive();
  }
} 