import Fastify from 'fastify';
import dotenv from 'dotenv';
import mongoConnector from './db/mongo';
import authPlugin from './plugins/auth';
import { authRoutes } from './routes/auth';
import { postsRoutes } from './routes/posts';
import { channelsRoutes } from './routes/channels';
import { postedChannelsRoutes } from './routes/posted-channels';
import { categoriesRoutes } from './routes/categories';
import { analyticsRoutes } from './routes/analytics';
import publishRoutes from './routes/publish';
import cors from '@fastify/cors'
import fastifyStatic from '@fastify/static'
import path from 'path';
import { DependencyContainer } from './container/DependencyContainer';
import { errorHandler } from './middleware/ErrorHandler';
// @ts-ignore – нет типов для fastify v4
import multipart from '@fastify/multipart'

dotenv.config();

const fastify = Fastify({ logger: true });

async function start() {
    try {
        await fastify.register(cors, {
            origin: true,
            credentials: true,
          });
        await fastify.register(mongoConnector);
        const container = DependencyContainer.getInstance();
        container.setMongo(fastify.mongo);
        
        await fastify.register(multipart, { limits: { files: 10 } });
        
        // Настройка раздачи статических файлов для медиа
        await fastify.register(fastifyStatic, {
            root: path.join(process.cwd(), 'media'),
            prefix: '/media/',
            decorateReply: false
        });
        
        await fastify.register(authPlugin);
        await fastify.register(authRoutes);
        await fastify.register(postsRoutes);
        await fastify.register(channelsRoutes);
        await fastify.register(postedChannelsRoutes);
        await fastify.register(categoriesRoutes);
        await fastify.register(analyticsRoutes);
        await fastify.register(publishRoutes);
        fastify.setErrorHandler(errorHandler);
        await fastify.ready();
        await fastify.listen({ port: Number(process.env.PORT) || 3001, host: '0.0.0.0' });
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();