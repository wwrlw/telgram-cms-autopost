import { ITelegramPublishService } from '../interfaces/services/ITelegramPublishService';
import { Post } from '../models/Post';
import { PostedChannel } from '../types/PostedChannel';

export class TelegramPublishService implements ITelegramPublishService {
  private botToken: string;
  private baseUrl: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '8175655426:AAEw_vSc04q4LJ44Jg4WqX0rmLITy_R-hNE';
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  async publishPost(post: Post, channel: PostedChannel): Promise<{ success: boolean; message: string }> {
    try {
      const messageText = this.formatMessageText(post, channel);
      
      const response = await fetch(`${this.baseUrl}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: channel.channel_id,
          text: messageText,
          parse_mode: 'HTML',
          disable_web_page_preview: true
        })
      });

      const result = await response.json();

      if (result.ok) {
        if (post.media && post.media.length > 0) {
          await this.sendMedia(post, channel, messageText);
        }

        return { 
          success: true, 
          message: `Пост успешно опубликован в канал ${channel.name}` 
        };
      } else {
        return { 
          success: false, 
          message: `Ошибка Telegram API: ${result.description}` 
        };
      }
    } catch (error) {
      console.error('Ошибка при публикации в Telegram:', error);
      return { 
        success: false, 
        message: 'Ошибка при отправке в Telegram' 
      };
    }
  }

  private formatMessageText(post: Post, channel: PostedChannel): string {
    let text = post.text;
    
    if (channel.signature) {
      text += `\n\n${channel.signature}`;
    }

    return text;
  }

  private async sendMedia(post: Post, channel: PostedChannel, caption: string): Promise<void> {
    try {
      for (const media of post.media) {
        const mediaType = media.type;
        const method = this.getMediaMethod(mediaType);
        
        if (method) {
          await fetch(`${this.baseUrl}/${method}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chat_id: channel.channel_id,
              [mediaType]: media.file_path,
              caption,
              parse_mode: 'HTML'
            })
          });
        }
      }
    } catch (error) {
      console.error('Ошибка при отправке медиа:', error);
    }
  }

  private getMediaMethod(mediaType: string): string | null {
    const mediaMethods: { [key: string]: string } = {
      'photo': 'sendPhoto',
      'video': 'sendVideo',
      'document': 'sendDocument',
      'audio': 'sendAudio',
      'voice': 'sendVoice'
    };
    
    return mediaMethods[mediaType] || null;
  }
} 
