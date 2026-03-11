import { HttpClient } from '../../core/api/http.client.js';

export class PostApi {
  constructor(private http: HttpClient) {}

  async getScheduledPosts(): Promise<any[]> {
    try {
      const data = await this.http.request<{ success: boolean; data: any[] }>('/posts/scheduled');
      return data.data || [];
    } catch (error) {
      console.error('❌ Error fetching scheduled posts:', error);
      return [];
    }
  }

  async saveScheduledMessageId(postId: string, scheduledMessageId: string): Promise<boolean> {
    try {
      await this.http.request(`/posts/${postId}/scheduled-message-id`, {
        method: 'PUT',
        body: JSON.stringify({ scheduled_message_id: scheduledMessageId }),
      });
      return true;
    } catch (error) {
      console.error('❌ Error saving scheduled message ID:', error);
      return false;
    }
  }

  async savePublishedMessageId(postId: string, messageId: string, channelId: string): Promise<boolean> {
    try {
      await this.http.request(`/posts/${postId}/published-message-id`, {
        method: 'PUT',
        body: JSON.stringify({ telegram_message_id: messageId, published_channel_id: channelId }),
      });
      return true;
    } catch (error) {
      console.error('❌ Error saving published message ID:', error);
      return false;
    }
  }

  async updateScheduledPostAsPublished(postId: string): Promise<boolean> {
    try {
      await this.http.request(`/posts/${postId}/mark-scheduled-as-published`, { method: 'PUT' });
      return true;
    } catch (error) {
      console.error('❌ Error marking scheduled post as published:', error);
      return false;
    }
  }
}
