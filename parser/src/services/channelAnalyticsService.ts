import { MongoService } from './mongoService.js';
import { PostedChannel, ChannelAnalytics } from '../types/index.js';
import { TelegramClient } from 'telegram';
import { Api } from 'telegram';

export class ChannelAnalyticsService {
  constructor(
    private client: TelegramClient,
    private mongoService: MongoService
  ) {}

  /**
   * Собирает статистику по каналам публикации
   */
  async collectPostedChannelsAnalytics(postedChannels: PostedChannel[]): Promise<void> {
    try {
      console.log('📊 Начинаем сбор аналитики по каналам публикации...');
      
      for (const channel of postedChannels) {
        try {
          console.log(`📊 Собираем статистику для канала: ${channel.name}`);
          
          const analytics = await this.collectChannelAnalytics(channel);
          
          if (analytics) {
            await this.saveChannelAnalytics(analytics);
            console.log(`✅ Аналитика сохранена для канала: ${channel.name}`);
          }
          
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          console.error(`❌ Ошибка сбора статистики для канала ${channel.name}:`, error);
        }
      }
      
      console.log('✅ Сбор аналитики по каналам публикации завершен');
    } catch (error) {
      console.error('❌ Ошибка сбора аналитики по каналам:', error);
    }
  }

  /**
   * Собирает статистику для конкретного канала
   */
  private async collectChannelAnalytics(channel: PostedChannel): Promise<ChannelAnalytics | null> {
    try {
      let entity;
      
      const channelId = parseInt(channel.channel_id);
      let telegramChannelId = Math.abs(channelId);
      
      if (telegramChannelId < 1_000_000_000_000) {
        telegramChannelId = 1_000_000_000_000 + telegramChannelId;
      }
      
      try {
        entity = await this.client.getEntity(telegramChannelId);
      } catch (firstError) {
        try {
          entity = await this.client.getEntity(-telegramChannelId);
        } catch (secondError) {
          try {
            entity = await this.client.getEntity(new Api.PeerChannel({ channelId: BigInt(telegramChannelId) as any }));
          } catch (thirdError) {
            try {
              entity = await this.client.getEntity(new Api.PeerUser({ userId: BigInt(telegramChannelId) as any }));
            } catch (fourthError) {
              try {
                entity = await this.client.getEntity(new Api.PeerChat({ chatId: BigInt(telegramChannelId) as any }));
              } catch (fifthError) {
                console.log(`⚠️ Не удалось получить entity для канала ${channel.name} (ID: ${channel.channel_id})`);
                console.log(`🔍 Пробовали ID: ${telegramChannelId}, -${telegramChannelId}, PeerChannel, PeerUser, PeerChat`);
                return null;
              }
            }
          }
        }
      }

      if (!entity) {
        console.log(`⚠️ Не удалось получить entity для канала ${channel.name}`);
        return null;
      }

      console.log(`✅ Получен entity для канала ${channel.name}:`, {
        id: (entity as any).id,
        title: (entity as any).title,
        username: (entity as any).username,
        className: entity.className
      });

      let subscribersCount = 0;
      
      try {
        if (entity.className === 'Channel' || entity.className === 'Chat') {
          const fullChannel = await this.client.invoke(new Api.channels.GetFullChannel({
            channel: entity
          }));
          
          if (fullChannel.fullChat && (fullChannel.fullChat as any).participantsCount !== undefined) {
            subscribersCount = (fullChannel.fullChat as any).participantsCount;
            console.log(`👥 GetFullChannel: ${subscribersCount} подписчиков`);
          }
        } else if (entity.className === 'User') {
          subscribersCount = 1;
          console.log(`👤 Пользователь: 1 подписчик`);
        }
      } catch (fullChannelError: any) {
        console.log(`⚠️ Не удалось получить полную информацию о канале: ${fullChannelError?.message || fullChannelError}`);
        
        if (entity.className === 'Channel' || entity.className === 'Chat') {
          subscribersCount = (entity as any).participantsCount || 0;
          console.log(`📊 Fallback participantsCount: ${subscribersCount}`);
        }
      }
      
      if (subscribersCount === 0) {
        console.log(`⚠️ Не удалось получить количество подписчиков для канала ${channel.name}`);
        console.log(`🔍 Entity type: ${entity.className}, Properties:`, Object.keys(entity));
      } else {
        console.log(`👥 Канал ${channel.name}: ${subscribersCount} подписчиков`);
      }
      
      const messages = await this.client.getMessages(entity, { limit: 100 });
      
      if (!messages || messages.length === 0) {
        console.log(`⚠️ Нет сообщений для анализа в канале ${channel.name}`);
        return null;
      }

      let totalViews = 0;
      let totalReactions = 0;
      let postsWithStats = 0;
      
      for (const message of messages) {
        if (message.views !== undefined && message.views !== null) {
          totalViews += Number(message.views);
          postsWithStats++;
        }
        
        if (message.reactions && message.reactions.results && Array.isArray(message.reactions.results)) {
          const messageReactions = message.reactions.results.reduce((total: number, reaction: any) => {
            return total + (Number(reaction.count) || 0);
          }, 0);
          totalReactions += messageReactions;
        }
      }

      const avgViews = postsWithStats > 0 ? totalViews / postsWithStats : 0;
      const avgER = subscribersCount > 0 ? (totalReactions / postsWithStats / subscribersCount) * 100 : 0;

      const analytics: ChannelAnalytics = {
        channel_id: channel.channel_id,
        channel_name: channel.name,
        subscribers_count: subscribersCount,
        avg_views: Math.round(avgViews * 100) / 100,
        avg_er: Math.round(avgER * 100) / 100,
        posts_count: postsWithStats,
        last_updated: new Date(),
        created_at: new Date()
      };

      console.log(`📊 Аналитика для канала ${channel.name}:`, {
        subscribers: subscribersCount,
        avg_views: analytics.avg_views,
        avg_er: analytics.avg_er,
        posts_analyzed: postsWithStats
      });

      return analytics;
      
    } catch (error) {
      console.error(`❌ Ошибка сбора аналитики для канала ${channel.name}:`, error);
      return null;
    }
  }

  /**
   * Сохраняет аналитику канала в БД
   */
  private async saveChannelAnalytics(analytics: ChannelAnalytics): Promise<void> {
    try {
      const existing = await this.mongoService.getChannelAnalytics(analytics.channel_id);
      
      if (existing) {
        await this.mongoService.updateChannelAnalytics(analytics.channel_id, {
          subscribers_count: analytics.subscribers_count,
          avg_views: analytics.avg_views,
          avg_er: analytics.avg_er,
          posts_count: analytics.posts_count,
          last_updated: analytics.last_updated
        });
      } else {
        await this.mongoService.createChannelAnalytics(analytics);
      }
    } catch (error) {
      console.error(`❌ Ошибка сохранения аналитики для канала ${analytics.channel_name}:`, error);
    }
  }
}
