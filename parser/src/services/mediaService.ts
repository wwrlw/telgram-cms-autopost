import { TelegramClient, Api } from 'telegram';
import sharp from 'sharp';
import fs from 'fs-extra';
import path from 'path';
import { Media } from '../types/index.js';

export class MediaService {
  constructor(private mediaPath: string) {
    this.ensureMediaDirectories();
  }

  private async ensureMediaDirectories(): Promise<void> {
    const dirs = [
      this.mediaPath,
      path.join(this.mediaPath, 'photos'),
      path.join(this.mediaPath, 'videos'),
      path.join(this.mediaPath, 'documents'),
      path.join(this.mediaPath, 'thumbnails')
    ];

    for (const dir of dirs) {
      await fs.ensureDir(dir);
    }
  }

  async processMedia(
    client: TelegramClient,
    message: any,
    channelId: number,
    messageId: number
  ): Promise<Media[]> {
    if (!message.media) {
      console.log('📷 Нет медиа в сообщении');
      return [];
    }

    console.log('📷 Найдено медиа в сообщении:', {
      mediaType: message.media?.className,
      isArray: Array.isArray(message.media),
      mediaCount: Array.isArray(message.media) ? message.media.length : 1
    });

    const mediaArray: Media[] = [];
    const mediaList = Array.isArray(message.media) ? message.media : [message.media];

    console.log(`📷 Обрабатываем ${mediaList.length} медиафайлов`);

    for (let i = 0; i < mediaList.length; i++) {
      const media = mediaList[i];
      console.log(`📷 Обрабатываем медиа ${i + 1}/${mediaList.length}:`, {
        className: media?.className,
        type: this.getMediaType(media)
      });
      
      try {
        const mediaInfo = await this.processSingleMedia(client, media, channelId, messageId, i);
        if (mediaInfo) {
          mediaArray.push(mediaInfo);
          console.log(`✅ Медиа ${i + 1} успешно обработано:`, mediaInfo);
        } else {
          console.log(`❌ Медиа ${i + 1} не удалось обработать`);
        }
      } catch (error) {
        console.error(`❌ Ошибка обработки медиа ${i}:`, error);
      }
    }

    console.log(`📷 Итого обработано медиафайлов: ${mediaArray.length}`);
    return mediaArray;
  }

  private async processSingleMedia(
    client: TelegramClient,
    media: any,
    channelId: number,
    messageId: number,
    index: number
  ): Promise<Media | null> {
    const mediaType = this.getMediaType(media);
    if (!mediaType) return null;

    const fileName = `${channelId}_${messageId}_${index}`;
    const fileExtension = this.getFileExtension(media, mediaType);
    const fullFileName = `${fileName}.${fileExtension}`;
    let thumbnailPath: string | undefined = undefined;

    try {
      // Скачиваем основной файл
      const filePath = await client.downloadMedia(media, {
        outputFile: path.join(this.mediaPath, mediaType, fullFileName)
      });

      if (!filePath || typeof filePath !== 'string') {
        throw new Error('Не удалось получить путь к файлу');
      }

      // Обрабатываем изображения
      if (mediaType === 'photos') {
        await this.processImage(filePath);
      }

      if (mediaType === 'videos') {
        const mediaContent = media instanceof Api.MessageMediaDocument ? media.document : media.video;
        if (mediaContent && mediaContent  && mediaContent.thumbs.length > 0) {
          const largestThumbnail  = mediaContent.thumbs.reduce((prev: any, current: any) => {
            return (prev.bytes || 0) > (current.bytes || 0) ? prev : current;
          });
          if (largestThumbnail && largestThumbnail.location) {
            const thumbExt = largestThumbnail.className === 'PhotoSize' || largestThumbnail.className === 'PhotoStrippedSize' ? 'jpg' : 'webp'; // Уточняем расширение для превью
            const thumbFileName = `${fileName}_thumb.${thumbExt}`;
            const fullThumbnailPath = path.join(this.mediaPath, 'thumbnails', thumbFileName);

            try {
              const downloadedThumb = await client.downloadMedia(largestThumbnail.location, {
                  outputFile: fullThumbnailPath
              });

              if (downloadedThumb && typeof downloadedThumb === 'string') {
                thumbnailPath = downloadedThumb;
                console.log(`🖼️ Превью для ${mediaType} сохранено: ${thumbnailPath}`);

              } else {
                console.warn(`⚠️ Не удалось скачать превью для ${fileName} из-за ошибки в downloadMedia.`);
              }
            } catch (thumbError) {
              console.warn(`⚠️ Ошибка при скачивании превью для ${fileName}:`, thumbError);
            }
          }
        }
      return {
        type: mediaType === 'photos' ? 'photo' : 
              mediaType === 'videos' ? 'video' : 
              mediaType === 'documents' ? 'document' : 'document',
        file_path: filePath,
        thumbnail_path: thumbnailPath
      };

    } catch (error) {
      console.error(`❌ Ошибка скачивания медиа ${fileName}:`, error);
      return null;
    }
  }

  private getMediaType(media: any): string | null {
    if (media instanceof Api.MessageMediaPhoto) return 'photos';
    if (media instanceof Api.MessageMediaDocument) {
      const document = media.document;
      if (document instanceof Api.Document) {
        const mimeType = document.mimeType || '';
        if (mimeType.startsWith('video/')) return 'videos';
        if (mimeType.startsWith('audio/')) return 'documents';
        return 'documents';
      }
    }
    return null;
  }

  private getFileExtension(media: any, mediaType: string): string {
    if (mediaType === 'photos') return 'jpg';
    if (mediaType === 'videos') return 'mp4';
    if (media instanceof Api.MessageMediaDocument) {
      const document = media.document;
      if (document instanceof Api.Document) {
        const fileName = document.attributes?.find(attr => attr instanceof Api.DocumentAttributeFilename) as Api.DocumentAttributeFilename;
        if (fileName?.fileName) {
          const ext = path.extname(fileName.fileName);
          if (ext) return ext.slice(1);
        }
      }
    }
    return 'bin';
  }

  private async processImage(filePath: string): Promise<void> {
    try {
      const image = sharp(filePath);
      const metadata = await image.metadata();
      
      // Оптимизируем изображение если оно слишком большое
      if (metadata.width && metadata.width > 1920) {
        await image
          .resize(1920, null, { withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toFile(filePath + '.optimized');
        
        await fs.move(filePath + '.optimized', filePath, { overwrite: true });
      }
    } catch (error) {
      console.error('❌ Ошибка обработки изображения:', error);
    }
  }
} 