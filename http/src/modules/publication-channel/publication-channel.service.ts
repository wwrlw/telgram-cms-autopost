import { IPublicationChannelService } from '../interfaces/services/IPublicationChannelService';
import { IPublicationChannelRepository } from '../interfaces/repositories/IPublicationChannelRepository';
import { PublicationChannel, CreatePublicationChannelDto, UpdatePublicationChannelDto, PublicationChannelResponse } from '../models/PublicationChannel';
import { NotFoundError } from '../exceptions/NotFoundError';

export class PublicationChannelService implements IPublicationChannelService {
  constructor(private publicationChannelRepository: IPublicationChannelRepository) {}

  async createPublicationChannel(channelData: CreatePublicationChannelDto): Promise<PublicationChannelResponse> {
    const channel = await this.publicationChannelRepository.create(channelData);
    return this.mapToResponse(channel);
  }

  async getPublicationChannelById(id: string): Promise<PublicationChannelResponse> {
    const channel = await this.publicationChannelRepository.findById(id);
    if (!channel) {
      throw new NotFoundError('Publication channel not found');
    }
    return this.mapToResponse(channel);
  }

  async getAllPublicationChannels(): Promise<PublicationChannelResponse[]> {
    const channels = await this.publicationChannelRepository.findAll();
    return channels.map(channel => this.mapToResponse(channel));
  }

  async getActivePublicationChannels(): Promise<PublicationChannelResponse[]> {
    const channels = await this.publicationChannelRepository.findActiveChannels();
    return channels.map(channel => this.mapToResponse(channel));
  }

  async updatePublicationChannel(id: string, channelData: UpdatePublicationChannelDto): Promise<PublicationChannelResponse> {
    const channel = await this.publicationChannelRepository.update(id, channelData);
    if (!channel) {
      throw new NotFoundError('Publication channel not found');
    }
    return this.mapToResponse(channel);
  }

  async deletePublicationChannel(id: string): Promise<boolean> {
    const deleted = await this.publicationChannelRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError('Publication channel not found');
    }
    return deleted;
  }

  private mapToResponse(channel: PublicationChannel): PublicationChannelResponse {
    return {
      id: channel._id!.toString(),
      name: channel.name,
      channel_id: channel.channel_id,
      is_private: channel.is_private,
      is_active: channel.is_active,
      bot_token: channel.bot_token,
      signature: channel.signature,
      prompt: channel.prompt,
      created_at: channel.created_at,
      updated_at: channel.updated_at
    };
  }
} 