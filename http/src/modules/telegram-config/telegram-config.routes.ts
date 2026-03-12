import { FastifyInstance } from 'fastify';
import { DependencyContainer } from '../../infrastructure/container/dependency-container';
import { requireAuth, requirePermission } from '../../shared/middleware/auth-role';
import { PERMISSIONS } from '../category/category.model';

export default async function telegramConfigRoutes(fastify: FastifyInstance) {
  const container = DependencyContainer.getInstance();

  // Список всех конфигов (публичный вид)
  fastify.get('/', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.MANAGE_CHANNELS)],
  }, async (req, reply) => {
    const service = container.getTelegramConfigService();
    const configs = await service.getAll();
    reply.send({ success: true, data: configs });
  });

  // Активный конфиг — используется парсером (расшифрованные данные)
  fastify.get('/active', async (req, reply) => {
    const service = container.getTelegramConfigService();
    const config = await service.getActiveDecrypted();
    if (!config) return reply.status(404).send({ success: false, message: 'No active config' });
    reply.send({ success: true, data: config });
  });

  // Создать конфиг
  fastify.post<{ Body: { label: string; api_id: string; api_hash: string; phone: string } }>('/', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.MANAGE_CHANNELS)],
  }, async (req, reply) => {
    const service = container.getTelegramConfigService();
    const config = await service.create(req.body);
    reply.code(201).send({ success: true, data: config });
  });

  // Шаг 1: отправить код на телефон
  fastify.post<{ Params: { id: string }; Body: { phone?: string } }>('/:id/auth/send-code', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.MANAGE_CHANNELS)],
  }, async (req, reply) => {
    try {
      const service = container.getTelegramConfigService();
      const result = await service.sendCode(req.params.id, req.body?.phone);
      reply.send({ success: true, data: result });
    } catch (e: any) {
      reply.status(500).send({ success: false, message: e.message });
    }
  });

  // Шаг 2: подтвердить код
  fastify.post<{ Params: { id: string }; Body: { code: string; phoneCodeHash: string } }>('/:id/auth/verify-code', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.MANAGE_CHANNELS)],
  }, async (req, reply) => {
    try {
      const service = container.getTelegramConfigService();
      await service.verifyCode(req.params.id, req.body.code, req.body.phoneCodeHash);
      reply.send({ success: true, data: { message: 'Авторизован. Парсер перезапускается.' } });
    } catch (e: any) {
      reply.status(500).send({ success: false, message: e.message });
    }
  });

  // Сохранить сессию — вызывается парсером после авторизации
  fastify.post<{ Body: { sessionString: string } }>('/session', async (req, reply) => {
    try {
      const service = container.getTelegramConfigService();
      const active = await service.getAll();
      const pending = active.find(c => c.status === 'pending_code');
      if (!pending) return reply.status(404).send({ success: false, message: 'No pending config' });
      await service.saveSession(pending._id, req.body.sessionString);
      reply.send({ success: true });
    } catch (e: any) {
      reply.status(500).send({ success: false, message: e.message });
    }
  });

  // Удалить конфиг
  fastify.delete<{ Params: { id: string } }>('/:id', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.MANAGE_CHANNELS)],
  }, async (req, reply) => {
    const service = container.getTelegramConfigService();
    await service.delete(req.params.id);
    reply.send({ success: true });
  });
}
