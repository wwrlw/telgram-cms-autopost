import Fastify from 'fastify';
import dotenv from 'dotenv';
import mongoConnector from './db/mongo';
import authPlugin from './plugins/auth';
import { authRoutes } from './routes/auth';
import { postsRoutes } from './routes/posts';
import cors from '@fastify/cors'
import { startTelegramParser } from './parser/telegramParser';

dotenv.config();

const fastify = Fastify({ logger: true });

async function start() {
    try {
        await fastify.register(cors, {
            origin: true,
            credentials: true,
          });
        await fastify.register(mongoConnector);
        await fastify.register(authPlugin);
        await fastify.register(authRoutes);
        await fastify.register(postsRoutes);
        await fastify.ready();
        // if (fastify.mongo.db) {
        //     startTelegramParser(fastify.mongo.db);
        // } else {
        //     fastify.log.error('MongoDB is not connected, parser not started');
        // }
        await fastify.listen({ port: Number(process.env.PORT) || 3001, host: '0.0.0.0' });
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();