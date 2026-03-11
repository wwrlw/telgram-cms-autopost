import { HttpClient } from '../../core/api/http.client.js';
import { PostedChannel } from '../../types/index.js';

export class PostedChannelApi {
  constructor(private http: HttpClient) {}

  async getActivePostedChannels(): Promise<PostedChannel[]> {
    try {
      const data = await this.http.request<{ success: boolean; data: PostedChannel[] }>('/posted-channels/active');
      return data.data || [];
    } catch (error) {
      console.error('❌ Error fetching active posted channels:', error);
      return [];
    }
  }
}
