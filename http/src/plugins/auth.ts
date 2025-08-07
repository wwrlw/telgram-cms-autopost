// auth.ts
import fastifyPlugin from 'fastify-plugin';
import { FastifyInstance } from 'fastify';

async function authPlugin(fastify: FastifyInstance) {
  fastify.register(require('@fastify/jwt'), {
    secret: process.env.JWT_SECRET || 'supersecretkey',
  });

  fastify.decorate(
    'authenticate',
    async function (request: any, reply: any) {
      try {
        await request.jwtVerify();
      } catch (err) {
        console.error('Authentication error:', err);
        reply.status(401).send({ success: false, message: 'Authentication failed' });
      }
    }
  );
}

export default fastifyPlugin(authPlugin);