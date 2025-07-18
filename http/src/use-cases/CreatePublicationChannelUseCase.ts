import { IPublicationChannelService } from '../interfaces/services/IPublicationChannelService';
import { CreatePublicationChannelDto, PublicationChannelResponse } from '../models/PublicationChannel';
import { ValidationError } from '../exceptions/ValidationError';

export class CreatePublicationChannelUseCase {
  constructor(private publicationChannelService: IPublicationChannelService) {}

  async execute(channelData: CreatePublicationChannelDto): Promise<PublicationChannelResponse> {
    if (!channelData.name || channelData.name.trim().length === 0) {
      throw new ValidationError('Channel name is required');
    }

    if (!channelData.channel_id || channelData.channel_id.trim().length === 0) {
      throw new ValidationError('Channel ID is required');
    }

    if (typeof channelData.is_private !== 'boolean') {
      throw new ValidationError('is_private must be a boolean value');
    }

    return await this.publicationChannelService.createPublicationChannel(channelData);
  }
} 