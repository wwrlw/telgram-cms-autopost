import { Db, Collection } from 'mongodb';
import { DailyChannelAnalytics } from '../../types/index.js';
import { IAnalyticsRepository } from './analytics.repository.interface.js';

export class AnalyticsRepository implements IAnalyticsRepository {
  private dailyAnalyticsCollection: Collection<DailyChannelAnalytics>;
  private db: Db;

  constructor(db: Db) {
    this.db = db;
    this.dailyAnalyticsCollection = db.collection<DailyChannelAnalytics>('channel_analytics_daily');
  }

  async upsertDailyChannelAnalytics(doc: DailyChannelAnalytics): Promise<void> {
    await this.dailyAnalyticsCollection.updateOne(
      { date: doc.date, channel_id: doc.channel_id },
      { $set: { ...doc } },
      { upsert: true }
    );
  }

  async getDailyAnalyticsByChannel(channelId: string, limit: number = 60): Promise<DailyChannelAnalytics[]> {
    return await this.dailyAnalyticsCollection
      .find({ channel_id: channelId })
      .sort({ date: -1 })
      .limit(limit)
      .toArray();
  }

  async getChannelAnalytics(channelId: string): Promise<any | null> {
    try {
      const analytics = await this.db.collection('channel_analytics')
        .findOne({ channel_id: channelId });

      return analytics as any || null;
    } catch (error) {
      console.error('❌ Ошибка получения аналитики канала:', error);
      return null;
    }
  }

  async createChannelAnalytics(analytics: any): Promise<void> {
    try {
      await this.db.collection('channel_analytics').insertOne(analytics);
    } catch (error) {
      console.error('❌ Ошибка создания аналитики канала:', error);
      throw error;
    }
  }

  async updateChannelAnalytics(channelId: string, updateData: Partial<any>): Promise<void> {
    try {
      await this.db.collection('channel_analytics').updateOne(
        { channel_id: channelId },
        {
          $set: {
            ...updateData,
            last_updated: new Date()
          }
        }
      );
    } catch (error) {
      console.error('❌ Ошибка обновления аналитики канала:', error);
      throw error;
    }
  }
}
