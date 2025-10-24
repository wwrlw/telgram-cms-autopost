import dotenv from 'dotenv';
dotenv.config();
import { ITelegramPublishService } from '../interfaces/services/ITelegramPublishService';
import { Post } from '../models/Post';
import { PostedChannel } from '../types/PostedChannel';
export class BotPublishService implements ITelegramPublishService {
  private botToken: any;
  private baseUrl: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  async publishPost(post: Post, channel: PostedChannel): Promise<{ success: boolean; message: string; messageId?: string }> {
    try {
      console.log('=== НАЧАЛО ПУБЛИКАЦИИ В TELEGRAM ===');
      console.log('Начинаем публикацию поста:', { 
        id: post._id, 
        textLength: post.text?.length || 0,
        mediaCount: post.media?.length || 0 
      });
      
      if (post.media && post.media.length > 0) {
        console.log('📎 Детали медиафайлов:');
        post.media.forEach((media, index) => {
          console.log(`  ${index + 1}. Тип: ${media.type}, Путь: ${media.file_path}, MIME: ${(media as any).mime_type || 'не указан'}`);
        });
      }
  
      const messageText = this.formatMessageText(post, channel);
      console.log('📝 Форматированный текст для Telegram:', messageText);
  
      if (post.media && post.media.length > 0) {
        console.log(`📎 Обнаружено ${post.media.length} медиа-файлов. Отправляем медиа с подписью.`);
        const result = await this.sendMedia(post, channel, messageText);
        if (result.success) {
          console.log('✅ Пост с медиа успешно опубликован');
          return { 
            success: true, 
            message: `Пост с медиа успешно опубликован в канал ${channel.name}`,
            messageId: result.messageId
          };
        } else {
          console.error('❌ Ошибка публикации медиа:', result.message);
          return { success: false, message: result.message };
        }
      } else {
        console.log('📝 Медиа не найдено. Отправляем текстовое сообщение.');
        const requestBody = {
          chat_id: channel.channel_id,
          text: messageText,
          parse_mode: 'HTML',
          disable_web_page_preview: true
        };
  
        console.log('📤 Отправляем текстовое сообщение в Telegram:', JSON.stringify(requestBody, null, 2));
  
        const response = await fetch(`${this.baseUrl}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
  
        const result = await response.json();
        console.log('Ответ от Telegram API (sendMessage):', JSON.stringify(result, null, 2));
        
        if (!result.ok) {
          console.error('❌ Ошибка Telegram API при отправке текста:', result.description);
          return { success: false, message: `Ошибка Telegram API: ${result.description}` };
        }
  
        console.log('✅ Текстовый пост успешно опубликован');
        return { 
          success: true, 
          message: `Текстовый пост успешно опубликован в канал ${channel.name}`,
          messageId: result.result.message_id.toString()
        };
      }
  
    } catch (error) {
      console.error('❌ Ошибка при публикации в Telegram:', error);
      return { success: false, message: 'Критическая ошибка при отправке в Telegram' };
    } finally {
      console.log('=== КОНЕЦ ПУБЛИКАЦИИ В TELEGRAM ===');
    }
  }

  async deletePost(messageId: string, channelId: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Начинаем удаление поста из Telegram:', { messageId, channelId });

      const requestBody = {
        chat_id: channelId,
        message_id: parseInt(messageId)
      };

      const response = await fetch(`${this.baseUrl}/deleteMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();
      console.log('Ответ от Telegram API (deleteMessage):', JSON.stringify(result, null, 2));

      if (!result.ok) {
        console.error('❌ Ошибка Telegram API при удалении сообщения:', result.description);
        return { success: false, message: `Ошибка Telegram API: ${result.description}` };
      }

      console.log('✅ Пост успешно удален из Telegram');
      return { success: true, message: 'Пост успешно удален из Telegram' };

    } catch (error) {
      console.error('❌ Ошибка при удалении поста из Telegram:', error);
      return { success: false, message: 'Критическая ошибка при удалении из Telegram' };
    }
  }

  async schedulePost(post: Post, channel: PostedChannel, scheduleDate: Date): Promise<{ success: boolean; message: string; scheduledMessageId?: string }> {
    console.warn('Попытка запланировать пост через Bot API, который не поддерживает нативное планирование. Используйте кастомный планировщик.');

    return {
      success: false,
      message: 'Планирование постов не поддерживается напрямую через Bot API. Эта функция доступна только для MTProto.'
    };
  }

  async getScheduledMessages(channelId: string): Promise<any[]> {
    console.warn('Попытка получить отложенные сообщения через Bot API, который не поддерживает эту функцию.');
    return [];
  }

  async editScheduledMessage(scheduledMessageId: number, channelId: string, newScheduleDate: Date): Promise<{ success: boolean; message: string }> {
    console.warn('Попытка запланировать пост через Bot API, который не поддерживает нативное планирование. Используйте кастомный планировщик.');
     return {
      success: false,
      message: 'Планирование постов не поддерживается напрямую через Bot API. Эта функция доступна только для MTProto.'
    };
  }

  async deleteScheduledMessage(scheduledMessageId: number, channelId: string): Promise<{ success: boolean; message: string }> {
     console.warn('Попытка запланировать пост через Bot API, который не поддерживает нативное планирование. Используйте кастомный планировщик.');
     return {
      success: false,
      message: 'Планирование постов не поддерживается напрямую через Bot API. Эта функция доступна только для MTProto.'
    };
  }

  async sendScheduledMessages(scheduledMessageIds: number[], channelId: string): Promise<{ success: boolean; message: string }> {
    console.warn('Попытка запланировать пост через Bot API, который не поддерживает нативное планирование. Используйте кастомный планировщик.');
     return {
      success: false,
      message: 'Планирование постов не поддерживается напрямую через Bot API. Эта функция доступна только для MTProto.'
    };
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

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  private async sendMedia(post: Post, channel: PostedChannel, caption: string): Promise<{ success: boolean; message: string; messageId?: string }> {

    const getMediaUrl = (filePath: string) => {
      const cleanPath = filePath.replace('/app/', '');
      const baseUrl = process.env.VITE_API_URL;
      return `${baseUrl}${cleanPath}`;
    };
  
    try {
      console.log(`🔄 Начинаем отправку медиа. Всего файлов: ${post.media.length}`);
      
      const albumCandidates = post.media.filter(m => m.type === 'photo' || m.type === 'video');
      const otherMedia = post.media.filter(m => !(m.type === 'photo' || m.type === 'video'));

      if (albumCandidates.length > 2) {
        console.log(`Отправляем альбом (sendMediaGroup) из ${albumCandidates.length} элементов`);

        const mediaItems = albumCandidates.map((m, idx) => {
          const mediaUrl = getMediaUrl(m.file_path);
          const item: any = {
            type: m.type === 'photo' ? 'photo' : 'video',
            media: mediaUrl
          };
          if (idx === 0 && caption) {
            item.caption = caption.substring(0, 1024);
            item.parse_mode = 'HTML';
          }
          return item;
        });

        const albumRequestBody = {
          chat_id: channel.channel_id,
          media: mediaItems
        };

        console.log('📤 Запрос к Telegram API (sendMediaGroup):', JSON.stringify(albumRequestBody, null, 2));

        const albumResponse = await fetch(`${this.baseUrl}/sendMediaGroup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(albumRequestBody)
        });

        const albumResult = await albumResponse.json();
        console.log('📥 Ответ от Telegram API (sendMediaGroup):', JSON.stringify(albumResult, null, 2));

        if (!albumResult.ok) {
          console.error('❌ Ошибка отправки альбома:', albumResult.description);
          return { success: false, message: `Ошибка отправки альбома: ${albumResult.description}` };
        }

        const firstMessageId = albumResult.result?.[0]?.message_id;
        console.log(`✅ Альбом отправлен успешно, первый message_id: ${firstMessageId}`);

        for (let i = 0; i < otherMedia.length; i++) {
          const media = otherMedia[i];
          const method = this.getMediaMethod(media.type);
          console.log(`🔄 Отправляем дополнительный медиафайл (${media.type}) после альбома: метод=${method}`);

          if (!method) {
            console.warn(`⚠️ Пропускаем неподдерживаемый тип медиа: ${media.type}`);
            continue;
          }

          const mediaUrl = getMediaUrl(media.file_path);
          const mediaRequestBody = {
            chat_id: channel.channel_id,
            [media.type]: mediaUrl
          };

          try {
            const extraResp = await fetch(`${this.baseUrl}/${method}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(mediaRequestBody)
            });
            const extraRes = await extraResp.json();
            if (extraRes.ok) {
              console.log(`✅ Доп. медиа (${media.type}) отправлено успешно`);
            } else {
              console.error(`❌ Ошибка отправки доп. медиа (${media.type}):`, extraRes.description);
            }
          } catch (e) {
            console.error(`❌ Ошибка сети при отправке доп. медиа (${media.type}):`, e);
          }
        }

        return { success: true, message: 'Альбом отправлен успешно', messageId: firstMessageId?.toString() };
      }
      
      if (post.media.length === 1) {
        const media = post.media[0];
        console.log(`📎 Отправляем одиночный медиафайл:`, {
          type: media.type,
          file_path: media.file_path,
          mime_type: (media as any).mime_type || 'не указан'
        });
        
        const mediaType = media.type;
        const method = this.getMediaMethod(mediaType);
        console.log(`🔧 Определен метод для типа ${mediaType}: ${method}`);
        
        if (method) {
          const publicUrl = getMediaUrl(media.file_path);
          console.log('🌐 Публичный URL медиа:', publicUrl);
          
          try {
            const fileCheckResponse = await fetch(publicUrl, { method: 'HEAD' });
            console.log('📡 Статус доступности файла:', fileCheckResponse.status);
            if (!fileCheckResponse.ok) {
              console.error('❌ Файл недоступен по URL:', publicUrl);
            }
          } catch (fileError) {
            console.error('❌ Ошибка при проверке файла:', fileError);
          }

          const mediaRequestBody = {
            chat_id: channel.channel_id,
            [mediaType]: publicUrl,
            caption: caption.substring(0, 1024), 
            parse_mode: 'HTML'
          };
          
          console.log('📤 Запрос медиа к Telegram API:', JSON.stringify(mediaRequestBody, null, 2));

          const mediaResponse = await fetch(`${this.baseUrl}/${method}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(mediaRequestBody)
          });

          const mediaResult = await mediaResponse.json();
          console.log('📥 Ответ от Telegram API (медиа):', JSON.stringify(mediaResult, null, 2));

          if (mediaResult.ok) {
            console.log(`✅ Одиночный медиафайл отправлен успешно`);
            return { success: true, message: 'Медиа отправлено успешно', messageId: mediaResult.result.message_id.toString() };
          } else {
            console.error(`❌ Ошибка отправки медиа:`, mediaResult.description);
            return { success: false, message: `Ошибка отправки медиа: ${mediaResult.description}` };
          }
        } else {
          console.error(`❌ Неизвестный тип медиа: ${mediaType}`);
          return { success: false, message: `Неизвестный тип медиа: ${mediaType}` };
        }
      } 
      else if (post.media.length > 1) {
        console.log(`📎 Отправляем группу из ${post.media.length} медиафайлов (без альбома, т.к. <= 2 фото/видео или смешанные типы)`);
        
        const firstMedia = post.media[0];
        const firstMediaType = firstMedia.type;
        const firstMethod = this.getMediaMethod(firstMediaType);
        
        console.log(`🔧 Первый медиафайл: тип=${firstMediaType}, метод=${firstMethod}`);
        
        if (!firstMethod) {
          console.error(`❌ Неизвестный тип медиа для первого файла: ${firstMediaType}`);
          return { success: false, message: `Неизвестный тип медиа: ${firstMediaType}` };
        }
        
        const firstMediaUrl = getMediaUrl(firstMedia.file_path);
        const firstMediaRequestBody = {
          chat_id: channel.channel_id,
          [firstMediaType]: firstMediaUrl,
          caption: caption.substring(0, 1024), 
          parse_mode: 'HTML'
        };
        
        console.log('📤 Отправляем первый медиафайл с подписью:', JSON.stringify(firstMediaRequestBody, null, 2));
        
        const firstMediaResponse = await fetch(`${this.baseUrl}/${firstMethod}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(firstMediaRequestBody)
        });
        
        const firstMediaResult = await firstMediaResponse.json();
        console.log('📥 Ответ от Telegram API (первый медиафайл):', JSON.stringify(firstMediaResult, null, 2));
        
        if (!firstMediaResult.ok) {
          console.error(`❌ Ошибка отправки первого медиафайла:`, firstMediaResult.description);
          return { success: false, message: `Ошибка отправки первого медиафайла: ${firstMediaResult.description}` };
        }
        
        const firstMessageId = firstMediaResult.result.message_id;
        console.log(`✅ Первый медиафайл отправлен успешно, ID: ${firstMessageId}`);
        
        for (let i = 1; i < post.media.length; i++) {
          const media = post.media[i];
          const mediaType = media.type;
          const method = this.getMediaMethod(mediaType);
          
          console.log(`🔄 Отправляем медиафайл ${i + 1}/${post.media.length}: тип=${mediaType}, метод=${method}`);
          
          if (method) {
            const mediaUrl = getMediaUrl(media.file_path);
            const mediaRequestBody = {
              chat_id: channel.channel_id,
              [mediaType]: mediaUrl
            };
            
            console.log(`📤 Отправляем медиафайл ${i + 1}/${post.media.length}:`, JSON.stringify(mediaRequestBody, null, 2));
            
            try {
              const mediaResponse = await fetch(`${this.baseUrl}/${method}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mediaRequestBody)
              });
              
              const mediaResult = await mediaResponse.json();
              if (mediaResult.ok) {
                console.log(`✅ Медиафайл ${i + 1} отправлен успешно`);
              } else {
                console.error(`❌ Ошибка отправки медиафайла ${i + 1}:`, mediaResult.description);
              }
            } catch (error) {
              console.error(`❌ Ошибка при отправке медиафайла ${i + 1}:`, error);
            }
          }
        }
        
        console.log(`✅ Группа медиафайлов отправлена успешно`);
        return { success: true, message: 'Группа медиафайлов отправлена успешно', messageId: firstMessageId.toString() };
      }
      
      return { success: false, message: 'Нет медиафайлов для отправки' };
    } catch (error) {
      console.error('❌ Ошибка при отправке медиа:', error);
      return { success: false, message: 'Критическая ошибка при отправке медиа' };
    }
  }

  private getMediaMethod(mediaType: string): string | null {
    console.log(`🔍 Определяем метод для типа медиа: "${mediaType}"`);
    
    const mediaMethods: { [key: string]: string } = {
      'photo': 'sendPhoto',
      'video': 'sendVideo',
      'document': 'sendDocument',
      'audio': 'sendAudio',
      'voice': 'sendVoice'
    };
    
    const method = mediaMethods[mediaType] || null;
    console.log(`🔧 Найден метод: ${method}`);
    
    return method;
  }
}