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
        reply.send(err);
      }
    }
  );
}

export default fastifyPlugin(authPlugin);