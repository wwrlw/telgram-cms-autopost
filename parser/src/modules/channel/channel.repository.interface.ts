import { ChannelStats } from '../../types/index.js';

export interface IChannelStatsRepository {
  saveChannelStats(stats: ChannelStats): Promise<void>;
  getChannelStats(channelId: number): Promise<ChannelStats | null>;
}
