import { TelegramClient } from 'telegram';
import { Api } from 'telegram';
import { ChannelStats, ChannelConfig } from '../types/index.js';
import { MongoService } from './mongoService.js';

export class ChannelStatsService {
  constructor(
    private client: TelegramClient,
    private mongoService: MongoService
  ) {}

  /**
   * Получает количество подписчиков канала через Telegram API
   */
  async getChannelSubscribersCount(channelConfig: ChannelConfig): Promise<number | null> {
    try {
      console.log(`📊 Получаем количество подписчиков для канала ${channelConfig.id}...`);
      
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

      const participantsCount = (entity as any).participantsCount;
      
      if (participantsCount !== undefined) {
        console.log(`👥 Канал ${channelConfig.id}: ${participantsCount} подписчиков`);
        return Number(participantsCount);
      } else {
        console.log(`⚠️ Не удалось получить количество подписчиков для канала ${channelConfig.id}`);
        return null;
      }
      
    } catch (error: any) {
      console.error(`❌ Ошибка получения подписчиков для канала ${channelConfig.id}:`, error?.message || error);
      return null;
    }
  }

  /**
   * Обновляет статистику каналов в базе данных
   */
  async updateChannelsStats(targetChannels: ChannelConfig[]): Promise<void> {
    console.log('🔄 Начинаем обновление статистики каналов...');
    
    let updatedCount = 0;
    let skippedCount = 0;

    for (const channelConfig of targetChannels) {
      try {
        const subscribersCount = await this.getChannelSubscribersCount(channelConfig);
        
        if (subscribersCount !== null) {
          // Получаем идентификатор канала для поиска
          const sourceChannel = await this.getChannelIdentifier(channelConfig);
          
          const channelStats: ChannelStats = {
            channel_id: channelConfig.id,
            source_channel: sourceChannel,
            subscribers_count: subscribersCount,
            last_updated: new Date()
          };

          await this.mongoService.saveChannelStats(channelStats);
          console.log(`✅ Обновлена статистика канала ${channelConfig.id}: ${subscribersCount} подписчиков`);
          updatedCount++;
        } else {
          console.log(`⚠️ Пропускаем канал ${channelConfig.id} - не удалось получить статистику`);
          skippedCount++;
        }

        // Добавляем задержку между запросами
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Ошибка обновления статистики канала ${channelConfig.id}:`, error);
        skippedCount++;
      }
    }

    console.log(`✅ Обновление статистики каналов завершено. Обновлено: ${updatedCount}, Пропущено: ${skippedCount}`);
  }

  /**
   * Получает количество подписчиков канала из базы данных
   */
  async getChannelSubscribersFromDB(channelId: number): Promise<number> {
    try {
      const channelStats = await this.mongoService.getChannelStats(channelId);
      
      if (channelStats && channelStats.subscribers_count > 0) {
        console.log(`📊 Подписчики канала ${channelId} из БД: ${channelStats.subscribers_count}`);
        return channelStats.subscribers_count;
      } else {
        console.log(`⚠️ Нет данных о подписчиках канала ${channelId} в БД, используем значение по умолчанию`);
        return 1000;
      }
    } catch (error) {
      console.error(`❌ Ошибка получения подписчиков канала ${channelId} из БД:`, error);
      return 1000;
    }
  }

  /**
   * Получает идентификатор канала (username или ID)
   */
  private async getChannelIdentifier(channelConfig: ChannelConfig): Promise<string> {
    try {
      if (!channelConfig.is_private && channelConfig.username) {
        return channelConfig.username.replace('@', '');
      }

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

      if ((entity as any).username) {
        return (entity as any).username;
      }
      
      return `channel_${Math.abs(channelConfig.id)}`;
      
    } catch (error) {
      console.error('❌ Ошибка получения идентификатора канала:', error);
      return `channel_${Math.abs(channelConfig.id)}`;
    }
  }
} 