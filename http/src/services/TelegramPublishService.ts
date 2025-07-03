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
      console.log('Пост:', {
        id: post._id,
        text: post.text?.substring(0, 100) + '...',
        media: post.media?.length || 0
      });
      console.log('Канал:', {
        id: channel.channel_id,
        name: channel.name
      });

      const messageText = this.formatMessageText(post, channel);
      console.log('Отформатированный текст:', messageText);
      
      const requestBody = {
        chat_id: channel.channel_id,
        text: messageText,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      };
      
      console.log('Запрос к Telegram API:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${this.baseUrl}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();
      console.log('Ответ от Telegram API:', JSON.stringify(result, null, 2));

      if (result.ok) {
        console.log('✅ Текстовое сообщение отправлено успешно');
        
        if (post.media && post.media.length > 0) {
          console.log(`📎 Отправляем ${post.media.length} медиа-файлов`);
          await this.sendMedia(post, channel, messageText);
        }

        return { 
          success: true, 
          message: `Пост успешно опубликован в канал ${channel.name}` 
        };
      } else {
        console.error('❌ Ошибка Telegram API:', result.description);
        return { 
          success: false, 
          message: `Ошибка Telegram API: ${result.description}` 
        };
      }
    } catch (error) {
      console.error('❌ Ошибка при публикации в Telegram:', error);
      return { 
        success: false, 
        message: 'Ошибка при отправке в Telegram' 
      };
    } finally {
      console.log('=== КОНЕЦ ПУБЛИКАЦИИ В TELEGRAM ===');
    }
  }

  private formatMessageText(post: Post, channel: PostedChannel): string {
    const text = (post.text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
      .replace(/\*(.*?)\*/g, '<i>$1</i>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
      .replace(/\r\n|\r|\n/g, '\n'); // только \n для Telegram

    let result = text;
    if (channel.signature) {
      if (result) result += '\n\n';
      result += channel.signature;
    }

    // Удаляем все теги кроме поддерживаемых Telegram
    result = result.replace(/<(?!\/?(b|i|a|code|pre)\b)[^>]*>/gi, '');

    // Удаляем все <br>, <br/>, <br /> из результата (включая сигнатуру)
    result = result.replace(/<br\s*\/?>/gi, '\n');

    console.log('ИТОГОВОЕ СООБЩЕНИЕ В TELEGRAM:', result);
    return result;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  private async sendMedia(post: Post, channel: PostedChannel, caption: string): Promise<void> {
    try {
      for (let i = 0; i < post.media.length; i++) {
        const media = post.media[i];
        console.log(`📎 Отправляем медиа ${i + 1}/${post.media.length}:`, {
          type: media.type,
          file_path: media.file_path
        });

        const mediaType = media.type;
        const method = this.getMediaMethod(mediaType);
        
        if (method) {
          const publicUrl = `http://localhost:3001${media.file_path}`;
          console.log('Публичный URL медиа:', publicUrl);
          
          // Проверяем доступность файла
          try {
            const fileCheckResponse = await fetch(publicUrl, { method: 'HEAD' });
            console.log('Статус доступности файла:', fileCheckResponse.status);
            if (!fileCheckResponse.ok) {
              console.error('❌ Файл недоступен по URL:', publicUrl);
            }
          } catch (fileError) {
            console.error('❌ Ошибка при проверке файла:', fileError);
          }

          const mediaRequestBody = {
            chat_id: channel.channel_id,
            [mediaType]: publicUrl,
            caption: this.markdownToHtml(caption),
            parse_mode: 'HTML'
          };
          
          console.log('Запрос медиа к Telegram API:', JSON.stringify(mediaRequestBody, null, 2));

          const mediaResponse = await fetch(`${this.baseUrl}/${method}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(mediaRequestBody)
          });

          const mediaResult = await mediaResponse.json();
          console.log('Ответ от Telegram API (медиа):', JSON.stringify(mediaResult, null, 2));

          if (mediaResult.ok) {
            console.log(`✅ Медиа ${i + 1} отправлено успешно`);
          } else {
            console.error(`❌ Ошибка отправки медиа ${i + 1}:`, mediaResult.description);
          }
        } else {
          console.error(`❌ Неизвестный тип медиа: ${mediaType}`);
        }
      }
    } catch (error) {
      console.error('❌ Ошибка при отправке медиа:', error);
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

  private markdownToHtml(text: string): string {
    // Простое преобразование Markdown в HTML
    return text
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')  // **жирный** -> <b>жирный</b>
      .replace(/\*(.*?)\*/g, '<i>$1</i>')      // *курсив* -> <i>курсив</i>
      .replace(/`(.*?)`/g, '<code>$1</code>')  // `код` -> <code>код</code>
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>'); // [текст](ссылка) -> <a href="ссылка">текст</a>
  }
} 
