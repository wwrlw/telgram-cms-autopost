import { IPublicationChannelService } from '../interfaces/services/IPublicationChannelService';
import { PublicationChannelResponse } from '../models/PublicationChannel';

export class GetActivePublicationChannelsUseCase {
  constructor(private publicationChannelService: IPublicationChannelService) {}

  async execute(): Promise<PublicationChannelResponse[]> {
    return await this.publicationChannelService.getActivePublicationChannels();
  }
} 