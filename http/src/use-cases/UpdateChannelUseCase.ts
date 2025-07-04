import { IChannelService } from '../interfaces/services/IChannelService';
import { ChannelResponse, Channel } from '../models/Channel';
import { ValidationError } from '../exceptions/ValidationError';

export class UpdateChannelUseCase {
  constructor(private channelService: IChannelService) {}

  async execute(id: string, channelData: Partial<Channel>): Promise<ChannelResponse> {
    if (!id || id.trim().length === 0) {
      throw new ValidationError('Channel ID is required');
    }

    if (!channelData || Object.keys(channelData).length === 0) {
      throw new ValidationError('Channel data is required');
    }

    if (channelData.username !== undefined && channelData.username.trim().length === 0) {
      throw new ValidationError('Username cannot be empty');
    }

    if (channelData.channel_id !== undefined && typeof channelData.channel_id !== 'number') {
      throw new ValidationError('Channel ID must be a number');
    }

    // Валидация формата username (должен начинаться с @ или без)
    if (channelData.username) {
      const username = channelData.username.startsWith('@') 
        ? channelData.username 
        : `@${channelData.username}`;
      
      channelData = {
        ...channelData,
        username
      };
    }

    try {
      return await this.channelService.updateChannel(id, channelData);
    } catch (error) {
      throw error;
    }
  }
}
