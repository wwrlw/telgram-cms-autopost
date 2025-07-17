import { FastifyInstance } from "fastify";
import { DependencyContainer } from "../container/DependencyContainer";
import { CreateUserDto, LoginDto } from "../models/User";
import { ObjectId } from "mongodb";

export async function authRoutes(fastify: FastifyInstance) {
  const container = DependencyContainer.getInstance();

  fastify.post("/auth/register", async (request, reply) => {
    try {
      const userData = request.body as CreateUserDto;
      const createUserUseCase = container.getCreateUserUseCase();
      const user = await createUserUseCase.execute(userData);
      
      return {
        success: true,
        data: {
          user: user
        }
      };
    } catch (error) {
      throw error;
    }
  });

  fastify.post("/auth/login", async (request, reply) => {
    try {
      const loginData = request.body as LoginDto;
      console.log('Login request data:', loginData);
      
      const loginUseCase = container.getLoginUseCase();
      const result = await loginUseCase.execute(loginData);
      
      const response = {
        success: true,
        data: {
          token: result.token,
          user: {
            id: result.userId,
            username: loginData.username
          }
        }
      };
      console.log('Final response:', response);
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  });

  fastify.post("/auth/favorites/add", async (request, reply) => {
    try {
      const { userId, postId } = request.body as { userId: string; postId: string };
      
      if (!userId || !postId) {
        return reply.code(400).send({
          success: false,
          message: "userId and postId are required"
        });
      }

      const userService = container.getUserService();
      const user = await userService.addFavoritePost(userId, postId);
      
      return {
        success: true,
        data: user
      };
    } catch (error) {
      console.error('Add favorite error:', error);
      throw error;
    }
  });

  fastify.post("/auth/favorites/remove", async (request, reply) => {
    try {
      const { userId, postId } = request.body as { userId: string; postId: string };
      
      if (!userId || !postId) {
        return reply.code(400).send({
          success: false,
          message: "userId and postId are required"
        });
      }

      const userService = container.getUserService();
      const user = await userService.removeFavoritePost(userId, postId);
      
      return {
        success: true,
        data: user
      };
    } catch (error) {
      console.error('Remove favorite error:', error);
      throw error;
    }
  });

  fastify.get("/auth/favorites/:userId", async (request, reply) => {
    try {
      const { userId } = request.params as { userId: string };
      
      if (!userId) {
        return reply.code(400).send({
          success: false,
          message: "userId is required"
        });
      }

      const userService = container.getUserService();
      const user = await userService.getUserById(userId);
      
      return {
        success: true,
        data: user.favorite_posts || []
      };
    } catch (error) {
      console.error('Get favorites error:', error);
      throw error;
    }
  });
}
