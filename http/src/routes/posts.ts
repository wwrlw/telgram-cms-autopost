import { error } from "console";
import { FastifyInstance } from "fastify";

export async function postsRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/posts",
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      const posts = await fastify.mongo.db
        ?.collection("posts")
        .find()
        .toArray();
      return posts;
    }
  );
  fastify.get('/post/:id', {preValidation: [fastify.authenticate]}, async (request, reply) => {
    const id = (request.params as any).id;
    const { ObjectId } = fastify.mongo;
    if (!ObjectId.isValid(id)) {
        return reply.status(400).send({error: 'Invalid post Id'})
    }
    const post = await fastify.mongo.db?.collection('posts').findOne({ _id: new ObjectId(id) });

    if (!post) {
        return reply.status(400).send({ error: 'Post not found' })
    }
    return post;
  });
}
