import { ITelegramPublishService } from '../interfaces/services/ITelegramPublishService';
import { Post } from '../models/Post';
import { PostedChannel } from '../types/PostedChannel';
import { QueueService } from '../queues/QueueService';

export class MTProtoPublishService implements ITelegramPublishService {
  private queueService: QueueService;

  constructor() {
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

  async deletePost(messageId: string, channelId: string): Promise<{ success: boolean; message: string; messageId?: string }> {
    try {
      console.log('📤 Добавляем задачу публикации в очередь...');
      
      const jobId = await this.queueService.deletePost(
        messageId,
        channelId,
      );

      return { 
        success: true, 
        message: `Задача публикации добавлена в очередь (ID: ${jobId})`,
        messageId: jobId,
      };
    } catch (error) {
      console.error('❌ Ошибка добавления задачи в очередь:', error);
      return { 
        success: false, 
        message: 'Ошибка добавления задачи в очередь' 
      };
    }
  }


  async schedulePost(post: Post, channel: PostedChannel, scheduleDate: Date): Promise<{ success: boolean; message: string; scheduledMessageId?: string }> {
    try {
      console.log('📤 Добавляем задачу публикации в очередь...');
      
      const jobId = await this.queueService.schedulePost(
        post?._id?.toString() || '',
        channel.channel_id,
        post,
        channel,
        scheduleDate
      );
  
      return { 
        success: true, 
        message: `Задача публикации добавлена в очередь (ID: ${jobId})`,
        scheduledMessageId: jobId,
      };
    } catch (error) {
      console.error('❌ Ошибка добавления задачи в очередь:', error);
      return { 
        success: false, 
        message: 'Ошибка добавления задачи в очередь' 
      };
    }
  }


  async getScheduledMessages(channelId: string): Promise<any[]> {
    try {
      const jobId = await this.queueService.getScheduledMessages(channelId);
      console.log(`📤 Задача получения отложенных сообщений добавлена в очередь: ${jobId}`);
      return []; // Возвращаем пустой массив, так как результат будет обработан воркером
    } catch (error) {
      console.error('❌ Ошибка добавления задачи получения отложенных сообщений в очередь:', error);
      return [];
    }
  }
  
  async editScheduledMessage(scheduledMessageId: number, channelId: string, newScheduleDate: Date): Promise<{ success: boolean; message: string }> {
    try {
      // Здесь можно добавить метод editScheduledMessage в QueueService если нужно
      console.log('📤 Редактирование отложенного сообщения через очередь не реализовано');
      return { success: false, message: 'Редактирование отложенных сообщений не реализовано' };
    } catch (error) {
      console.error('❌ Ошибка редактирования отложенного сообщения:', error);
      return { success: false, message: 'Ошибка редактирования отложенного сообщения' };
    }
  }
  
  async deleteScheduledMessage(scheduledMessageId: number, channelId: string): Promise<{ success: boolean; message: string }> {
    try {
      const jobId = await this.queueService.deleteScheduledMessage(scheduledMessageId, channelId);
      console.log(`📤 Задача удаления отложенного сообщения добавлена в очередь: ${jobId}`);
      return { 
        success: true, 
        message: `Задача удаления отложенного сообщения добавлена в очередь (ID: ${jobId})` 
      };
    } catch (error) {
      console.error('❌ Ошибка добавления задачи удаления отложенного сообщения в очередь:', error);
      return { success: false, message: 'Ошибка добавления задачи в очередь' };
    }
  }
  
  async sendScheduledMessages(scheduledMessageIds: number[], channelId: string): Promise<{ success: boolean; message: string }> {
    try {
      const jobId = await this.queueService.sendScheduledMessages(scheduledMessageIds, channelId);
      console.log(`📤 Задача отправки отложенных сообщений добавлена в очередь: ${jobId}`);
      return { 
        success: true, 
        message: `Задача отправки отложенных сообщений добавлена в очередь (ID: ${jobId})` 
      };
    } catch (error) {
      console.error('❌ Ошибка добавления задачи отправки отложенных сообщений в очередь:', error);
      return { success: false, message: 'Ошибка добавления задачи в очередь' };
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