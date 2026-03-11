import { FastifyInstance } from 'fastify';
import path from 'path';
import fs from 'fs';
import { pipeline } from 'stream/promises';
import { DependencyContainer } from '../container/DependencyContainer';
import { requireAuth, requirePermission } from '../middleware/authRole';
import { PERMISSIONS } from '../models/Category';

export async function mediaRoutes(fastify: FastifyInstance) {
  const container = DependencyContainer.getInstance();

  // Эндпоинт для загрузки медиафайлов
  fastify.post(
    '/media/upload',
    { preValidation: [requireAuth, requirePermission(PERMISSIONS.UPLOAD_MEDIA)] },
    async (request: any, reply) => {
      try {
        const parts = request.parts();
        const uploadedFiles: any[] = [];

        // Создаем папку media, если её нет
        const mediaDir = path.join(process.cwd(), 'media');
        if (!fs.existsSync(mediaDir)) {
          try {
            fs.mkdirSync(mediaDir, { recursive: true });
            fastify.log.info(`Created media directory: ${mediaDir}`);
          } catch (mkdirError) {
            fastify.log.error(`Failed to create media directory: ${mkdirError}`);
            return reply.status(500).send({
              success: false,
              message: 'Ошибка создания папки для медиафайлов'
            });
          }
        }

        for await (const part of parts) {
          if (part.type === 'file') {
            try {
              const fileExt = path.extname(part.filename);
              const fileName = `${Date.now()}-${Math.random().toString(36).substring(2,8)}${fileExt}`;
              const uploadPath = path.join(mediaDir, fileName);
              
              fastify.log.info(`Uploading file: ${part.filename} to ${uploadPath}`);
              
              await pipeline(part.file, fs.createWriteStream(uploadPath));
              
              uploadedFiles.push({
                type: part.mimetype.startsWith('video') ? 'video' : 
                      part.mimetype.startsWith('audio') ? 'audio' : 
                      part.mimetype.startsWith('image') ? 'photo' : 'document',
                file_path: `/media/${fileName}`,
                original_name: part.filename,
                mime_type: part.mimetype
              });
              
              fastify.log.info(`Successfully uploaded: ${fileName}`);
            } catch (fileError) {
              fastify.log.error(`Error uploading file ${part.filename}: ${fileError}`);
              return reply.status(500).send({
                success: false,
                message: `Ошибка загрузки файла ${part.filename}`
              });
            }
          }
        }

        if (uploadedFiles.length === 0) {
          return reply.status(400).send({
            success: false,
            message: 'Не выбраны файлы для загрузки'
          });
        }

        return {
          success: true,
          data: uploadedFiles.length === 1 ? uploadedFiles[0] : uploadedFiles
        };
      } catch (error) {
        fastify.log.error('Error uploading media:', error);
        return reply.status(500).send({
          success: false,
          message: 'Ошибка загрузки файла'
        });
      }
    }
  );
} 