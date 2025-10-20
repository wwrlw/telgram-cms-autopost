import { DependencyContainer } from '../container/DependencyContainer';
import { CreateChannelDto } from '../models/Channel';

export class ChannelController {
  private channelService = DependencyContainer.getInstance().getChannelService();

  async list() {
    return this.channelService.getAllChannels();
  }

  async get(id: string) {
    return this.channelService.getChannelById(id);
  }

  async create(body: CreateChannelDto) {
    const username = body.username?.startsWith('@') ? body.username : `@${body.username}`;
    return this.channelService.createChannel({ ...body, username });
  }

  async update(id: string, body: Partial<CreateChannelDto>) {
    return this.channelService.updateChannel(id, body as any);
  }

  async remove(id: string) {
    return this.channelService.deleteChannel(id);
  }

  async getParserIds() {
    return this.channelService.getChannelIdsForParser();
  }
}


