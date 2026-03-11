// mongo connector for Fastify
import fastifyPlugin from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import fastifyMongo from '@fastify/mongodb';

async function mongoConnector(fastify: FastifyInstance) {
  fastify.register(fastifyMongo, {
    forceClose: true,
    url: process.env.MONGODB_URI,
    database: process.env.MONGO_DB_NAME || '',
  });
}

export default fastifyPlugin(mongoConnector);