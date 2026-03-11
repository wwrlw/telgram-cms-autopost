import { TelegramClient } from 'telegram';
import { Api } from 'telegram';
import { ChannelConfig } from '../../types/index.js';

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
        let entity;

        if (channelConfig.is_private) {
          let telegramChannelId = Math.abs(channelConfig.id);

          if (telegramChannelId > 1_000_000_000_000) {
            telegramChannelId -= 1_000_000_000_000;
          }

          entity = await this.client.getEntity(new Api.PeerChannel({ channelId: BigInt(telegramChannelId) as any }));
        } else {
          if (channelConfig.username) {
            entity = await this.client.getEntity(channelConfig.username.replace('@', ''));
          } else {
            let telegramChannelId = Math.abs(channelConfig.id);

            if (telegramChannelId > 1_000_000_000_000) {
              telegramChannelId -= 1_000_000_000_000;
            }

            entity = await this.client.getEntity(new Api.PeerChannel({ channelId: BigInt(telegramChannelId) as any }));
          }
        }

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
    if (channelConfig.is_private) {
      let telegramChannelId = Math.abs(channelConfig.id);

      if (telegramChannelId > 1_000_000_000_000) {
        telegramChannelId -= 1_000_000_000_000;
      }

      return await this.client.getEntity(new Api.PeerChannel({ channelId: BigInt(telegramChannelId) as any }));
    } else {
      if (channelConfig.username) {
        return await this.client.getEntity(channelConfig.username.replace('@', ''));
      } else {
        let telegramChannelId = Math.abs(channelConfig.id);

        if (telegramChannelId > 1_000_000_000_000) {
          telegramChannelId -= 1_000_000_000_000;
        }

        return await this.client.getEntity(new Api.PeerChannel({ channelId: BigInt(telegramChannelId) as any }));
      }
    }
  }

  getFullChannelId(peer: any): number {
    const rawChannelId = Number(peer.channelId || peer.userId || peer.chatId || 0);

    if (peer.channelId) {
      return -100 * 10000000000 - rawChannelId;
    }

    return rawChannelId;
  }

  normalizeChannelId(id: number): number {
    let n = Math.abs(id);
    if (n > 1_000_000_000_000) {
      n -= 1_000_000_000_000;
    }
    return n;
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
