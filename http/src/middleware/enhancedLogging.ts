import { FastifyRequest, FastifyReply } from 'fastify';
import { Log } from '../models/Log';
import { enhancedRequireAuth } from './enhancedAuth';

/**
 * Улучшенное логирование действий с проверкой прав
 */
export const enhancedLogAction = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // Проверяем авторизацию и права
    await enhancedRequireAuth(request, reply);
    
    const user = (request as any).user;
    if (!user || !user.userId) {
      console.error('Enhanced logging: No user data available');
      return;
    }

    // Получаем информацию о действии
    const action = request.method + ' ' + request.url;
    const userId = user.userId;
    const username = user.username;
    const userRole = user.role;
    const userPermissions = user.permissions;

    // Создаем запись лога
    const logEntry: Partial<Log> = {
      userId: userId,
      username: username,
      role: userRole,
      action: action,
      timestamp: new Date(),
      ip: (request as any).ip || 'unknown',
      userAgent: (request.headers['user-agent'] as string) || 'unknown',
      permissions: userPermissions,
      success: true
    };

    // Сохраняем лог в базу данных
    try {
      const mongo = (request as any).mongo;
      if (mongo && mongo.db) {
        const db = mongo.client.db('parse-news');
        const logsCollection = db.collection('logs');
        await logsCollection.insertOne(logEntry as Log);
        console.log(`Enhanced logging: Action logged successfully for user ${username}`);
      }
    } catch (dbError) {
      console.error('Enhanced logging: Failed to save log to database:', dbError);
      // Не прерываем выполнение, если логирование не удалось
    }

  } catch (error) {
    console.error('Enhanced logging: Error during logging:', error);
    // Не прерываем выполнение, если логирование не удалось
  }
};

/**
 * Логирование действий с дополнительными метаданными
 */
export const enhancedLogActionWithMetadata = (metadata: Record<string, any>) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Проверяем авторизацию и права
      await enhancedRequireAuth(request, reply);
      
      const user = (request as any).user;
      if (!user || !user.userId) {
        console.error('Enhanced logging with metadata: No user data available');
        return;
      }

      // Получаем информацию о действии
      const action = request.method + ' ' + request.url;
      const userId = user.userId;
      const username = user.username;
      const userRole = user.role;
      const userPermissions = user.permissions;

      // Создаем запись лога с дополнительными метаданными
      const logEntry: Partial<Log> = {
        userId: userId,
        username: username,
        role: userRole,
        action: action,
        timestamp: new Date(),
        ip: (request as any).ip || 'unknown',
        userAgent: (request.headers['user-agent'] as string) || 'unknown',
        permissions: userPermissions,
        success: true,
        metadata: metadata
      };

      // Сохраняем лог в базу данных
      try {
        const mongo = (request as any).mongo;
        if (mongo && mongo.db) {
          const db = mongo.client.db('parse-news');
                  const logsCollection = db.collection('logs');
        await logsCollection.insertOne(logEntry as Log);
          console.log(`Enhanced logging with metadata: Action logged successfully for user ${username}`);
        }
      } catch (dbError) {
        console.error('Enhanced logging with metadata: Failed to save log to database:', dbError);
        // Не прерываем выполнение, если логирование не удалось
      }

    } catch (error) {
      console.error('Enhanced logging with metadata: Error during logging:', error);
      // Не прерываем выполнение, если логирование не удалось
    }
  };
};
