import { FastifyInstance } from 'fastify';
import { CreateUserUseCase } from '../use-cases/CreateUserUseCase';
import { LoginUseCase } from '../use-cases/LoginUseCase';
import { CreateUserDto, LoginDto } from '../models/User';
import { requireAuth, requireRole } from '../middleware/authRole';
import { logAction } from '../middleware/logging';
import { ROLES, PERMISSIONS } from '../models/Category';
import { DependencyContainer } from '../container/DependencyContainer';

export default async function authRoutes(fastify: FastifyInstance) {
  const container = DependencyContainer.getInstance();

  // Login endpoint (public)
  fastify.post('/login', async (request, reply) => {
    try {
      const loginData = request.body as LoginDto;
      const loginUseCase = container.getLoginUseCase();
      const result = await loginUseCase.execute(loginData);
      
      reply.send({ 
        success: true, 
        data: result 
      });
    } catch (error: any) {
      reply.status(400).send({ 
        success: false, 
        message: error.message 
      });
    }
  });

  // Create user endpoint (super_admin only)
  fastify.post('/register', {
    preHandler: [requireAuth, requireRole(ROLES.SUPER_ADMIN), logAction]
  }, async (request, reply) => {
    try {
      const userData = request.body as CreateUserDto;
      const createUserUseCase = container.getCreateUserUseCase();
      const result = await createUserUseCase.execute(userData);
      
      reply.send({ 
        success: true, 
        data: result 
      });
    } catch (error: any) {
      reply.status(400).send({ 
        success: false, 
        message: error.message 
      });
    }
  });

  // Get all users (super_admin only)
  fastify.get('/users', {
    preHandler: [requireAuth, requireRole(ROLES.SUPER_ADMIN)]
  }, async (request, reply) => {
    // DEBUG: print user
    console.log('AUTH USERS ROUTE: request.user =', (request as any).user);
    try {
      const userService = container.getUserService();
      const users = await userService.getAllUsers();
      reply.send({
        success: true,
        data: users
      });
    } catch (error: any) {
      reply.status(500).send({
        success: false,
        message: error.message
      });
    }
  });

  // Update user role (super_admin only)
  fastify.put('/users/:id/role', {
    preHandler: [requireAuth, requireRole(ROLES.SUPER_ADMIN), logAction]
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { role } = request.body as { role: string };
      
      const userService = container.getUserService();
      const result = await userService.updateUserRole(id, role);
      reply.send({
        success: true,
        data: result
      });
    } catch (error: any) {
      reply.status(400).send({
        success: false,
        message: error.message
      });
    }
  });

  // Add favorite post
  fastify.post('/favorites/add', {
    preHandler: [requireAuth, logAction]
  }, async (request, reply) => {
    try {
      const { userId, postId } = request.body as { userId: string; postId: string };
      const userService = container.getUserService();
      const result = await userService.addFavoritePost(userId, postId);
      
      reply.send({ 
        success: true, 
        data: result 
      });
    } catch (error: any) {
      reply.status(400).send({ 
        success: false, 
        message: error.message 
      });
    }
  });

  // Remove favorite post
  fastify.post('/favorites/remove', {
    preHandler: [requireAuth, logAction]
  }, async (request, reply) => {
    try {
      const { userId, postId } = request.body as { userId: string; postId: string };
      const userService = container.getUserService();
      const result = await userService.removeFavoritePost(userId, postId);
      
      reply.send({ 
        success: true, 
        data: result 
      });
    } catch (error: any) {
      reply.status(400).send({ 
        success: false, 
        message: error.message 
      });
    }
  });

  // Get favorite posts
  fastify.get('/favorites/:userId', {
    preHandler: [requireAuth]
  }, async (request, reply) => {
    try {
      const { userId } = request.params as { userId: string };
      const userService = container.getUserService();
      const user = await userService.getUserById(userId);
      
      reply.send({ 
        success: true, 
        data: user.favorite_posts || [] 
      });
    } catch (error: any) {
      reply.status(400).send({ 
        success: false, 
        message: error.message 
      });
    }
  });
}
