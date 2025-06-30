import { IPublicationChannelService } from '../interfaces/services/IPublicationChannelService';
import { ValidationError } from '../exceptions/ValidationError';

export class DeletePublicationChannelUseCase {
  constructor(private publicationChannelService: IPublicationChannelService) {}

  async execute(id: string): Promise<boolean> {
    if (!id || id.trim().length === 0) {
      throw new ValidationError('Channel ID is required');
    }

    return await this.publicationChannelService.deletePublicationChannel(id);
  }
} 