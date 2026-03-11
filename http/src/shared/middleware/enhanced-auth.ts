import { FastifyRequest, FastifyReply } from 'fastify';
import { UserPermissionService } from '../../modules/user/user-permission.service';
import { UserRepository } from '../../modules/user/repositories/user.repository';
import { PERMISSIONS, ROLES } from '../../modules/category/category.model';

/**
 * Расширенная проверка авторизации с валидацией токена и прав
 */
export const enhancedRequireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // Проверяем JWT токен только для получения userId
    await (request as any).jwtVerify();
    
    const tokenUser = (request as any).user;
    if (!tokenUser || !tokenUser.userId) {
      return reply.status(401).send({ 
        success: false, 
        message: 'Invalid user data in token' 
      });
    }

    // Создаем сервис для проверки прав
    const userRepository = new UserRepository((request as any).mongo);
    const userPermissionService = new UserPermissionService(userRepository);

    // ПРИНУДИТЕЛЬНО проверяем актуальность прав пользователя из БД
    try {
      const userPermissions = await userPermissionService.verifyUserPermissions(tokenUser.userId);
      
      // ПОЛНОСТЬЮ заменяем данные пользователя актуальными данными из БД
      (request as any).user = {
        userId: userPermissions.userId,
        username: userPermissions.username,
        role: userPermissions.role,
        permissions: userPermissions.permissions,
      };

      // Проверяем, что пользователь не заблокирован
      if (userPermissions.role === ROLES.BANNED) {
        return reply.status(403).send({ 
          success: false, 
          message: 'User account is banned' 
        });
      }

      console.log(`Enhanced auth: User ${userPermissions.username} authenticated with role ${userPermissions.role} and permissions:`, userPermissions.permissions);

    } catch (permissionError) {
      console.error('Permission verification failed:', permissionError);
      
      // Проверяем, является ли ошибка связанной с тем, что пользователь не найден
      if ((permissionError as any).code === 'USER_NOT_FOUND') {
        return reply.status(404).send({ 
          success: false, 
          message: 'User not found in database',
          code: 'USER_NOT_FOUND'
        });
      }
      
      return reply.status(403).send({ 
        success: false, 
        message: 'Failed to verify user permissions' 
      });
    }

  } catch (error) {
    console.error('Enhanced authentication error:', error);
    return reply.status(401).send({ 
      success: false, 
      message: 'Authentication failed' 
    });
  }
};

/**
 * Проверка конкретного права с валидацией токена
 */
export const enhancedRequirePermission = (permission: typeof PERMISSIONS[keyof typeof PERMISSIONS]) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Сначала проверяем авторизацию
      await enhancedRequireAuth(request, reply);
      
      // Проверяем, что ответ не был отправлен
      if (reply.sent) {
        return;
      }
      
      const user = (request as any).user;
      if (!user || !user.permissions) {
        return reply.status(403).send({ 
          success: false, 
          message: 'User permissions not available' 
        });
      }

      console.log(`enhancedRequirePermission: Checking permission ${permission} for user ${user.username}, user permissions:`, user.permissions);

      // Проверяем наличие права
      if (!user.permissions.includes(permission)) {
        console.log(`enhancedRequirePermission: Access denied for user ${user.username}, permission ${permission} not found`);
        return reply.status(403).send({ 
          success: false, 
          message: 'Insufficient permissions',
          required: permission,
          userPermissions: user.permissions
        });
      }

      console.log(`enhancedRequirePermission: Access granted for user ${user.username} with permission ${permission}`);

    } catch (error) {
      // Если ошибка уже отправлена в enhancedRequireAuth, не отправляем повторно
      if (!reply.sent) {
        return reply.status(500).send({ 
          success: false, 
          message: 'Internal server error during permission check' 
        });
      }
    }
  };
};

/**
 * Проверка роли с валидацией токена
 */
export const enhancedRequireRole = (role: string) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Сначала проверяем авторизацию
      await enhancedRequireAuth(request, reply);
      
      // Проверяем, что ответ не был отправлен
      if (reply.sent) {
        return;
      }
      
      const user = (request as any).user;
      if (!user || !user.role) {
        return reply.status(403).send({ 
          success: false, 
          message: 'User role not available' 
        });
      }

      console.log(`enhancedRequireRole: Checking role for user ${user.username}, current role: ${user.role}, required: ${role}`);

      // Проверяем роль
      if (user.role !== role) {
        console.log(`enhancedRequireRole: Access denied for user ${user.username}, role ${user.role} is insufficient`);
        return reply.status(403).send({ 
          success: false, 
          message: 'Insufficient role',
          required: role,
          userRole: user.role
        });
      }

      console.log(`enhancedRequireRole: Access granted for user ${user.username} with role ${user.role}`);

    } catch (error) {
      // Если ошибка уже отправлена в enhancedRequireAuth, не отправляем повторно
      if (!reply.sent) {
        return reply.status(500).send({ 
          success: false, 
          message: 'Internal server error during role check' 
        });
      }
    }
  };
};

/**
 * Проверка роли администратора или выше
 */
export const requireAdminOrHigher = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // Сначала проверяем авторизацию
    await enhancedRequireAuth(request, reply);
    
    // Проверяем, что ответ не был отправлен
    if (reply.sent) {
      return;
    }
    
    const user = (request as any).user;
    if (!user || !user.role) {
      return reply.status(403).send({ 
        success: false, 
        message: 'User role not available' 
      });
    }

    console.log(`requireAdminOrHigher: Checking role for user ${user.username}, current role: ${user.role}, required: ${ROLES.ADMIN} or ${ROLES.SUPER_ADMIN}`);

    // Проверяем, что роль администратора или выше
    if (![ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(user.role)) {
      console.log(`requireAdminOrHigher: Access denied for user ${user.username}, role ${user.role} is insufficient`);
      return reply.status(403).send({ 
        success: false, 
        message: 'Admin role required',
        userRole: user.role,
        requiredRoles: [ROLES.ADMIN, ROLES.SUPER_ADMIN]
      });
    }

    console.log(`requireAdminOrHigher: Access granted for user ${user.username} with role ${user.role}`);

  } catch (error) {
    // Если ошибка уже отправлена в enhancedRequireAuth, не отправляем повторно
    if (!reply.sent) {
      return reply.status(500).send({ 
        success: false, 
        message: 'Internal server error during admin check' 
      });
    }
  }
};

/**
 * Проверка роли супер-администратора
 */
export const requireSuperAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // Сначала проверяем авторизацию
    await enhancedRequireAuth(request, reply);
    
    // Проверяем, что ответ не был отправлен
    if (reply.sent) {
      return;
    }
    
    const user = (request as any).user;
    if (!user || !user.role) {
      return reply.status(403).send({ 
        success: false, 
        message: 'User role not available' 
      });
    }

    console.log(`requireSuperAdmin: Checking role for user ${user.username}, current role: ${user.role}, required: ${ROLES.SUPER_ADMIN}`);

    // Проверяем, что роль супер-администратора
    if (user.role !== ROLES.SUPER_ADMIN) {
      console.log(`requireSuperAdmin: Access denied for user ${user.username}, role ${user.role} is insufficient`);
      return reply.status(403).send({ 
        success: false, 
        message: 'Super admin role required',
        userRole: user.role,
        requiredRole: ROLES.SUPER_ADMIN
      });
    }

    console.log(`requireSuperAdmin: Access granted for user ${user.username} with role ${user.role}`);

  } catch (error) {
    // Если ошибка уже отправлена в enhancedRequireAuth, не отправляем повторно
    if (!reply.sent) {
      return reply.status(500).send({ 
        success: false, 
        message: 'Internal server error during super admin check' 
      });
    }
  }
};
