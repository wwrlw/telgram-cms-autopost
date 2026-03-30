import { TelegramClient, Api } from 'telegram';
import { PostedChannel, ChannelAnalytics, DailyChannelAnalytics } from '../../types/index.js';
import { toExpandedId, toPeerChannel, toPeerUser, toPeerChat } from '../channel/channel-id.utils.js';
import { IAnalyticsRepository } from './analytics.repository.interface.js';

export class AnalyticsService {
  constructor(
    private client: TelegramClient,
    private analyticsRepository: IAnalyticsRepository,
  ) {}

  async collectPostedChannelsAnalytics(postedChannels: PostedChannel[]): Promise<void> {
    try {
      console.log('📊 Начинаем сбор аналитики по каналам публикации...');

      for (const channel of postedChannels) {
        try {
          const analytics = await this.collectChannelAnalytics(channel);

          if (analytics) {
            await this.saveChannelAnalytics(analytics);
          }

          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`❌ Ошибка сбора статистики для канала ${channel.name}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ Ошибка сбора аналитики по каналам:', error);
    }
  }

  async collectDailySnapshots(postedChannels: PostedChannel[], targetDate?: Date): Promise<void> {
    const now = targetDate || new Date();
    const yyyy = now.getUTCFullYear();
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(now.getUTCDate()).padStart(2, '0');
    const dateKey = `${yyyy}-${mm}-${dd}`;

    const dayStartUtc = new Date(Date.UTC(yyyy, now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const dayEndUtc = new Date(Date.UTC(yyyy, now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

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
          err: Number(analytics.avg_err) || 0,
          views_day: dayStats.views_day,
          err_day: dayStats.err_day,
          posts_day: dayStats.posts_day,
          created_at: new Date()
        };

        await this.analyticsRepository.upsertDailyChannelAnalytics(doc);
      } catch (e) {
        console.error(`❌ Ошибка сохранения дневного среза для ${channel.name}:`, e);
      }
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  private async calculateDailyMetricsForEntity(channel: PostedChannel, channelId: string, subscribersCount: number, start: Date, end: Date): Promise<{ views_day: number; err_day: number; posts_day: number; }> {
    try {
      const expandedId = toExpandedId(parseInt(channel.channel_id));

      let entity: any;
      try {
        entity = await this.client.getEntity(expandedId);
      } catch {}
      if (!entity) {
        try { entity = await this.client.getEntity(-expandedId); } catch {}
      }
      if (!entity) {
        try { entity = await this.client.getEntity(toPeerChannel(parseInt(channel.channel_id))); } catch {}
      }
      if (!entity) {
        return { views_day: 0, err_day: 0, posts_day: 0 };
      }

      let offsetId = 0;
      const batchSize = 100;
      let posts: any[] = [];
      let totalMessagesFetched = 0;

      for (let i = 0; i < 20; i++) {
        const messages: any[] = await this.client.getMessages(entity, { limit: batchSize, offsetId });
        if (!messages || messages.length === 0) break;

        totalMessagesFetched += messages.length;

        for (const msg of messages) {
          const msgDate = msg.date instanceof Date ? msg.date : new Date(msg.date);
          const msgUtc = new Date(msgDate.getTime());

          if (msgUtc >= start && msgUtc <= end) {
            posts.push(msg);
          }
        }

        offsetId = messages[messages.length - 1].id;
        const oldestDate = messages[messages.length - 1]?.date;
        if (oldestDate && new Date(oldestDate) < start) break;
      }

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
      const err_day = subscribersCount > 0 ? Math.round(((views_day / subscribersCount) * 100) * 100) / 100 : 0;

      return { views_day, err_day, posts_day: postsWithStats };
    } catch (e) {
      console.error('❌ Ошибка расчёта дневных метрик:', e);
      return { views_day: 0, err_day: 0, posts_day: 0 };
    }
  }


  private async collectChannelAnalytics(channel: PostedChannel): Promise<ChannelAnalytics | null> {
    try {
      let entity;
      const rawId = parseInt(channel.channel_id);
      const expandedId = toExpandedId(rawId);
      try {
        entity = await this.client.getEntity(expandedId);
      } catch {
        try {
          entity = await this.client.getEntity(-expandedId);
        } catch {
          try {
            entity = await this.client.getEntity(toPeerChannel(rawId));
          } catch {
            try {
              entity = await this.client.getEntity(toPeerUser(rawId));
            } catch {
              try {
                entity = await this.client.getEntity(toPeerChat(rawId));
              } catch {
                return null;
              }
            }
          }
        }
      }

      if (!entity) {
        return null;
      }

      let subscribersCount = 0;

      try {
        if (entity.className === 'Channel' || entity.className === 'Chat') {
          const fullChannel = await this.client.invoke(new Api.channels.GetFullChannel({
            channel: entity
          }));

          if (fullChannel.fullChat && (fullChannel.fullChat as any).participantsCount !== undefined) {
            subscribersCount = (fullChannel.fullChat as any).participantsCount;
          }
        } else if (entity.className === 'User') {
          subscribersCount = 1;
        }
      } catch (fullChannelError: any) {
        if (entity.className === 'Channel' || entity.className === 'Chat') {
          subscribersCount = (entity as any).participantsCount || 0;
        }
      }

      const messages = await this.client.getMessages(entity, { limit: 100 });

      if (!messages || messages.length === 0) {
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
      const avgERR = subscribersCount > 0 ? (avgViews / subscribersCount) * 100 : 0;

      const analytics: ChannelAnalytics = {
        channel_id: channel.channel_id,
        channel_name: channel.name,
        subscribers_count: subscribersCount,
        avg_views: Math.round(avgViews * 100) / 100,
        avg_err: Math.round(avgERR * 100) / 100,
        posts_count: postsWithStats,
        last_updated: new Date(),
        created_at: new Date()
      };

      return analytics;
    } catch (error) {
      console.error(`❌ Ошибка сбора аналитики для канала ${channel.name}:`, error);
      return null;
    }
  }


  private async saveChannelAnalytics(analytics: ChannelAnalytics): Promise<void> {
    try {
      const existing = await this.analyticsRepository.getChannelAnalytics(analytics.channel_id);
      if (existing) {
        await this.analyticsRepository.updateChannelAnalytics(analytics.channel_id, {
          subscribers_count: analytics.subscribers_count,
          avg_views: analytics.avg_views,
          avg_err: analytics.avg_err,
          posts_count: analytics.posts_count,
          last_updated: analytics.last_updated
        });
      } else {
        await this.analyticsRepository.createChannelAnalytics(analytics);
      }
    } catch (error) {
      console.error(`❌ Ошибка сохранения аналитики для канала ${analytics.channel_name}:`, error);
    }
  }
}
