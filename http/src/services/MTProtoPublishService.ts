import { ITelegramPublishService } from '../interfaces/services/ITelegramPublishService';
import { Post } from '../models/Post';
import { PostedChannel } from '../types/PostedChannel';
import { QueueService } from '../queues/QueueService';

export class MTProtoPublishService implements ITelegramPublishService {
  private parserApiUrl: string;
  private parserApiUsername: string;
  private parserApiPassword: string;
  private queueService: QueueService;

  constructor() {
    this.parserApiUrl = process.env.PARSER_API_URL || 'http://localhost:3003';
    this.parserApiUsername = process.env.API_USERNAME || 'myuser';
    this.parserApiPassword = process.env.API_PASSWORD || 'mypassword';
    this.queueService = new QueueService();
  }

  async publishPost(post: Post, channel: PostedChannel): Promise<{ success: boolean; message: string; messageId?: string }> {
    try {
      console.log('📤 Добавляем задачу публикации в очередь...');
      
      const jobId = await this.queueService.publishPost(
        post?._id?.toString() || '',
        channel.channel_id,
        post,
        channel
      );

      return { 
        success: true, 
        message: `Задача публикации добавлена в очередь (ID: ${jobId})`,
        messageId: jobId
      };
    } catch (error) {
      console.error('❌ Ошибка добавления задачи в очередь:', error);
      return { 
        success: false, 
        message: 'Ошибка добавления задачи в очередь' 
      };
    }
  }

  async deletePost(messageId: string, channelId: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Удаляем пост через парсер:', { messageId, channelId });

      const response = await this.callParserAPI('DELETE', '/publish/mtproto/post', {
        messageId: parseInt(messageId),
        channelId
      });

      return response;
    } catch (error) {
      console.error('❌ Ошибка удаления поста через парсер:', error);
      return { success: false, message: 'Ошибка удаления поста через парсер' };
    }
  }


  async schedulePost(post: Post, channel: PostedChannel, scheduleDate: Date): Promise<{ success: boolean; message: string; scheduledMessageId?: string }> {
    try {
      console.log('=== НАЧАЛО ПЛАНИРОВАНИЯ ЧЕРЕЗ ПАРСЕР ===');
      console.log('Планируем пост через парсер на:', scheduleDate.toISOString());

      const response = await this.callParserAPI('POST', '/publish/mtproto/schedule', {
        post,
        channel,
        scheduleDate: scheduleDate.toISOString()
      });

      console.log('✅ Ответ от парсера (планирование):', response);
      return response;

    } catch (error) {
      console.error('❌ Ошибка планирования через парсер:', error);
      return { success: false, message: 'Критическая ошибка при планировании через MTProto' };
    } finally {
      console.log('=== КОНЕЦ ПЛАНИРОВАНИЯ ЧЕРЕЗ ПАРСЕР ===');
    }
  }


  async getScheduledMessages(channelId: string): Promise<any[]> {
    try {
      const response = await this.callParserAPI('GET', `/publish/mtproto/scheduled/${channelId}`);
      return response.data || [];
    } catch (error) {
      console.error('❌ Ошибка получения отложенных сообщений через парсер:', error);
      return [];
    }
  }


  async editScheduledMessage(scheduledMessageId: number, channelId: string, newScheduleDate: Date): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.callParserAPI('PUT', '/publish/mtproto/scheduled/edit', {
        scheduledMessageId,
        channelId,
        newScheduleDate: newScheduleDate.toISOString()
      });

      return response;
    } catch (error) {
      console.error('❌ Ошибка редактирования отложенного сообщения через парсер:', error);
      return { success: false, message: 'Ошибка редактирования отложенного сообщения' };
    }
  }


  async deleteScheduledMessage(scheduledMessageId: number, channelId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.callParserAPI('DELETE', '/publish/mtproto/scheduled', {
        scheduledMessageId,
        channelId
      });

      return response;
    } catch (error) {
      console.error('❌ Ошибка удаления отложенного сообщения через парсер:', error);
      return { success: false, message: 'Ошибка удаления отложенного сообщения' };
    }
  }


  async sendScheduledMessages(scheduledMessageIds: number[], channelId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.callParserAPI('POST', '/publish/mtproto/scheduled/send', {
        scheduledMessageIds,
        channelId
      });

      return response;
    } catch (error) {
      console.error('❌ Ошибка отправки отложенных сообщений через парсер:', error);
      return { success: false, message: 'Ошибка отправки отложенных сообщений' };
    }
  }

  private async callParserAPI(method: string, endpoint: string, data?: any): Promise<any> {
    try {
      const url = `${this.parserApiUrl}${endpoint}`;
      
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${this.parserApiUsername}:${this.parserApiPassword}`).toString('base64')}`
        }
      };

      if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
      }

      console.log(`📡 Вызываем парсер API: ${method} ${url}`);
      if (data) {
        console.log('📤 Данные:', JSON.stringify(data, null, 2));
      }

      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Parser API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('📥 Ответ от парсера:', JSON.stringify(result, null, 2));
      
      return result;
    } catch (error) {
      console.error('❌ Ошибка вызова парсера API:', error);
      throw error;
    }
  }

  private formatMessageText(post: Post, channel: PostedChannel): string {
    const isHtml = (post as any)?.format === 'html';
    let result = post.text || '';

    if (isHtml) {
      result = result.replace(/<\/p>/gi, '\n').replace(/<p>/gi, '');
      const allowed = '(?:b|strong|i|em|u|s|del|strike|a|code|pre|br|blockquote|tg-emoji|span)';
      result = result.replace(new RegExp(`<(?!(?:\/?${allowed})\\b)[^>]*>`, 'gi'), '');
      result = result.replace(/<span(?![^>]*class=["'][^"']*tg-spoiler[^"']*["'])[\s\S]*?>/gi, '');
      result = result
        .replace(/<strong>/gi, '<b>')
        .replace(/<\/strong>/gi, '</b>')
        .replace(/<em>/gi, '<i>')
        .replace(/<\/em>/gi, '</i>');
      result = result.replace(/<a\s+([^>]*href=["'][^"']+["'][^>]*)>/gi, (_m: string, attrs: string) => {
        if (/\brel=/.test(attrs)) return `<a ${attrs}>`;
        return `<a ${attrs} rel="noopener noreferrer">`;
      });
      result = result.replace(/<br\s*\/?>(?=\s*\n?)/gi, '\n');
    } else {
      result = (post.text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        .replace(/\*(.*?)\*/g, '<i>$1</i>')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
        .replace(/\r\n|\r|\n/g, '\n');
      result = result.replace(/<(?!\/?(b|i|a|code|pre)\b)[^>]*>/gi, '');
      result = result.replace(/<br\s*\/?>(?=\s*\n?)/gi, '\n');
    }

    if (channel.signature) {
      if (result) result += '\n\n';
      result += channel.signature;
    }

    console.log('ИТОГОВОЕ СООБЩЕНИЕ В TELEGRAM:', result);
    return result;
  }
}