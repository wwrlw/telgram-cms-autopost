import Fastify from 'fastify';
import dotenv from 'dotenv';
import mongoConnector from './plugins/mongo';
import authPlugin from './plugins/auth';
import authRoutes from './routes/auth';
import { postsRoutes } from './routes/posts';
import { channelsRoutes } from './routes/channels';
import { postedChannelsRoutes } from './routes/posted-channels';
import { categoriesRoutes } from './routes/categories';
import { analyticsRoutes } from './routes/analytics';
import publishRoutes from './routes/publish';
import swagger from './plugins/swagger';
import logsRoutes from './routes/logs';
import { mediaRoutes } from './routes/media';
import cors from '@fastify/cors'
import fastifyStatic from '@fastify/static'
import path from 'path';
import { DependencyContainer } from './container/DependencyContainer';
import { errorHandler } from './middleware/ErrorHandler';
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
        fastify.setErrorHandler(errorHandler);
        await fastify.ready();
        await fastify.listen({ port: Number(process.env.PORT) || 4000, host: '0.0.0.0' });
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();