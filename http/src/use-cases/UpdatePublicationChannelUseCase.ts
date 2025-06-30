import { IPublicationChannelService } from '../interfaces/services/IPublicationChannelService';
import { UpdatePublicationChannelDto, PublicationChannelResponse } from '../models/PublicationChannel';
import { ValidationError } from '../exceptions/ValidationError';

export class UpdatePublicationChannelUseCase {
  constructor(private publicationChannelService: IPublicationChannelService) {}

  async execute(id: string, channelData: UpdatePublicationChannelDto): Promise<PublicationChannelResponse> {
    if (!id || id.trim().length === 0) {
      throw new ValidationError('Channel ID is required');
    }
    if (channelData.name !== undefined && channelData.name.trim().length === 0) {
      throw new ValidationError('Channel name cannot be empty');
    }

    if (channelData.channel_id !== undefined && channelData.channel_id.trim().length === 0) {
      throw new ValidationError('Channel ID cannot be empty');
    }

    if (channelData.channel_type !== undefined && !['public', 'private'].includes(channelData.channel_type)) {
      throw new ValidationError('Channel type must be either "public" or "private"');
    }

    return await this.publicationChannelService.updatePublicationChannel(id, channelData);
  }
} 