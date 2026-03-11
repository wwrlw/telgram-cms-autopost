import { FastifyInstance } from 'fastify';
import { CreateUserUseCase } from './use-cases/create-user.use-case';
import { LoginUseCase } from './use-cases/login.use-case';
import { CreateUserDto, LoginDto } from '../user/user.model';
import { requireAuth, requireRole, requirePermission } from '../../shared/middleware/auth-role';
import { logAction } from '../../shared/middleware/logging';
import { registerSchema } from './auth.schemas';
import { ROLES, PERMISSIONS } from '../category/category.model';
import { DependencyContainer } from '../../infrastructure/container/dependency-container';

export default async function authRoutes(fastify: FastifyInstance) {
  const container = DependencyContainer.getInstance();

  fastify.post('/login', async (request, reply) => {
    try {
      const loginData = request.body as LoginDto;
      
      const userService = container.getUserService();
      const user = await userService.findByUsername(loginData.username);
      
      if (!user) {
        return reply.status(404).send({ 
          success: false, 
          message: 'User not found in database',
          code: 'USER_NOT_FOUND'
        });
      }
      
      if (user.role === ROLES.BANNED) {
        return reply.status(403).send({ 
          success: false, 
          message: 'User account is banned',
          code: 'USER_BANNED'
        });
      }
      
      try {
        const loginUseCase = container.getLoginUseCase();
        const result = await loginUseCase.execute(loginData);
        
        const { refreshToken, accessToken, ...rest } = result as any;
        reply
          .setCookie('refreshToken', refreshToken, {
            httpOnly: true,
            sameSite: 'none',
            secure: (process.env.COOKIE_SECURE ?? 'true') === 'true',
            domain: process.env.COOKIE_DOMAIN || 'tg.chiorio.com',
            path: '/',
            maxAge: 60 * 60 * 24 * 30
          })
          .send({ 
            success: true, 
            data: { accessToken, refreshToken, ...rest } 
          });
      } catch (loginError: any) {
        if (loginError.message === 'Invalid username or password') {
          return reply.status(400).send({ 
            success: false, 
            message: 'Invalid password',
            code: 'INVALID_PASSWORD'
          });
        }
        
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

  fastify.post('/refresh', async (request, reply) => {
    try {
      const cookieRt = (request as any).cookies?.refreshToken;
      const bodyRt = (request.body as any)?.refreshToken;
      const refreshToken = cookieRt || bodyRt;
      if (!refreshToken) {
        return reply.status(400).send({ success: false, message: 'refreshToken is required' });
      }

      const authService = container.getAuthService();
      let payload: any;
      try {
        payload = authService.verifyRefreshToken(refreshToken);
      } catch (err) {
        return reply.status(401).send({ success: false, message: 'Invalid refresh token' });
      }

      const userService = container.getUserService();
      const user = await userService.findByUsername(payload.username);
      if (!user) {
        return reply.status(404).send({ success: false, message: 'User not found' });
      }

      const accessToken = authService.generateAccessToken(user);
      const newRefreshToken = authService.generateRefreshToken(user);

      reply
        .setCookie('refreshToken', newRefreshToken, {
          httpOnly: true,
          sameSite: 'none',
          secure: process.env.NODE_ENV === 'production',
          path: '/',
          maxAge: 60 * 60 * 24 * 30
        })
        .send({
          success: true,
          data: {
            accessToken,
            refreshToken: newRefreshToken
          }
        });
    } catch (error: any) {
      reply.status(400).send({ success: false, message: error.message });
    }
  });

  fastify.post('/register', {
    schema: registerSchema,
    preHandler: [requireAuth, requirePermission(PERMISSIONS.MANAGE_USERS), logAction]
  }, async (request, reply) => {
    try {
      const userData = request.body as CreateUserDto;
      const createUserUseCase = container.getCreateUserUseCase();
      const result = await createUserUseCase.execute(userData);
      
      reply.code(201).send({ 
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

  fastify.get('/users', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.MANAGE_USERS)]
  }, async (request, reply) => {
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

  fastify.post('/favorites/add', {
    preHandler: [requireAuth]
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

  fastify.post('/favorites/remove', {
    preHandler: [requireAuth]
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
