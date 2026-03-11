import { Db, Collection } from 'mongodb';
import { ChannelStats } from '../../types/index.js';
import { IChannelStatsRepository } from './channel.repository.interface.js';

export class ChannelStatsRepository implements IChannelStatsRepository {
  private collection: Collection<ChannelStats>;

  constructor(db: Db) {
    this.collection = db.collection<ChannelStats>('channel_stats');
  }

  async saveChannelStats(channelStats: ChannelStats): Promise<void> {
    try {
      await this.collection.updateOne(
        { channel_id: channelStats.channel_id },
        {
          $set: {
            source_channel: channelStats.source_channel,
            subscribers_count: channelStats.subscribers_count,
            last_updated: channelStats.last_updated
          }
        },
        { upsert: true }
      );
    } catch (error) {
      console.error('❌ Ошибка сохранения статистики канала:', error);
      throw error;
    }
  }

  async getChannelStats(channelId: number): Promise<ChannelStats | null> {
    try {
      const channelStats = await this.collection.findOne({ channel_id: channelId });
      return channelStats;
    } catch (error) {
      console.error(`❌ Ошибка получения статистики канала ${channelId}:`, error);
      return null;
    }
  }

  async getAllChannelStats(): Promise<ChannelStats[]> {
    try {
      return await this.collection.find({}).sort({ last_updated: -1 }).toArray();
    } catch (error) {
      console.error('❌ Ошибка получения статистики каналов:', error);
      return [];
    }
  }
}
