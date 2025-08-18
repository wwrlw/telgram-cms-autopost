import { FastifyInstance } from 'fastify';
import { CreateUserUseCase } from '../use-cases/CreateUserUseCase';
import { LoginUseCase } from '../use-cases/LoginUseCase';
import { CreateUserDto, LoginDto } from '../models/User';
import { requireAuth, requireRole, requirePermission } from '../middleware/authRole';
import { logAction } from '../middleware/logging';
import { ROLES, PERMISSIONS } from '../models/Category';
import { DependencyContainer } from '../container/DependencyContainer';

export default async function authRoutes(fastify: FastifyInstance) {
  const container = DependencyContainer.getInstance();

  // Login endpoint (public)
  fastify.post('/login', async (request, reply) => {
    try {
      const loginData = request.body as LoginDto;
      
      // Сначала проверяем, существует ли пользователь
      const userService = container.getUserService();
      const user = await userService.findByUsername(loginData.username);
      
      // Если пользователь не найден
      if (!user) {
        return reply.status(404).send({ 
          success: false, 
          message: 'User not found in database',
          code: 'USER_NOT_FOUND'
        });
      }
      
      // Если пользователь заблокирован
      if (user.role === ROLES.BANNED) {
        return reply.status(403).send({ 
          success: false, 
          message: 'User account is banned',
          code: 'USER_BANNED'
        });
      }
      
      // Теперь пробуем залогинить пользователя
      try {
        const loginUseCase = container.getLoginUseCase();
        const result = await loginUseCase.execute(loginData);
        
        reply.send({ 
          success: true, 
          data: result 
        });
      } catch (loginError: any) {
        // Если ошибка логина, значит пароль неправильный
        if (loginError.message === 'Invalid username or password') {
          return reply.status(400).send({ 
            success: false, 
            message: 'Invalid password',
            code: 'INVALID_PASSWORD'
          });
        }
        
        // Другие ошибки логина
        reply.status(400).send({ 
          success: false, 
          message: loginError.message 
        });
      }
      
    } catch (error: any) {
      console.error('Login error:', error);
      reply.status(500).send({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  });

  // Create user endpoint (super_admin only)
  fastify.post('/register', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.MANAGE_USERS), logAction]
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
    preHandler: [requireAuth, requirePermission(PERMISSIONS.MANAGE_USERS)]
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
    preHandler: [requireAuth, requirePermission(PERMISSIONS.MANAGE_USERS), logAction]
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

  // Ban user (super_admin only)
  fastify.post('/users/:id/ban', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.MANAGE_USERS), logAction]
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      const userService = container.getUserService();
      const result = await userService.updateUserRole(id, ROLES.BANNED);
      reply.send({
        success: true,
        data: result,
        message: 'User has been banned'
      });
    } catch (error: any) {
      reply.status(400).send({
        success: false,
        message: error.message
      });
    }
  });

  // Unban user (super_admin only)
  fastify.post('/users/:id/unban', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.MANAGE_USERS), logAction]
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { role } = request.body as { role: string };
      
      if (!role || role === ROLES.BANNED) {
        return reply.status(400).send({
          success: false,
          message: 'Valid role must be specified for unbanning'
        });
      }
      
      const userService = container.getUserService();
      const result = await userService.updateUserRole(id, role);
      reply.send({
        success: true,
        data: result,
        message: 'User has been unbanned'
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

  // Check current user role from database
  fastify.get('/check', async (request, reply) => {
    try {
      // Проверяем JWT токен вручную
      let tokenUser;
      try {
        await (request as any).jwtVerify();
        tokenUser = (request as any).user;
      } catch (jwtError) {
        return reply.status(401).send({ 
          success: false, 
          message: 'Invalid token',
          code: 'INVALID_TOKEN'
        });
      }

      if (!tokenUser || !tokenUser.userId) {
        return reply.status(401).send({ 
          success: false, 
          message: 'Invalid user data in token',
          code: 'INVALID_TOKEN'
        });
      }

      const mongo = (request.server as any).mongo;
      const db = mongo.db;
      const usersCollection = db.collection('users');
      
      const { ObjectId } = await import('mongodb');
      const dbUser = await usersCollection.findOne({ _id: new ObjectId(tokenUser.userId) });
      
      // Проверяем, что пользователь существует в БД
      if (!dbUser) {
        return reply.status(404).send({ 
          success: false, 
          message: 'User not found in database',
          code: 'USER_NOT_FOUND'
        });
      }
      
      // Проверяем, не заблокирован ли пользователь
      if (dbUser.role === ROLES.BANNED) {
        return reply.status(403).send({ 
          success: false, 
          message: 'User account is banned',
          code: 'USER_BANNED'
        });
      }
      
      reply.send({
        success: true,
        data: {
          role: dbUser.role,
          username: dbUser.username
        }
      });
    } catch (error: any) {
      console.error('Error in /check endpoint:', error);
      reply.status(500).send({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  });
}
