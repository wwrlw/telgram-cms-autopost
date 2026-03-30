import { TelegramClient } from 'telegram';
import { ChannelConfig } from '../../types/index.js';
import { configToEntityArg, toRawId, peerToStoredId } from './channel-id.utils.js';

export class ChannelService {
  private targetChannels: ChannelConfig[] = [];

  constructor(private client: TelegramClient) {}

  getTargetChannels(): ChannelConfig[] {
    return this.targetChannels;
  }

  async updateTargetChannels(channels: ChannelConfig[]): Promise<void> {
    console.log('🔄 Обновляем целевые каналы...');
    console.log('📋 Старые каналы:', this.targetChannels.map(c => c.id));
    console.log('📋 Новые каналы:', channels.map(c => c.id));

    this.targetChannels = channels;

    if (channels.length > 0) {
      await this.checkChannelsAccess();
      console.log(`✅ Обновлено ${channels.length} целевых каналов`);
    } else {
      console.log('⚠️ Список целевых каналов пуст');
    }
  }

  async checkChannelsAccess(): Promise<void> {
    console.log('🔍 Проверяем доступ к каналам...');

    for (const channelConfig of this.targetChannels) {
      try {
        const entity = await this.client.getEntity(configToEntityArg(channelConfig));
        const username = (entity as any).username || `channel_${Math.abs(channelConfig.id)}`;
        const title = (entity as any).title || 'Unknown';
        const privacyStatus = channelConfig.is_private ? '🔒 Private' : '🔓 Public';
        console.log(`✅ Канал ${channelConfig.id}: ${title} (@${username}) [${privacyStatus}]`);
      } catch (error) {
        console.error(`❌ Не удалось получить доступ к каналу ${channelConfig.id}:`, error);
      }
    }
  }

  async resolveEntity(channelConfig: ChannelConfig): Promise<any> {
    return await this.client.getEntity(configToEntityArg(channelConfig));
  }

  /** peer объект gramjs → stored ID для БД (-100 префикс) */
  getFullChannelId(peer: any): number {
    return peerToStoredId(peer);
  }

  /** stored/any ID → raw ID без префикса */
  normalizeChannelId(id: number): number {
    return toRawId(id);
  }

  async getChannelIdentifier(peer: any, channelConfig?: ChannelConfig): Promise<string> {
    try {
      const entity = await this.client.getEntity(peer);

      if (channelConfig) {
        if (channelConfig.is_private) {
          const channelId = peer.channelId || peer.userId || peer.chatId;
          return channelId.toString();
        } else {
          if (channelConfig.username) {
            return channelConfig.username.replace('@', '');
          }
          if ((entity as any).username) {
            return (entity as any).username;
          }
        }
      }

      if ((entity as any).username) {
        return (entity as any).username;
      }

      const channelId = peer.channelId || peer.userId || peer.chatId;
      return channelId.toString();
    } catch (error) {
      console.error('❌ Ошибка получения идентификатора канала:', error);
      const channelId = peer.channelId || peer.userId || peer.chatId;
      return channelId.toString();
    }
  }
}
