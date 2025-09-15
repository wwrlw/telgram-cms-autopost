import { MongoService } from './mongoService.js';
import { PostedChannel, ChannelAnalytics, DailyChannelAnalytics } from '../types/index.js';
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
   * Сохраняет дневной срез по всем каналам публикации
   */
  async collectDailySnapshots(postedChannels: PostedChannel[], targetDate?: Date): Promise<void> {
    const now = targetDate || new Date();
    const yyyy = now.getUTCFullYear();
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(now.getUTCDate()).padStart(2, '0');
    const dateKey = `${yyyy}-${mm}-${dd}`;

    const dayStartUtc = new Date(Date.UTC(yyyy, now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const dayEndUtc = new Date(Date.UTC(yyyy, now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    console.log(`📅 Собираем дневные срезы за ${dateKey} (${dayStartUtc.toISOString()} - ${dayEndUtc.toISOString()})`);

    for (const channel of postedChannels) {
      try {
        const analytics = await this.collectChannelAnalytics(channel);
        if (!analytics) continue;

        const dayStats = await this.calculateDailyMetricsForEntity(channel, analytics.channel_id, analytics.subscribers_count, dayStartUtc, dayEndUtc);

        const doc: DailyChannelAnalytics = {
          date: dateKey,
          channel_id: analytics.channel_id,
          channel_name: analytics.channel_name,
          subscribers_count: analytics.subscribers_count,
          views: Number(analytics.avg_views) || 0,
          er: Number(analytics.avg_er) || 0,
          views_day: dayStats.views_day,
          er_day: dayStats.er_day,
          posts_day: dayStats.posts_day,
          created_at: new Date()
        };

        await this.mongoService.upsertDailyChannelAnalytics(doc);
        console.log(`✅ Дневной срез сохранен для ${channel.name}: posts_day=${dayStats.posts_day}, views_day=${dayStats.views_day}, er_day=${dayStats.er_day}`);
      } catch (e) {
        console.error(`❌ Ошибка сохранения дневного среза для ${channel.name}:`, e);
      }
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  /**
   * Собирает дневную аналитику за конкретную дату
   */
  async collectDailySnapshotsForDate(postedChannels: PostedChannel[], date: string): Promise<void> {
    const targetDate = new Date(date + 'T00:00:00.000Z');
    await this.collectDailySnapshots(postedChannels, targetDate);
  }

  private async calculateDailyMetricsForEntity(channel: PostedChannel, channelId: string, subscribersCount: number, start: Date, end: Date): Promise<{ views_day: number; er_day: number; posts_day: number; }> {
    try {
      console.log(`📅 Расчёт дневных метрик для ${channel.name} за период: ${start.toISOString()} - ${end.toISOString()}`);
      
      const parsedId = parseInt(channel.channel_id);
      let telegramChannelId = Math.abs(parsedId);
      if (telegramChannelId < 1_000_000_000_000) {
        telegramChannelId = 1_000_000_000_000 + telegramChannelId;
      }

      let entity: any;
      try {
        entity = await this.client.getEntity(telegramChannelId);
      } catch {}
      if (!entity) {
        try { entity = await this.client.getEntity(-telegramChannelId); } catch {}
      }
      if (!entity) {
        try { entity = await this.client.getEntity(new Api.PeerChannel({ channelId: BigInt(telegramChannelId) as any })); } catch {}
      }
      if (!entity) {
        console.log(`⚠️ Не удалось получить entity для канала ${channel.name}`);
        return { views_day: 0, er_day: 0, posts_day: 0 };
      }

      let offsetId = 0;
      const batchSize = 100;
      let posts: any[] = [];
      let totalMessagesFetched = 0;
      
      // Увеличиваем количество батчей для поиска сообщений за нужный день
      for (let i = 0; i < 20; i++) {
        const messages: any[] = await this.client.getMessages(entity, { limit: batchSize, offsetId });
        if (!messages || messages.length === 0) break;
        
        totalMessagesFetched += messages.length;
        console.log(`📨 Получено ${messages.length} сообщений в батче ${i + 1}`);
        
        for (const msg of messages) {
          const msgDate = msg.date instanceof Date ? msg.date : new Date(msg.date);
          const msgUtc = new Date(msgDate.getTime());
          
          // Добавляем отладочную информацию для первых нескольких сообщений
          if (posts.length < 5) {
            console.log(`📅 Сообщение ${msg.id}: ${msgUtc.toISOString()} (в диапазоне: ${msgUtc >= start && msgUtc <= end})`);
          }
          
          if (msgUtc >= start && msgUtc <= end) {
            posts.push(msg);
          }
        }
        
        offsetId = messages[messages.length - 1].id;
        const oldestDate = messages[messages.length - 1]?.date;
        if (oldestDate && new Date(oldestDate) < start) break;
      }

      console.log(`📊 Всего получено сообщений: ${totalMessagesFetched}, отфильтровано по дате: ${posts.length}`);

      let totalViews = 0;
      let totalReactions = 0;
      let postsWithStats = 0;
      
      for (const message of posts) {
        if (message.views !== undefined && message.views !== null) {
          totalViews += Number(message.views);
          postsWithStats++;
        }
        if (message.reactions && message.reactions.results && Array.isArray(message.reactions.results)) {
          const messageReactions = message.reactions.results.reduce((total: number, reaction: any) => total + (Number(reaction.count) || 0), 0);
          totalReactions += messageReactions;
        }
      }

      const views_day = postsWithStats > 0 ? Math.round((totalViews / postsWithStats) * 100) / 100 : 0;
      const er_day = postsWithStats > 0 ? Math.round(((totalReactions / postsWithStats) / Math.max(1, subscribersCount)) * 10000) / 100 : 0;

      console.log(`📈 Результат для ${channel.name}: views_day=${views_day}, er_day=${er_day}, posts_day=${postsWithStats}`);

      return { views_day, er_day, posts_day: postsWithStats };
    } catch (e) {
      console.error('❌ Ошибка расчёта дневных метрик:', e);
      return { views_day: 0, er_day: 0, posts_day: 0 };
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
