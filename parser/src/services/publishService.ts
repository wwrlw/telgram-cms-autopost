import { TelegramClient, Api } from 'telegram';
import { Post } from '../types/index.js';
import { PostedChannel } from '../types/index.js';
import bigInt from "big-integer";
import fs from 'fs';
import { CustomFile } from 'telegram/client/uploads.js';

export interface PublishResult {
  success: boolean;
  message: string;
  messageId?: string;
  scheduledMessageId?: string;
}
export class PublishService {
  constructor(private client: TelegramClient) {}

  async publishPost(post: Post, channel: PostedChannel): Promise<PublishResult> {
    try {
      console.log('=== НАЧАЛО MTProto ПУБЛИКАЦИИ ===');
      console.log('Публикуем пост:', { 
        id: post._id, 
        textLength: post.text?.length || 0,
        mediaCount: post.media?.length || 0 
      });

      const entity = await this.getChannelEntity(channel.channel_id);
      if (!entity) {
        return { success: false, message: 'Не удалось получить доступ к каналу' };
      }

      const messageText = this.formatMessageText(post, channel);
      console.log('📝 Форматированный текст:', messageText);

      if (post.media && post.media.length > 0) {
        return await this.sendMediaWithMTProto(post, entity, messageText);
      } else {
        return await this.sendTextWithMTProto(entity, messageText);
      }

    } catch (error) {
      console.error('❌ Ошибка MTProto публикации:', error);
      return { success: false, message: 'Критическая ошибка при публикации через MTProto' };
    } finally {
      console.log('=== КОНЕЦ MTProto ПУБЛИКАЦИИ ===');
    }
  }

  async schedulePost(post: Post, channel: PostedChannel, scheduleDate: Date): Promise<PublishResult> {
    try {
      console.log('=== НАЧАЛО ОТЛОЖЕННОЙ MTProto ПУБЛИКАЦИИ ===');
      console.log('Планируем пост на:', scheduleDate.toISOString());

      const entity = await this.getChannelEntity(channel.channel_id);
      if (!entity) {
        return { success: false, message: 'Не удалось получить доступ к каналу' };
      }

      const messageText = this.formatMessageText(post, channel);
      const scheduleTimestamp = Math.floor(scheduleDate.getTime() / 1000);

      if (post.media && post.media.length > 0) {
        return await this.sendScheduledMediaWithMTProto(post, entity, messageText, scheduleTimestamp);
      } else {
        return await this.sendScheduledTextWithMTProto(entity, messageText, scheduleTimestamp);
      }

    } catch (error) {
      console.error('❌ Ошибка отложенной MTProto публикации:', error);
      return { success: false, message: 'Критическая ошибка при планировании публикации' };
    } finally {
      console.log('=== КОНЕЦ ОТЛОЖЕННОЙ MTProto ПУБЛИКАЦИИ ===');
    }
  }

  async getScheduledMessages(channelId: string): Promise<any[]> {
    try {
      const entity = await this.getChannelEntity(channelId);
      if (!entity) {
        return [];
      }

      const result = await this.client.invoke(new Api.messages.GetScheduledHistory({
        peer: entity,
        hash: bigInt(0),
      }));

      return (result as any).messages || [];
    } catch (error) {
      console.error('❌ Ошибка получения отложенных сообщений:', error);
      return [];
    }
  }


  async editScheduledMessage(scheduledMessageId: number, channelId: string, newScheduleDate: Date): Promise<PublishResult> {
    try {
      const entity = await this.getChannelEntity(channelId);
      if (!entity) {
        return { success: false, message: 'Не удалось получить доступ к каналу' };
      }

      const scheduleTimestamp = Math.floor(newScheduleDate.getTime() / 1000);

      await this.client.invoke(new Api.messages.EditMessage({
        peer: entity,
        id: scheduledMessageId,
        scheduleDate: scheduleTimestamp
      }));

      return { success: true, message: 'Время публикации изменено' };
    } catch (error) {
      console.error('❌ Ошибка редактирования отложенного сообщения:', error);
      return { success: false, message: 'Ошибка изменения времени публикации' };
    }
  }


  async deleteScheduledMessage(scheduledMessageId: number, channelId: string): Promise<PublishResult> {
    try {
      const entity = await this.getChannelEntity(channelId);
      if (!entity) {
        return { success: false, message: 'Не удалось получить доступ к каналу' };
      }

      await this.client.invoke(new Api.messages.DeleteScheduledMessages({
        peer: entity,
        id: [scheduledMessageId]
      }));

      return { success: true, message: 'Отложенное сообщение удалено' };
    } catch (error) {
      console.error('❌ Ошибка удаления отложенного сообщения:', error);
      return { success: false, message: 'Ошибка удаления отложенного сообщения' };
    }
  }


  async sendScheduledMessages(scheduledMessageIds: number[], channelId: string): Promise<PublishResult> {
    try {
      const entity = await this.getChannelEntity(channelId);
      if (!entity) {
        return { success: false, message: 'Не удалось получить доступ к каналу' };
      }

      await this.client.invoke(new Api.messages.SendScheduledMessages({
        peer: entity,
        id: scheduledMessageIds
      }));

      return { success: true, message: 'Отложенные сообщения отправлены' };
    } catch (error) {
      console.error('❌ Ошибка отправки отложенных сообщений:', error);
      return { success: false, message: 'Ошибка отправки отложенных сообщений' };
    }
  }


  async deletePost(messageId: number, channelId: string): Promise<PublishResult> {
    try {
      const entity = await this.getChannelEntity(channelId);
      if (!entity) {
        return { success: false, message: 'Не удалось получить доступ к каналу' };
      }

      await this.client.invoke(new Api.channels.DeleteMessages({
        channel: entity,
        id: [messageId]
      }));

      return { success: true, message: 'Пост удален из канала' };
    } catch (error) {
      console.error('❌ Ошибка удаления поста:', error);
      return { success: false, message: 'Ошибка удаления поста' };
    }
  }

  private async getChannelEntity(channelId: string): Promise<any> {
    try {
      const channelIdNum = parseInt(channelId);
      let telegramChannelId = Math.abs(channelIdNum);
      
      if (telegramChannelId < 1_000_000_000_000) {
        telegramChannelId = 1_000_000_000_000 + telegramChannelId;
      }

      try {
        return await this.client.getEntity(telegramChannelId);
      } catch (firstError) {
        try {
          return await this.client.getEntity(-telegramChannelId);
        } catch (secondError) {
          return await this.client.getEntity(new Api.PeerChannel({ channelId: BigInt(telegramChannelId) as any }));
        }
      }
    } catch (error) {
      console.error('❌ Ошибка получения entity канала:', error);
      return null;
    }
  }

  private async sendTextWithMTProto(entity: any, messageText: string): Promise<PublishResult> {
    try {
      console.log('📝 Отправляем текстовое сообщение через MTProto');

      const result = await this.client.invoke(new Api.messages.SendMessage({
        peer: entity,
        message: messageText,
        randomId: bigInt(Date.now()),
        noWebpage: true
      }));

      const messageId = (result as any).updates?.[0]?.id || (result as any).id;
      console.log('✅ Текстовое сообщение отправлено, ID:', messageId);

      return { 
        success: true, 
        message: 'Текстовое сообщение отправлено через MTProto',
        messageId: messageId?.toString()
      };
    } catch (error) {
      console.error('❌ Ошибка отправки текста через MTProto:', error);
      return { success: false, message: 'Ошибка отправки текстового сообщения' };
    }
  }

  private async sendScheduledTextWithMTProto(entity: any, messageText: string, scheduleTimestamp: number): Promise<PublishResult> {
    try {
      console.log('📝 Планируем текстовое сообщение через MTProto на:', new Date(scheduleTimestamp * 1000).toISOString());

      const result = await this.client.invoke(new Api.messages.SendMessage({
        peer: entity,
        message: messageText,
        randomId: bigInt(Date.now()),
        noWebpage: true,
        scheduleDate: scheduleTimestamp
      }));

      const scheduledMessageId = (result as any).updates?.[0]?.id || (result as any).id;
      console.log('✅ Текстовое сообщение запланировано, ID:', scheduledMessageId);

      return { 
        success: true, 
        message: 'Текстовое сообщение запланировано через MTProto',
        scheduledMessageId: scheduledMessageId?.toString()
      };
    } catch (error) {
      console.error('❌ Ошибка планирования текста через MTProto:', error);
      return { success: false, message: 'Ошибка планирования текстового сообщения' };
    }
  }

  private async sendMediaWithMTProto(post: Post, entity: any, caption: string): Promise<PublishResult> {
    try {
      console.log(`📎 Отправляем медиа через MTProto. Файлов: ${post.media.length}`);

      if (post.media.length === 1) {
        return await this.sendSingleMediaWithMTProto(post.media[0], entity, caption);
      } else if (post.media.length > 1) {
        return await this.sendMediaGroupWithMTProto(post.media, entity, caption);
      }

      return { success: false, message: 'Нет медиафайлов для отправки' };
    } catch (error) {
      console.error('❌ Ошибка отправки медиа через MTProto:', error);
      return { success: false, message: 'Ошибка отправки медиафайлов' };
    }
  }

  private async sendScheduledMediaWithMTProto(post: Post, entity: any, caption: string, scheduleTimestamp: number): Promise<PublishResult> {
    try {
      console.log(`📎 Планируем медиа через MTProto. Файлов: ${post.media.length}`);

      if (post.media.length === 1) {
        return await this.sendScheduledSingleMediaWithMTProto(post.media[0], entity, caption, scheduleTimestamp);
      } else if (post.media.length > 1) {
        return await this.sendScheduledMediaGroupWithMTProto(post.media, entity, caption, scheduleTimestamp);
      }

      return { success: false, message: 'Нет медиафайлов для планирования' };
    } catch (error) {
      console.error('❌ Ошибка планирования медиа через MTProto:', error);
      return { success: false, message: 'Ошибка планирования медиафайлов' };
    }
  }

  private async sendSingleMediaWithMTProto(media: any, entity: any, caption: string): Promise<PublishResult> {
    try {
      console.log('📎 Обрабатываем медиафайл:', {
        type: media.type,
        file_path: media.file_path,
        thumbnail_path: media.thumbnail_path
      });
      
      const inputMedia = await this.createInputMedia(media, caption);
      
      const result = await this.client.invoke(new Api.messages.SendMedia({
        peer: entity,
        media: inputMedia,
        message: caption,
        randomId: bigInt(Date.now()),
      }));

      const messageId = (result as any).updates?.[0]?.id || (result as any).id;
      console.log('✅ Медиафайл отправлен, ID:', messageId);

      return { 
        success: true, 
        message: 'Медиафайл отправлен через MTProto',
        messageId: messageId?.toString()
      };
    } catch (error) {
      console.error('❌ Ошибка отправки медиафайла:', error);
      
      let errorMessage = 'Ошибка отправки медиафайла';
      if (error instanceof Error) {
        if (error.message.includes('FILE_TOO_LARGE')) {
          errorMessage = 'Файл слишком большой для отправки';
        } else if (error.message.includes('FILE_EMPTY')) {
          errorMessage = 'Файл пустой или поврежден';
        } else if (error.message.includes('FILE_NOT_FOUND')) {
          errorMessage = 'Файл не найден';
        } else if (error.message.includes('INVALID_FILE_TYPE')) {
          errorMessage = 'Неподдерживаемый тип файла';
        } else {
          errorMessage = `Ошибка отправки медиафайла: ${error.message}`;
        }
      }
      
      return { success: false, message: errorMessage };
    }
  }

  private async sendScheduledSingleMediaWithMTProto(media: any, entity: any, caption: string, scheduleTimestamp: number): Promise<PublishResult> {
    try {
      const inputMedia = await this.createInputMedia(media, caption);
      
      const result = await this.client.invoke(new Api.messages.SendMedia({
        peer: entity,
        media: inputMedia,
        message: caption,
        randomId: bigInt(Date.now()),
        scheduleDate: scheduleTimestamp
      }));

      const scheduledMessageId = (result as any).updates?.[0]?.id || (result as any).id;
      console.log('✅ Медиафайл запланирован, ID:', scheduledMessageId);

      return { 
        success: true, 
        message: 'Медиафайл запланирован через MTProto',
        scheduledMessageId: scheduledMessageId?.toString()
      };
    } catch (error) {
      console.error('❌ Ошибка планирования медиафайла:', error);
      return { success: false, message: 'Ошибка планирования медиафайла' };
    }
  }

  private async sendMediaGroupWithMTProto(mediaArray: any[], entity: any, caption: string): Promise<PublishResult> {
    try {
      const inputMediaArray = [];
      
      for (let i = 0; i < mediaArray.length; i++) {
        const media = mediaArray[i];
        const mediaCaption = i === 0 ? caption : '';
        const inputMedia = await this.createInputMedia(media, mediaCaption);
        inputMediaArray.push(inputMedia);
      }

      const result = await this.client.invoke(new Api.messages.SendMultiMedia({
        peer: entity,
        multiMedia: inputMediaArray.map((media, index) => new Api.InputSingleMedia({
          media: media,
          randomId: bigInt(Date.now() + index),
          message: index === 0 ? caption : ''
        })),
      }));

      const messageId = (result as any).updates?.[0]?.id || (result as any).id;
      console.log('✅ Группа медиафайлов отправлена, ID:', messageId);

      return { 
        success: true, 
        message: 'Группа медиафайлов отправлена через MTProto',
        messageId: messageId?.toString()
      };
    } catch (error) {
      console.error('❌ Ошибка отправки группы медиафайлов:', error);
      return { success: false, message: 'Ошибка отправки группы медиафайлов' };
    }
  }

  private async sendScheduledMediaGroupWithMTProto(mediaArray: any[], entity: any, caption: string, scheduleTimestamp: number): Promise<PublishResult> {
    try {
      const inputMediaArray = [];
      
      for (let i = 0; i < mediaArray.length; i++) {
        const media = mediaArray[i];
        const mediaCaption = i === 0 ? caption : '';
        const inputMedia = await this.createInputMedia(media, mediaCaption);
        inputMediaArray.push(inputMedia);
      }

      const result = await this.client.invoke(new Api.messages.SendMultiMedia({
        peer: entity,
        multiMedia: inputMediaArray.map((media, index) => new Api.InputSingleMedia({
          media: media,
          randomId: bigInt(Date.now() + index),
          message: index === 0 ? caption : ''
        })),
        scheduleDate: scheduleTimestamp
      }));

      const scheduledMessageId = (result as any).updates?.[0]?.id || (result as any).id;
      console.log('✅ Группа медиафайлов запланирована, ID:', scheduledMessageId);

      return { 
        success: true, 
        message: 'Группа медиафайлов запланирована через MTProto',
        scheduledMessageId: scheduledMessageId?.toString()
      };
    } catch (error) {
      console.error('❌ Ошибка планирования группы медиафайлов:', error);
      return { success: false, message: 'Ошибка планирования группы медиафайлов' };
    }
  }


  /**
   * @param media - объект медиафайла с типом и путями
   * @param caption - подпись к медиафайлу
   * @returns InputMedia объект для API
   */
  private async createInputMedia(media: any, caption: string): Promise<any> {
    try {
      console.log('🔧 Создаем InputMedia для:', {
        type: media.type,
        file_path: media.file_path,
        thumbnail_path: media.thumbnail_path
      });

      if (!media || !media.type) {
        throw new Error('Неверные данные медиафайла: отсутствует тип');
      }

      if (!media.file_path) {
        throw new Error('Неверные данные медиафайла: отсутствует путь к файлу');
      }

      const filePath = await this.findMediaFile(media.file_path);
      if (!filePath) {
        throw new Error(`Файл не найден: ${media.file_path}`);
      }

      console.log('📁 Найден файл:', filePath);

      const path = await import('path');
      const stats = fs.statSync(filePath);
      const maxSize = 2 * 1024 * 1024 * 1024;
      
      if (stats.size > maxSize) {
        throw new Error(`Файл слишком большой: ${(stats.size / 1024 / 1024).toFixed(2)}MB (максимум 2GB)`);
      }

      if (stats.size === 0) {
        throw new Error('Файл пустой');
      }

      const fileName = path.basename(filePath);
      console.log(`📤 Загружаем файл: ${fileName} (${(stats.size / 1024 / 1024).toFixed(2)}MB)`);
      
      const workers = this.getOptimalWorkers(stats.size);
      console.log(`🔧 Используем ${workers} воркеров для загрузки`);
      
      const uploadedFile = await this.client.uploadFile({
        file: new CustomFile(fileName, stats.size, filePath),
        workers: workers,
        onProgress: (progress: number) => {
          if (progress % 10 === 0) {
            console.log(`📤 Прогресс загрузки: ${progress}%`);
          }
        }
      });

      console.log('✅ Файл успешно загружен в Telegram');

      switch (media.type) {
        case 'photo':
          return new Api.InputMediaUploadedPhoto({
            file: uploadedFile,
            ttlSeconds: undefined
          });

        case 'video':
          let thumb: any = undefined;
          if (media.thumbnail_path) {
            const thumbPath = await this.findMediaFile(media.thumbnail_path);
            if (thumbPath) {
              const thumbStats = fs.statSync(thumbPath);
              const thumbFileName = path.basename(thumbPath);
              console.log(`🖼️ Загружаем превью: ${thumbFileName} (${(thumbStats.size / 1024).toFixed(2)}KB)`);
              
              const thumbFile = await this.client.uploadFile({
                file: new CustomFile(thumbFileName, thumbStats.size, thumbPath),
                workers: 1
              });
              thumb = thumbFile;
              console.log('✅ Превью загружено');
            }
          }

          const videoMetadata = await this.getVideoMetadata(filePath);
          
          return new Api.InputMediaUploadedDocument({
            file: uploadedFile,
            mimeType: this.getMimeType(filePath),
            attributes: [
              new Api.DocumentAttributeVideo({
                duration: videoMetadata.duration || 0,
                w: videoMetadata.width || 0,
                h: videoMetadata.height || 0,
                supportsStreaming: this.isStreamableVideo(filePath)
              })
            ],
            thumb: thumb,
            ttlSeconds: undefined
          });

        case 'document':
        default:
          return new Api.InputMediaUploadedDocument({
            file: uploadedFile,
            mimeType: this.getMimeType(filePath),
            attributes: [],
            ttlSeconds: undefined
          });
      }
    } catch (error) {
      console.error('❌ Ошибка создания InputMedia:', error);
      throw error;
    }
  }

  /**
   * Находит файл по относительному пути
   */
  private async findMediaFile(relativePath: string): Promise<string | null> {
    const fs = await import('fs');
    const path = await import('path');
    
    const cleanPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
    
    const possiblePaths = [
      path.join(process.cwd(), cleanPath),
      path.join('/app', cleanPath),
      path.join(process.cwd(), 'media', cleanPath),
      path.join('/app', 'media', cleanPath),
      path.join(process.cwd(), 'parser', 'media', cleanPath),
      path.join('/app', 'parser', 'media', cleanPath),
      cleanPath
    ];
    
    for (const fullPath of possiblePaths) {
      if (fs.existsSync(fullPath)) {
        console.log('✅ Найден файл по пути:', fullPath);
        return fullPath;
      }
    }
    
    console.error('❌ Файл не найден по путям:', possiblePaths);
    return null;
  }

  // private async findMediaFileByName(fileName: string): Promise<string[]> {
  //   const fs = await import('fs');
  //   const path = await import('path');
  //   const possiblePaths: string[] = [];
    
  //   // Список папок для поиска
  //   const searchDirs = [
  //     process.cwd(),
  //     '/app',
  //     path.join(process.cwd(), 'media'),
  //     '/app/media',
  //     path.join(process.cwd(), 'parser', 'media'),
  //     '/app/parser/media'
  //   ];
    
  //   for (const dir of searchDirs) {
  //     if (fs.existsSync(dir)) {
  //       const subDirs = ['photos', 'videos', 'documents', 'thumbnails'];
  //       for (const subDir of subDirs) {
  //         const fullPath = path.join(dir, subDir, fileName);
  //         if (fs.existsSync(fullPath)) {
  //           possiblePaths.push(fullPath);
  //         }
  //       }
        
  //       const directPath = path.join(dir, fileName);
  //       if (fs.existsSync(directPath)) {
  //         possiblePaths.push(directPath);
  //       }
  //     }
  //   }
    
  //   return possiblePaths;
  // }

  private getMimeType(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'mp4': 'video/mp4',
      'avi': 'video/x-msvideo',
      'mov': 'video/quicktime',
      'mkv': 'video/x-matroska',
      'webm': 'video/webm',
      'pdf': 'application/pdf',
      'txt': 'text/plain',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed'
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  }

  /**
   * Получает метаданные видеофайла
   */
  private async getVideoMetadata(filePath: string): Promise<{ duration: number; width: number; height: number }> {
    try {
      return {
        duration: 0,
        width: 0,
        height: 0
      };
    } catch (error) {
      console.warn('⚠️ Не удалось получить метаданные видео:', error);
      return {
        duration: 0,
        width: 0,
        height: 0
      };
    }
  }


  private isStreamableVideo(filePath: string): boolean {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const streamableFormats = ['mp4', 'webm'];
    return streamableFormats.includes(ext || '');
  }


  private getOptimalWorkers(fileSize: number): number {
    // Для маленьких файлов (< 1MB) используем 1 воркер
    if (fileSize < 1024 * 1024) {
      return 1;
    }
    
    // Для средних файлов (1MB - 100MB) используем 2-4 воркера
    if (fileSize < 100 * 1024 * 1024) {
      return Math.min(4, Math.max(2, Math.floor(fileSize / (10 * 1024 * 1024))));
    }
    
    // Для больших файлов (> 100MB) используем 4-8 воркеров
    return Math.min(8, Math.max(4, Math.floor(fileSize / (50 * 1024 * 1024))));
  }

  private formatMessageText(post: Post, channel: PostedChannel): string {
    const isHtml = (post as any)?.format === 'html';
    let result = post.text || '';

    if (isHtml) {
      result = result.replace(/<br\s*\/?>/gi, '\n');
      
      result = result.replace(/<\/p>/gi, '\n').replace(/<p>/gi, '');
      
      const allowed = '(?:b|strong|i|em|u|s|del|strike|a|code|pre|blockquote|tg-emoji|span)';
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
      
      result = result.replace(/\n\s*\n\s*\n/g, '\n\n');
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
    }

    if (channel.signature) {
      if (result) result += '\n\n';
      result += channel.signature;
    }

    console.log('ИТОГОВОЕ СООБЩЕНИЕ В TELEGRAM:', result);
    return result;
  }
}
