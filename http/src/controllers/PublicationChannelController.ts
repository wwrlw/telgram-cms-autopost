import { DependencyContainer } from '../container/DependencyContainer';
import { CreatePublicationChannelDto, UpdatePublicationChannelDto } from '../models/PublicationChannel';

export class PublicationChannelController {
  private publicationChannelService = DependencyContainer.getInstance().getPublicationChannelService();

  async list() {
    return this.publicationChannelService.getAllPublicationChannels();
  }

  async listActive() {
    return this.publicationChannelService.getActivePublicationChannels();
  }

  async get(id: string) {
    return this.publicationChannelService.getPublicationChannelById(id);
  }

  async create(body: CreatePublicationChannelDto) {
    return this.publicationChannelService.createPublicationChannel(body);
  }

  async update(id: string, body: UpdatePublicationChannelDto) {
    return this.publicationChannelService.updatePublicationChannel(id, body);
  }

  async remove(id: string) {
    return this.publicationChannelService.deletePublicationChannel(id);
  }
}


