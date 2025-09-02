import { ChannelConfig } from '../types/index.js';

export interface Channel {
  id: string;
  username: string;
  channel_id: number;
  is_private: boolean;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  userId: string;
}

export interface ScheduledPost {
  _id: string;
  text: string;
  url?: string;
  media?: any[];
  scheduled_at: string;
  scheduled_channel_id: string;
  created_at: string;
  source_channel: string;
}

export interface PostedChannel {
  _id?: string;
  name: string;
  channel_id: string;
  is_private: boolean;
  is_active: boolean;
  signature: string;
}

export interface ChannelAnalytics {
  channel_id: string;
  channel_name: string;
  subscribers_count: number;
  avg_views: number;
  avg_er: number;
  posts_count: number;
  last_updated: Date;
  created_at: Date;
}

export class ApiService {
  private baseUrl: string;
  private token: string | null = null;
  private username: string;
  private password: string;

  constructor(baseUrl: string, username: string, password: string) {
    this.baseUrl = baseUrl;
    this.username = username;
    this.password = password;
  }

  private async login(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: this.username,
          password: this.password,
        }),
      });

      if (!response.ok) {
        throw new Error(`Login failed: ${response.statusText}`);
      }

      const data = await response.json() as { success: boolean; data: AuthResponse };
      if (data.success && data.data.token) {
        this.token = data.data.token;
        console.log('🔐 Successfully authenticated with API');
      } else {
        throw new Error('Login failed: invalid response');
      }
    } catch (error) {
      console.error('❌ API login error:', error);
      throw error;
    }
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.token) {
      await this.login();
    }
  }

  async getChannelIds(): Promise<number[]> {
    await this.ensureAuthenticated();

    try {
      const response = await fetch(`${this.baseUrl}/channels/parser/ids`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        // Token expired, try to login again
        this.token = null;
        await this.ensureAuthenticated();
        
        const retryResponse = await fetch(`${this.baseUrl}/channels/parser/ids`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!retryResponse.ok) {
          throw new Error(`Failed to get channel IDs: ${retryResponse.statusText}`);
        }

        const retryData = await retryResponse.json() as { success: boolean; data: number[] };
        return retryData.data || [];
      }

      if (!response.ok) {
        throw new Error(`Failed to get channel IDs: ${response.statusText}`);
      }

      const data = await response.json() as { success: boolean; data: number[] };
      return data.data || [];
    } catch (error) {
      console.error('❌ Error fetching channel IDs:', error);
      throw error;
    }
  }

  async getPostedChannels(): Promise<PostedChannel[]> {
    await this.ensureAuthenticated();

    try {
      const response = await fetch(`${this.baseUrl}/posted-channels/active`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        this.token = null;
        await this.ensureAuthenticated();
      }

      const retryResponse = await fetch(`${this.baseUrl}/posted-channels/active`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!retryResponse.ok) {
        throw new Error(`Failed to get channels: ${retryResponse.statusText}`);
      }

      const retryData = await retryResponse.json() as { success: boolean; data: PostedChannel[] };
      return retryData.data || [];
    }
    catch(error) {
      console.log(error);
      return [];
    }
  }

  async getAllChannels(): Promise<Channel[]> {
    await this.ensureAuthenticated();

    try {
      const response = await fetch(`${this.baseUrl}/channels`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        // Token expired, try to login again
        this.token = null;
        await this.ensureAuthenticated();
        
        const retryResponse = await fetch(`${this.baseUrl}/channels`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!retryResponse.ok) {
          throw new Error(`Failed to get channels: ${retryResponse.statusText}`);
        }

        const retryData = await retryResponse.json() as { success: boolean; data: Channel[] };
        return retryData.data || [];
      }

      if (!response.ok) {
        throw new Error(`Failed to get channels: ${response.statusText}`);
      }

      const data = await response.json() as { success: boolean; data: Channel[] };
      return data.data || [];
    } catch (error) {
      console.error('❌ Error fetching channels:', error);
      throw error;
    }
  }

  async getChannelConfigs(): Promise<ChannelConfig[]> {
    await this.ensureAuthenticated();

    try {
      const response = await fetch(`${this.baseUrl}/channels`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        // Token expired, try to login again
        this.token = null;
        await this.ensureAuthenticated();
        
        const retryResponse = await fetch(`${this.baseUrl}/channels`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!retryResponse.ok) {
          throw new Error(`Failed to get channel configs: ${retryResponse.statusText}`);
        }

        const retryData = await retryResponse.json() as { success: boolean; data: Channel[] };
        return this.mapChannelsToConfigs(retryData.data || []);
      }

      if (!response.ok) {
        throw new Error(`Failed to get channel configs: ${response.statusText}`);
      }

      const data = await response.json() as { success: boolean; data: Channel[] };
      return this.mapChannelsToConfigs(data.data || []);
    } catch (error) {
      console.error('❌ Error fetching channel configs:', error);
      throw error;
    }
  }

  private mapChannelsToConfigs(channels: Channel[]): ChannelConfig[] {
    return channels.map(channel => ({
      id: channel.channel_id,
      username: channel.username,
      title: undefined, // Will be fetched from Telegram
      is_private: channel.is_private
    }));
  }

  async getScheduledPosts(): Promise<ScheduledPost[]> {
    await this.ensureAuthenticated();

    try {
      const response = await fetch(`${this.baseUrl}/posts/scheduled`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        this.token = null;
        await this.ensureAuthenticated();
        
        const retryResponse = await fetch(`${this.baseUrl}/posts/scheduled`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!retryResponse.ok) {
          throw new Error(`Failed to get scheduled posts: ${retryResponse.statusText}`);
        }

        const retryData = await retryResponse.json() as { success: boolean; data: ScheduledPost[] };
        return retryData.data || [];
      }

      if (!response.ok) {
        throw new Error(`Failed to get scheduled posts: ${response.statusText}`);
      }

      const data = await response.json() as { success: boolean; data: ScheduledPost[] };
      return data.data || [];
    } catch (error) {
      console.error('❌ Error fetching scheduled posts:', error);
      throw error;
    }
  }

  async publishToChannel(postId: string, channelId: string): Promise<boolean> {
    await this.ensureAuthenticated();

    try {
      const response = await fetch(`${this.baseUrl}/publish/${postId}/${channelId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (response.status === 401) {
        this.token = null;
        await this.ensureAuthenticated();
        
        const retryResponse = await fetch(`${this.baseUrl}/publish/${postId}/${channelId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
          },
        });

        if (!retryResponse.ok) {
          console.error(`Failed to publish post: ${retryResponse.statusText}`);
          return false;
        }

        const retryData = await retryResponse.json() as { success: boolean };
        return retryData.success;
      }

      if (!response.ok) {
        console.error(`Failed to publish post: ${response.statusText}`);
        return false;
      }

      const data = await response.json() as { success: boolean };
      return data.success;
    } catch (error) {
      console.error('❌ Error publishing post:', error);
      return false;
    }
  }

  async getActivePostedChannels(): Promise<PostedChannel[]> {
    await this.ensureAuthenticated();

    try {
      const response = await fetch(`${this.baseUrl}/posted-channels/active`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        this.token = null;
        await this.ensureAuthenticated();
        
        const retryResponse = await fetch(`${this.baseUrl}/posted-channels/active`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!retryResponse.ok) {
          throw new Error(`Failed to get posted channels: ${retryResponse.statusText}`);
        }

        const retryData = await retryResponse.json() as { success: boolean; data: PostedChannel[] };
        return retryData.data || [];
      }

      if (!response.ok) {
        throw new Error(`Failed to get posted channels: ${response.statusText}`);
      }

      const data = await response.json() as { success: boolean; data: PostedChannel[] };
      return data.data || [];
    } catch (error) {
      console.error('❌ Error fetching posted channels:', error);
      return [];
    }
  }
} 