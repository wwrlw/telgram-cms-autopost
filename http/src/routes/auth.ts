import { FastifyInstance } from "fastify";
import { DependencyContainer } from "../container/DependencyContainer";
import { CreateUserUseCase } from "../use-cases/CreateUserUseCase";
import { LoginUseCase } from "../use-cases/LoginUseCase";
import { CreateUserDto, LoginDto } from "../models/User";

export async function authRoutes(fastify: FastifyInstance) {
  const container = DependencyContainer.getInstance();

  fastify.post("/auth/register", async (request, reply) => {
    try {
      const userData = request.body as CreateUserDto;
      const createUserUseCase = container.getCreateUserUseCase();
      const user = await createUserUseCase.execute(userData);
      
      // Формат ответа для фронтенда
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

  fastify.post("/login", async (request, reply) => {
    try {
      const loginData = request.body as LoginDto;
      console.log('Login request data:', loginData); // Отладочный лог
      
      const loginUseCase = container.getLoginUseCase();
      const result = await loginUseCase.execute(loginData);
      console.log('Login use case result:', result); // Отладочный лог
      
      // Формат ответа для фронтенда
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
      console.log('Final response:', response); // Отладочный лог
      return response;
    } catch (error) {
      console.error('Login error:', error); // Отладочный лог
      throw error;
    }
  });
}
