import { HttpClient } from '../../core/api/http.client.js';
import { ChannelConfig } from '../../types/index.js';

export interface Channel {
  id: string;
  username: string;
  channel_id: number;
  is_private: boolean;
  prompt?: string;
  created_at: string;
}

export class ChannelApi {
  constructor(private http: HttpClient) {}

  async getChannelConfigs(): Promise<ChannelConfig[]> {
    try {
      const data = await this.http.request<{ success: boolean; data: Channel[] }>('/channels');
      return this.mapChannelsToConfigs(data.data || []);
    } catch (error) {
      console.error('❌ Error fetching channel configs:', error);
      throw error;
    }
  }

  async getAllChannels(): Promise<Channel[]> {
    try {
      const data = await this.http.request<{ success: boolean; data: Channel[] }>('/channels');
      return data.data || [];
    } catch (error) {
      console.error('❌ Error fetching channels:', error);
      throw error;
    }
  }

  async getChannelIds(): Promise<number[]> {
    try {
      const data = await this.http.request<{ success: boolean; data: number[] }>('/channels/parser/ids');
      return data.data || [];
    } catch (error) {
      console.error('❌ Error fetching channel IDs:', error);
      throw error;
    }
  }

  private mapChannelsToConfigs(channels: Channel[]): ChannelConfig[] {
    return channels.map(channel => ({
      id: channel.channel_id,
      username: channel.username,
      title: undefined,
      is_private: channel.is_private,
      prompt: channel.prompt
    }));
  }
}
