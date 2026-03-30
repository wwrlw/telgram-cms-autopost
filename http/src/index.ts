import Fastify from 'fastify';
import dotenv from 'dotenv';
import mongoConnector from './infrastructure/plugins/mongo';
import authPlugin from './infrastructure/plugins/auth';
import authRoutes from './modules/auth/auth.routes';
import { postsRoutes } from './modules/post/post.routes';
import { channelsRoutes } from './modules/channel/channel.routes';
import { postedChannelsRoutes } from './modules/publication-channel/publication-channel.routes';
import { categoriesRoutes } from './modules/category/category.routes';
import { analyticsRoutes } from './modules/analytics/analytics.routes';
import publishRoutes from './modules/publication-channel/publish.routes';
import swagger from './infrastructure/plugins/swagger';
import logsRoutes from './modules/logs/logs.routes';
import { mediaRoutes } from './modules/media/media.routes';
import telegramConfigRoutes from './modules/telegram-config/telegram-config.routes';
import cors from '@fastify/cors'
import fastifyStatic from '@fastify/static'
import path from 'path';
import { DependencyContainer } from './infrastructure/container/dependency-container';
import { errorHandler } from './shared/middleware/error-handler';
import multipart from '@fastify/multipart'
import cookie from '@fastify/cookie'

dotenv.config();

const fastify = Fastify({ logger: true });

async function start() {
    try {
        (fastify as any).trustProxy = true;
        await fastify.register(cors, {
            origin: true,
            credentials: true,
          });
        await fastify.register(cookie, {
            hook: 'onRequest'
        });
        await fastify.register(mongoConnector);
        const container = DependencyContainer.getInstance();
        container.setMongo(fastify.mongo);
        
        await fastify.register(multipart, { limits: { files: 10 } });
        
        await fastify.register(fastifyStatic, {
            root: path.join(process.cwd(), 'media'),
            prefix: '/media/',
            decorateReply: false
        });
        await fastify.register(swagger);
        await fastify.register(authPlugin);
        await fastify.register(authRoutes, { prefix: '/auth' });
        await fastify.register(postsRoutes);
        await fastify.register(channelsRoutes);
        await fastify.register(postedChannelsRoutes);
        await fastify.register(categoriesRoutes);
        await fastify.register(analyticsRoutes);
        await fastify.register(publishRoutes);
        await fastify.register(logsRoutes, { prefix: '/logs' });
        await fastify.register(mediaRoutes);
        await fastify.register(telegramConfigRoutes, { prefix: '/telegram-config' });
        fastify.get('/health', async () => ({ status: 'ok' }));
        fastify.setErrorHandler(errorHandler);
        await fastify.ready();
        await fastify.listen({ port: Number(process.env.PORT) || 4000, host: '0.0.0.0' });
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();