import 'fastify';

declare module 'fastify' {
  interface FastifyReply {
    setCookie: (name: string, value: string, options?: any) => this;
  }
}

import 'fastify';
import { JWT } from '@fastify/jwt';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    jwt: JWT;
  }
}