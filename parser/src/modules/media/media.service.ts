import { TelegramClient, Api } from 'telegram';
import sharp from 'sharp';
import fs from 'fs-extra';
import path from 'path';
import { Media } from '../../types/index.js';
import { execFile } from 'child_process';
import ffmpegPath from 'ffmpeg-static';

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
      path.join(this.mediaPath, 'thumbnails'),
    ];
    for (const dir of dirs) {
      await fs.ensureDir(dir);
    }
  }

  async processMedia(
    client: TelegramClient,
    message: any,
    channelId: number,
    messageId: number,
  ): Promise<Media[]> {
    if (!message.media) return [];

    const mediaArray: Media[] = [];
    const mediaList = Array.isArray(message.media) ? message.media : [message.media];

    for (let i = 0; i < mediaList.length; i++) {
      try {
        const mediaInfo = await this.processSingleMedia(client, mediaList[i], channelId, messageId, i);
        if (mediaInfo) mediaArray.push(mediaInfo);
      } catch (error) {
        console.error(`❌ Ошибка обработки медиа ${i}:`, error);
      }
    }

    return mediaArray;
  }

  private async processSingleMedia(
    client: TelegramClient,
    media: any,
    channelId: number,
    messageId: number,
    index: number,
  ): Promise<Media | null> {
    const mediaType = this.getMediaType(media);
    if (!mediaType) return null;

    const fileName = `${channelId}_${messageId}_${index}`;
    const fileExtension = this.getFileExtension(media, mediaType);
    const fullFileName = `${fileName}.${fileExtension}`;
    let thumbnailPath: string | undefined;

    try {
      const filePath = await client.downloadMedia(media, {
        outputFile: path.join(this.mediaPath, mediaType, fullFileName),
      });

      if (!filePath || typeof filePath !== 'string') {
        throw new Error('Не удалось получить путь к файлу');
      }

      const relativeFilePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');

      if (mediaType === 'photos') {
        await this.processImage(filePath);
      }

      if (mediaType === 'videos') {
        const thumbOut = path.join(this.mediaPath, 'thumbnails', `${fileName}.jpg`);
        try {
          await this.extractVideoThumbnailFFmpeg(filePath, thumbOut);
          thumbnailPath = thumbOut;
        } catch {
          thumbnailPath = await this.downloadThumbnail(client, fileName, media.video);
        }
      }

      return {
        type: mediaType === 'photos' ? 'photo' : mediaType === 'videos' ? 'video' : 'document',
        file_path: relativeFilePath,
        thumbnail_path: thumbnailPath,
      };
    } catch (error) {
      console.error(`❌ Ошибка скачивания медиа ${fileName}:`, error);
      return null;
    }
  }

  private async downloadThumbnail(
    client: TelegramClient,
    fileName: string,
    doc: Api.Document,
  ): Promise<string | undefined> {
    if (!doc || !doc.thumbs || doc.thumbs.length === 0) return undefined;

    const largestThumb = doc.thumbs.reduce((prev: any, curr: any) => {
      return (prev.w || 0) * (prev.h || 0) > (curr.w || 0) * (curr.h || 0) ? prev : curr;
    });

    if (!largestThumb) return undefined;

    const thumbFileName = `${fileName}_tg.jpg`;
    const fullThumbnailPath = path.join(this.mediaPath, 'thumbnails', thumbFileName);

    try {
      const downloaded = await client.downloadFile(
        new Api.InputDocumentFileLocation({
          id: doc.id,
          accessHash: doc.accessHash,
          fileReference: doc.fileReference,
          thumbSize: largestThumb.type,
        }),
        { outputFile: fullThumbnailPath },
      );
      if (typeof downloaded === 'string') return downloaded;
    } catch (err) {
      console.warn('⚠️ Ошибка при скачивании превью из Telegram:', err);
    }
    return undefined;
  }

  private extractVideoThumbnailFFmpeg(inputPath: string, outputPath: string, seekSeconds = 2): Promise<string> {
    const bin = (ffmpegPath as unknown as string) || 'ffmpeg';
    return new Promise((resolve, reject) => {
      const args = ['-y', '-ss', String(seekSeconds), '-i', inputPath, '-frames:v', '1', '-q:v', '2', '-vf', 'thumbnail,scale=640:-2', outputPath];
      execFile(bin, args, (err) => {
        if (err) {
          const fallbackArgs = ['-y', '-ss', '0.1', '-i', inputPath, '-frames:v', '1', '-q:v', '2', '-vf', 'thumbnail,scale=640:-2', outputPath];
          execFile(bin, fallbackArgs, (err2) => {
            if (err2) return reject(err2);
            resolve(outputPath);
          });
          return;
        }
        resolve(outputPath);
      });
    });
  }

  private getMediaType(media: any): string | null {
    if (media instanceof Api.MessageMediaPhoto) return 'photos';
    if (media instanceof Api.MessageMediaDocument) {
      const document = media.document;
      if (document instanceof Api.Document) {
        const mimeType = document.mimeType || '';
        if (mimeType.startsWith('video/')) return 'videos';
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
        const attr = document.attributes?.find(a => a instanceof Api.DocumentAttributeFilename) as Api.DocumentAttributeFilename;
        if (attr?.fileName) {
          const ext = path.extname(attr.fileName);
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
      if (metadata.width && metadata.width > 1920) {
        await image.resize(1920, null, { withoutEnlargement: true }).jpeg({ quality: 85 }).toFile(filePath + '.optimized');
        await fs.move(filePath + '.optimized', filePath, { overwrite: true });
      }
    } catch (error) {
      console.error('❌ Ошибка обработки изображения:', error);
    }
  }
}
