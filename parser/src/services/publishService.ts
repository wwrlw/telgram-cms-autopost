import { TelegramClient, Api, utils } from 'telegram';
import { Post } from '../types/index.js';
import { PostedChannel } from '../types/index.js';
import bigInt from "big-integer";
import fs from 'fs';
import crypto from 'crypto';
import { CustomFile } from 'telegram/client/uploads.js';
import { _parseMessageText } from 'telegram/client/messageParse.js';
import { execFile } from 'child_process';
import { promisify } from 'util';
import ffmpegPath from 'ffmpeg-static';
import path from 'path';

const execFileAsync = promisify(execFile);

export interface PublishResult {
  success: boolean;
  message: string;
  messageId?: string;
  scheduledMessageId?: string;
}
export class PublishService {
  private readonly watermarkPath: string;

  constructor(private client: TelegramClient) {
    // Пытаемся найти файл водяного знака в различных возможных местах
    const possiblePaths = [
      '/home/tubelab/bots/tg.chiorio.com/parser/1px/2.png',
      path.join(process.cwd(), 'parser', '1px', '2.png'),
      path.join(process.cwd(), '1px', '2.png'),
    ];
    
    this.watermarkPath = possiblePaths.find(p => fs.existsSync(p)) || possiblePaths[0];
    
    if (!fs.existsSync(this.watermarkPath)) {
      console.warn(`⚠️ Файл водяного знака не найден. Будет использован путь: ${this.watermarkPath}`);
    } else {
      console.log(`✅ Файл водяного знака найден: ${this.watermarkPath}`);
    }
  }

  private getRandomWatermarkPosition(): 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' {
    const positions: ('top-left' | 'top-right' | 'bottom-left' | 'bottom-right')[] = [
      'top-left',
      'top-right',
      'bottom-left',
      'bottom-right'
    ];
    return positions[Math.floor(Math.random() * positions.length)];
  }

  /**
   * @param inputPath
   * @param position
   * @param opacity
   * @param scale
   * @returns
   */
  private async addWatermarkToVideo(
    inputPath: string,
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' = 'bottom-right',
    opacity: number = 0.44,
    scale: number = 0.8
  ): Promise<string> {
    const bin = (ffmpegPath as unknown as string) || 'ffmpeg';
    
    if (!fs.existsSync(this.watermarkPath)) {
      console.warn(`⚠️ Файл водяного знака не найден: ${this.watermarkPath}`);
      return inputPath;
    }

    const parsedPath = path.parse(inputPath);
    const outputPath = path.join(parsedPath.dir, `${parsedPath.name}_watermarked${parsedPath.ext}`);
    
    let overlayPosition = '';
    switch (position) {
      case 'top-left':
        overlayPosition = '10:10';
        break;
      case 'top-right':
        overlayPosition = 'main_w-overlay_w-10:10';
        break;
      case 'bottom-left':
        overlayPosition = '10:main_h-overlay_h-10';
        break;
      case 'bottom-right':
        overlayPosition = 'main_w-overlay_w-10:main_h-overlay_h-10';
        break;
    }

    const args = [
      '-i', inputPath,
      '-i', this.watermarkPath,
      '-filter_complex', 
      `[1:v]scale=iw*${scale}:-1,format=rgba,colorchannelmixer=aa=${opacity}[watermark];` +
      `[0:v][watermark]overlay=${overlayPosition}[v]`,
      '-map', '[v]',
      '-map', '0:a?',
      '-c:v', 'libx264',
      '-c:a', 'copy',
      '-preset', 'fast',
      '-crf', '23',
      '-y',
      outputPath
    ];

    try {
      console.log(`🎬 Начинаем наложение водяного знака на видео: ${path.basename(inputPath)}`);
      await execFileAsync(bin, args);
      console.log(`✅ Водяной знак наложен на видео: ${path.basename(outputPath)}`);
      return outputPath;
    } catch (error) {
      console.error('❌ Ошибка наложения водяного знака:', error);
      return inputPath;
    }
  }

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
      console.log('=== НАЧАЛО ПОЛУЧЕНИЯ ОТЛОЖЕННЫХ СООБЩЕНИЙ ===');
      console.log('📋 Запрос отложенных сообщений для канала:', channelId);
      
      const entity = await this.getChannelEntity(channelId);
      if (!entity) {
        console.error('❌ Не удалось получить entity канала');
        return [];
      }

      const result = await this.client.invoke(new Api.messages.GetScheduledHistory({
        peer: entity,
        hash: bigInt(0),
      }));

      const messages = (result as any).messages || [];
      
      console.log(`📬 Получено отложенных сообщений: ${messages.length}`);
      
      if (messages.length > 0) {
        console.log('📝 Детали отложенных сообщений:');
        messages.forEach((msg: any, index: number) => {
          console.log(`  ${index + 1}. ID: ${msg.id}, Дата: ${new Date((msg.date || 0) * 1000).toISOString()}, Текст: ${(msg.message || '').substring(0, 50)}...`);
        });
      } else {
        console.log('ℹ️ Отложенных сообщений не найдено');
      }
      
      console.log('=== КОНЕЦ ПОЛУЧЕНИЯ ОТЛОЖЕННЫХ СООБЩЕНИЙ ===');
      
      return messages;
    } catch (error) {
      console.error('❌ Ошибка получения отложенных сообщений:', error);
      if (error instanceof Error) {
        console.error('Сообщение об ошибке:', error.message);
      }
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
      const trimmedChannelId = channelId.trim();

      if (!/^-?\d+$/.test(trimmedChannelId)) {
        const normalizedUsername = trimmedChannelId.startsWith('@')
          ? trimmedChannelId.slice(1)
          : trimmedChannelId;

        return await this.client.getEntity(normalizedUsername);
      }

      const channelIdNum = Number(trimmedChannelId);

      if (Number.isNaN(channelIdNum)) {
        throw new Error(`Некорректный идентификатор канала: ${channelId}`);
      }

      const absoluteChannelId = Math.abs(channelIdNum);
      let telegramChannelId = absoluteChannelId;

      if (telegramChannelId < 1_000_000_000_000) {
        telegramChannelId = 1_000_000_000_000 + telegramChannelId;
      }

      let entity;

      try {
        entity = await this.client.getEntity(telegramChannelId);
      } catch (firstError) {
        try {
          entity = await this.client.getEntity(-telegramChannelId);
        } catch (secondError) {
          try {
            entity = await this.client.getEntity(new Api.PeerChannel({ channelId: BigInt(telegramChannelId) as any }));
          } catch (thirdError) {
            try {
              entity = await this.client.getEntity(new Api.PeerUser({ userId: BigInt(telegramChannelId) as any }));
            } catch (fourthError) {
              try {
                entity = await this.client.getEntity(new Api.PeerChat({ chatId: BigInt(telegramChannelId) as any }));
              } catch (fifthError) {
                console.log(`⚠️ Не удалось получить entity для канала ${channelId}`);
                console.log(`🔍 Пробовали ID: ${telegramChannelId}, -${telegramChannelId}, PeerChannel, PeerUser, PeerChat`);
                return null;
              }
            }
          }
        }
      }

      if (!entity) {
        console.log(`⚠️ Не удалось получить entity для канала ${channelId}`);
        return null;
      }

      return entity;
    } catch (error) {
      console.error('❌ Ошибка получения entity канала:', error);
      return null;
    }
  }

  private async sendTextWithMTProto(entity: any, messageText: string): Promise<PublishResult> {
    try {
      console.log('📝 Отправляем текстовое сообщение через MTProto (parseMode=html)');

      const result: any = await this.client.sendMessage(entity, {
        message: messageText,
        parseMode: 'html',
        linkPreview: false
      });

      const messageId = result?.id;
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
      console.log('📝 Планируем текстовое сообщение через MTProto (parseMode=html) на:', new Date(scheduleTimestamp * 1000).toISOString());

      const result: any = await this.client.sendMessage(entity, {
        message: messageText,
        parseMode: 'html',
        linkPreview: false,
        schedule: scheduleTimestamp
      });

      const scheduledMessageId = result?.id;
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
    let watermarkedVideoPath: string | null = null;
    
    try {
      const filePath = await this.findMediaFile(media.file_path);
      if (!filePath) {
        throw new Error(`Файл не найден: ${media.file_path}`);
      }

      if (media.has_spoiler && media.type === 'photo') {
        return await this.sendPhotoWithSpoiler(entity, filePath, caption);
      }

      if (media.has_spoiler && media.type === 'video') {
        return await this.sendVideoWithSpoiler(entity, media, filePath, caption);
      }

      let finalFilePath = filePath;
      if (media.type === 'video') {
        try {
          const randomPosition = this.getRandomWatermarkPosition();
          finalFilePath = await this.addWatermarkToVideo(filePath, randomPosition, 0.44, 0.8);
          if (finalFilePath !== filePath) {
            watermarkedVideoPath = finalFilePath;
          }
        } catch (error) {
          console.warn('⚠️ Не удалось наложить водяной знак, используем оригинальное видео:', error);
        }
      }

      const sendOptions: any = {
        file: finalFilePath,
        caption: caption,
        parseMode: 'html'
      };

      if (media.has_spoiler) {
        sendOptions.spoiler = true;
      }

      console.log('📎 Обрабатываем медиафайл:', {
        type: media.type,
        file_path: media.file_path,
        thumbnail_path: media.thumbnail_path,
        spoiler: media.has_spoiler,
      });

      const result: any = await this.client.sendFile(entity, sendOptions);

      const messageId = result?.id;
      console.log('✅ Медиафайл отправлен, ID:', messageId);

      if (watermarkedVideoPath && fs.existsSync(watermarkedVideoPath)) {
        try {
          fs.unlinkSync(watermarkedVideoPath);
          console.log('🗑️ Временный файл с водяным знаком удален');
        } catch (err) {
          console.warn('⚠️ Не удалось удалить временный файл:', err);
        }
      }

      return { 
        success: true, 
        message: 'Медиафайл отправлен через MTProto',
        messageId: messageId?.toString()
      };
    } catch (error) {
      if (watermarkedVideoPath && fs.existsSync(watermarkedVideoPath)) {
        try {
          fs.unlinkSync(watermarkedVideoPath);
        } catch (err) {
        }
      }
      
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
    let watermarkedVideoPath: string | null = null;
    
    try {
      const filePath = await this.findMediaFile(media.file_path);
      if (!filePath) {
        throw new Error(`Файл не найден: ${media.file_path}`);
      }

      if (media.has_spoiler && media.type === 'photo') {
        return await this.sendPhotoWithSpoiler(entity, filePath, caption, { scheduleTimestamp });
      }

      if (media.has_spoiler && media.type === 'video') {
        return await this.sendVideoWithSpoiler(entity, media, filePath, caption, { scheduleTimestamp });
      }

      let finalFilePath = filePath;
      if (media.type === 'video') {
        try {
          const randomPosition = this.getRandomWatermarkPosition();
        finalFilePath = await this.addWatermarkToVideo(filePath, randomPosition, 0.44, 0.8);
          if (finalFilePath !== filePath) {
            watermarkedVideoPath = finalFilePath;
          }
        } catch (error) {
          console.warn('⚠️ Не удалось наложить водяной знак, используем оригинальное видео:', error);
        }
      }

      const sendOptions: any = {
        file: finalFilePath,
        caption: caption,
        parseMode: 'html',
        scheduleDate: scheduleTimestamp
      };

      if (media.has_spoiler) {
        sendOptions.spoiler = true;
      }

      const result: any = await this.client.sendFile(entity, sendOptions);

      const scheduledMessageId = result?.id;
      console.log('✅ Медиафайл запланирован, ID:', scheduledMessageId);

      if (watermarkedVideoPath && fs.existsSync(watermarkedVideoPath)) {
        try {
          fs.unlinkSync(watermarkedVideoPath);
          console.log('🗑️ Временный файл с водяным знаком удален');
        } catch (err) {
          console.warn('⚠️ Не удалось удалить временный файл:', err);
        }
      }

      return { 
        success: true, 
        message: 'Медиафайл запланирован через MTProto',
        scheduledMessageId: scheduledMessageId?.toString()
      };
    } catch (error) {
      if (watermarkedVideoPath && fs.existsSync(watermarkedVideoPath)) {
        try {
          fs.unlinkSync(watermarkedVideoPath);
        } catch (err) {
        }
      }
      
      console.error('❌ Ошибка планирования медиафайла:', error);
      return { success: false, message: 'Ошибка планирования медиафайла' };
    }
  }

  private async sendPhotoWithSpoiler(
    entity: any,
    filePath: string,
    caption: string,
    options?: { scheduleTimestamp?: number }
  ): Promise<PublishResult> {
    const scheduleTimestamp = options?.scheduleTimestamp;
    const path = await import('path');
    const stats = fs.statSync(filePath);
    const fileName = path.basename(filePath);

    const uploadedFile = await this.client.uploadFile({
      file: new CustomFile(fileName, stats.size, filePath),
      workers: this.getOptimalWorkers(stats.size)
    });

    const [preparedCaption, entities] = await _parseMessageText(this.client as any, caption || '', 'html');

    const request = new Api.messages.SendMedia({
      peer: entity,
      media: new Api.InputMediaUploadedPhoto({
        file: uploadedFile,
        spoiler: true
      }),
      message: preparedCaption,
      entities,
      scheduleDate: scheduleTimestamp
    });

    const result = await this.client.invoke(request);
    const sentMessage: any = this.client._getResponseMessage(request, result, entity);
    const resolved = Array.isArray(sentMessage) ? sentMessage[0] : sentMessage;
    const messageId = resolved?.id ? resolved.id.toString() : undefined;

    console.log(
      scheduleTimestamp
        ? '✅ Фото со спойлером запланировано, ID:'
        : '✅ Фото со спойлером отправлено, ID:',
      messageId
    );

    return scheduleTimestamp
      ? { success: true, message: 'Медиафайл запланирован через MTProto', scheduledMessageId: messageId }
      : { success: true, message: 'Медиафайл отправлен через MTProto', messageId };
  }

  private async sendVideoWithSpoiler(
    entity: any,
    media: any,
    filePath: string,
    caption: string,
    options?: { scheduleTimestamp?: number }
  ): Promise<PublishResult> {
    let watermarkedVideoPath: string | null = null;
    
    try {
      const scheduleTimestamp = options?.scheduleTimestamp;
      const path = await import('path');
      
      let finalFilePath = filePath;
      try {
        const randomPosition = this.getRandomWatermarkPosition();
        finalFilePath = await this.addWatermarkToVideo(filePath, randomPosition, 0.44, 0.8);
        if (finalFilePath !== filePath) {
          watermarkedVideoPath = finalFilePath;
        }
      } catch (error) {
        console.warn('⚠️ Не удалось наложить водяной знак, используем оригинальное видео:', error);
      }
      
      const stats = fs.statSync(finalFilePath);
      const fileName = path.basename(finalFilePath);

      const uploadedFile = await this.client.uploadFile({
        file: new CustomFile(fileName, stats.size, finalFilePath),
        workers: this.getOptimalWorkers(stats.size)
      });

      let thumb: any = undefined;
      if (media.thumbnail_path) {
        const thumbPath = await this.findMediaFile(media.thumbnail_path);
        if (thumbPath) {
          const thumbStats = fs.statSync(thumbPath);
          const thumbFileName = path.basename(thumbPath);
          thumb = await this.client.uploadFile({
            file: new CustomFile(thumbFileName, thumbStats.size, thumbPath),
            workers: 1
          });
        }
      }

      const videoMetadata = await this.getVideoMetadata(finalFilePath);
      const [preparedCaption, entities] = await _parseMessageText(this.client as any, caption || '', 'html');

      const request = new Api.messages.SendMedia({
        peer: entity,
        media: new Api.InputMediaUploadedDocument({
          file: uploadedFile,
          mimeType: this.getMimeType(finalFilePath),
          attributes: [
            new Api.DocumentAttributeVideo({
              duration: videoMetadata.duration || 0,
              w: videoMetadata.width || 0,
              h: videoMetadata.height || 0,
              supportsStreaming: this.isStreamableVideo(finalFilePath)
            })
          ],
          thumb,
          spoiler: true
        }),
        message: preparedCaption,
        entities,
        scheduleDate: scheduleTimestamp
      });

      const result = await this.client.invoke(request);
      const sentMessage: any = this.client._getResponseMessage(request, result, entity);
      const resolved = Array.isArray(sentMessage) ? sentMessage[0] : sentMessage;
      const messageId = resolved?.id ? resolved.id.toString() : undefined;

      console.log(
        scheduleTimestamp
          ? '✅ Видео со спойлером запланировано, ID:'
          : '✅ Видео со спойлером отправлено, ID:',
        messageId
      );

      if (watermarkedVideoPath && fs.existsSync(watermarkedVideoPath)) {
        try {
          fs.unlinkSync(watermarkedVideoPath);
          console.log('🗑️ Временный файл с водяным знаком удален');
        } catch (err) {
          console.warn('⚠️ Не удалось удалить временный файл:', err);
        }
      }

      return scheduleTimestamp
        ? { success: true, message: 'Медиафайл запланирован через MTProto', scheduledMessageId: messageId }
        : { success: true, message: 'Медиафайл отправлен через MTProto', messageId };
    } catch (error) {
      if (watermarkedVideoPath && fs.existsSync(watermarkedVideoPath)) {
        try {
          fs.unlinkSync(watermarkedVideoPath);
        } catch (err) {
        }
      }
      
      console.error('❌ Ошибка отправки видео со спойлером через MTProto:', error);

      let errorMessage = 'Ошибка отправки видеофайла';
      if (error instanceof Error) {
        if (error.message.includes('FILE_TOO_LARGE')) {
          errorMessage = 'Файл слишком большой для отправки';
        } else if (error.message.includes('FILE_EMPTY')) {
          errorMessage = 'Файл пустой или поврежден';
        } else if (error.message.includes('FILE_NOT_FOUND')) {
          errorMessage = 'Файл не найден';
        } else if (error.message.includes('INVALID_FILE_TYPE') || error.message.includes('PHOTO_EXT_INVALID')) {
          errorMessage = 'Неподдерживаемый тип файла';
        } else {
          errorMessage = `Ошибка отправки видеофайла: ${error.message}`;
        }
      }

      return { success: false, message: errorMessage };
    }
  }

  private async sendMediaGroupWithMTProto(mediaArray: any[], entity: any, caption: string): Promise<PublishResult> {
    try {
      if (!Array.isArray(mediaArray) || mediaArray.length === 0) {
        throw new Error('Нет медиафайлов для отправки');
      }

      const inputPeer = await this.client.getInputEntity(entity);

      const inputMediaList = [];
      for (const media of mediaArray) {
        const preparedMedia = await this.prepareAlbumMedia(media, inputPeer);
        inputMediaList.push(preparedMedia);
      }

      const [preparedCaption, entities] = await _parseMessageText(this.client as any, caption || '', 'html');

      const multiMedia = inputMediaList.map((mediaInput, index) => new Api.InputSingleMedia({
        media: mediaInput,
        message: index === 0 ? preparedCaption : '',
        entities: index === 0 && Array.isArray(entities) && entities.length > 0 ? entities : undefined,
        randomId: this.generateRandomLong()
      }));

      console.log('🧪 Подготовленный альбом:', multiMedia.map((item, index) => ({
        index,
        mediaClass: item.media?.className,
        mediaType: (mediaArray[index] || {}).type,
        hasEntities: !!item.entities,
        messageLength: item.message?.length || 0,
        randomId: item.randomId !== undefined ? item.randomId.toString() : undefined
      })));

      const request = new Api.messages.SendMultiMedia({
        peer: inputPeer,
        multiMedia
      });

      const result = await this.client.invoke(request);
      const sentMessages: any = this.client._getResponseMessage(request, result, inputPeer);
      const resolvedMessages = Array.isArray(sentMessages)
        ? sentMessages
        : sentMessages
          ? [sentMessages]
          : [];

      const firstMessageId = resolvedMessages.length > 0 ? resolvedMessages[0]?.id : undefined;
      console.log('✅ Группа медиафайлов отправлена, ID первого сообщения:', firstMessageId);

      return { 
        success: true, 
        message: 'Группа медиафайлов отправлена через MTProto',
        messageId: firstMessageId ? firstMessageId.toString() : undefined
      };
    } catch (error) {
      console.error('❌ Ошибка отправки группы медиафайлов:', error);
      return { success: false, message: 'Ошибка отправки группы медиафайлов' };
    }
  }

  private async sendScheduledMediaGroupWithMTProto(mediaArray: any[], entity: any, caption: string, scheduleTimestamp: number): Promise<PublishResult> {
    try {
      if (!Array.isArray(mediaArray) || mediaArray.length === 0) {
        throw new Error('Нет медиафайлов для планирования');
      }

      const inputPeer = await this.client.getInputEntity(entity);

      const inputMediaList = [];
      for (const media of mediaArray) {
        const preparedMedia = await this.prepareAlbumMedia(media, inputPeer);
        inputMediaList.push(preparedMedia);
      }

      const [preparedCaption, entities] = await _parseMessageText(this.client as any, caption || '', 'html');

      const multiMedia = inputMediaList.map((mediaInput, index) => new Api.InputSingleMedia({
        media: mediaInput,
        message: index === 0 ? preparedCaption : '',
        entities: index === 0 && Array.isArray(entities) && entities.length > 0 ? entities : undefined,
        randomId: this.generateRandomLong()
      }));

      console.log('🧪 Подготовленный альбом (schedule):', multiMedia.map((item, index) => ({
        index,
        mediaClass: item.media?.className,
        mediaType: (mediaArray[index] || {}).type,
        hasEntities: !!item.entities,
        messageLength: item.message?.length || 0,
        randomId: item.randomId !== undefined ? item.randomId.toString() : undefined
      })));

      const request = new Api.messages.SendMultiMedia({
        peer: inputPeer,
        multiMedia,
        scheduleDate: scheduleTimestamp
      });

      const result = await this.client.invoke(request);
      const scheduledMessages: any = this.client._getResponseMessage(request, result, inputPeer);
      const resolvedMessages = Array.isArray(scheduledMessages)
        ? scheduledMessages
        : scheduledMessages
          ? [scheduledMessages]
          : [];

      const firstMessageId = resolvedMessages.length > 0 ? resolvedMessages[0]?.id : undefined;
      console.log('✅ Группа медиафайлов запланирована, ID первого сообщения:', firstMessageId);

      return { 
        success: true, 
        message: 'Группа медиафайлов запланирована через MTProto',
        scheduledMessageId: firstMessageId ? firstMessageId.toString() : undefined
      };
    } catch (error) {
      console.error('❌ Ошибка планирования группы медиафайлов:', error);
      return { success: false, message: 'Ошибка планирования группы медиафайлов' };
    }
  }


  /**
   * Создает InputMedia для медиа-групп (без подписи)
   */
  private async createInputMediaForGroup(media: any): Promise<any> {
    const filePath = await this.findMediaFile(media.file_path);
    if (!filePath) {
      throw new Error(`Файл не найден: ${media.file_path}`);
    }

    const path = await import('path');
    
    // Накладываем водяной знак на видео
    let finalFilePath = filePath;
    if (media.type === 'video') {
      try {
        const randomPosition = this.getRandomWatermarkPosition();
        finalFilePath = await this.addWatermarkToVideo(filePath, randomPosition, 0.44, 0.8);
      } catch (error) {
        console.warn('⚠️ Не удалось наложить водяной знак на видео в группе, используем оригинальное видео:', error);
      }
    }
    
    const stats = fs.statSync(finalFilePath);
    const fileName = path.basename(finalFilePath);
    
    console.log(`📤 Загружаем файл для группы: ${fileName} (${(stats.size / 1024 / 1024).toFixed(2)}MB)`);
    
    const uploadedFile = await this.client.uploadFile({
      file: new CustomFile(fileName, stats.size, finalFilePath),
      workers: this.getOptimalWorkers(stats.size)
    });

    console.log('✅ Файл успешно загружен в Telegram');

    // Удаляем временный файл с водяным знаком после успешной загрузки
    if (finalFilePath !== filePath && fs.existsSync(finalFilePath)) {
      try {
        fs.unlinkSync(finalFilePath);
        console.log('🗑️ Временный файл с водяным знаком удален (группа)');
      } catch (err) {
        console.warn('⚠️ Не удалось удалить временный файл:', err);
      }
    }

    switch (media.type) {
      case 'photo':
        return new Api.InputMediaUploadedPhoto({
          file: uploadedFile
        });
      case 'video':
        let thumb: any = undefined;
        if (media.thumbnail_path) {
          const thumbPath = await this.findMediaFile(media.thumbnail_path);
          if (thumbPath) {
            const thumbStats = fs.statSync(thumbPath);
            const thumbFileName = path.basename(thumbPath);
            console.log(`🖼️ Загружаем превью для группы: ${thumbFileName} (${(thumbStats.size / 1024).toFixed(2)}KB)`);
            thumb = await this.client.uploadFile({
              file: new CustomFile(thumbFileName, thumbStats.size, thumbPath),
              workers: 1
            });
            console.log('✅ Превью для группы загружено');
          }
        }

        const videoMetadata = await this.getVideoMetadata(finalFilePath);

        return new Api.InputMediaUploadedDocument({
          file: uploadedFile,
          mimeType: this.getMimeType(finalFilePath),
          attributes: [
            new Api.DocumentAttributeVideo({
              duration: videoMetadata.duration || 0,
              w: videoMetadata.width || 0,
              h: videoMetadata.height || 0,
              supportsStreaming: this.isStreamableVideo(finalFilePath)
            })
          ],
          thumb
        });
      default:
        return new Api.InputMediaUploadedDocument({
          file: uploadedFile,
          mimeType: this.getMimeType(finalFilePath),
          attributes: []
        });
    }
  }

  private async prepareAlbumMedia(media: any, inputPeer: any): Promise<any> {
    const uploadedMedia = await this.createInputMediaForGroup(media);

    const uploadResult = await this.client.invoke(new Api.messages.UploadMedia({
      peer: inputPeer,
      media: uploadedMedia
    }));

    if (uploadResult instanceof Api.MessageMediaPhoto) {
      return utils.getInputMedia(uploadResult.photo);
    }

    if (uploadResult instanceof Api.MessageMediaDocument) {
      return utils.getInputMedia(uploadResult.document);
    }

    console.error('❌ Не удалось подготовить медиа для альбома. Неизвестный ответ UploadMedia:', uploadResult?.className || uploadResult);
    throw new Error('Не удалось подготовить медиа для альбома');
  }

  /**
   * @param media
   * @param caption
   * @returns 
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
            file: uploadedFile
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
          console.log(this.getMimeType(filePath))
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
            thumb: thumb
          });

        case 'document':
        default:
          return new Api.InputMediaUploadedDocument({
            file: uploadedFile,
            mimeType: this.getMimeType(filePath),
            attributes: []
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

  private generateRandomLong(): bigInt.BigInteger {
    let value = 0n;
    while (value === 0n) {
      const bytes = crypto.randomBytes(8);
      value = BigInt('0x' + bytes.toString('hex'));
      value = BigInt.asUintN(63, value);
    }
    return bigInt(value.toString());
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
