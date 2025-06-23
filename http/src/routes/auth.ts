import fastify, { FastifyInstance } from "fastify";
import {
  createUser,
  findUserByUsername,
  verifyPassword,
} from "../services/userService";

import 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    jwt: any;
  }
}

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post("/auth/register", async (request, reply) => {
    const { username, password } = request.body as {
      username: string;
      password: string;
    };

    if (!username || !password) {
      return reply.status(400).send({ error: "Missing username or password" });
    }

    const existing = await findUserByUsername(fastify.mongo, username);
    if (existing) {
      return reply.status(409).send({ error: "User already exists" });
    }

    const user = await createUser(fastify.mongo, username, password);
    return { id: user._id, username: user.username };
  });

  fastify.post("/login", async (request, reply) => {
    const { username, password } = request.body as {
      username: string;
      password: string;
    };

    const user = await findUserByUsername(fastify.mongo, username);
    if (!user) {
      return reply.status(401).send({ error: "Invalid username or password" });
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return reply.status(401).send({ error: "Invalid username or password" });
    }

    const token = fastify.jwt.sign({ username: user.username, id: user._id });
    return { token };
  });
}
