import { DailyChannelAnalytics } from '../../types/index.js';

export interface IAnalyticsRepository {
  upsertDailyChannelAnalytics(doc: DailyChannelAnalytics): Promise<void>;
  getDailyAnalyticsByChannel(channelId: string, limit?: number): Promise<DailyChannelAnalytics[]>;
  getChannelAnalytics(channelId: string): Promise<any | null>;
  createChannelAnalytics(analytics: any): Promise<void>;
  updateChannelAnalytics(channelId: string, data: Partial<any>): Promise<void>;
}
