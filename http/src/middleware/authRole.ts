import { FastifyRequest, FastifyReply } from 'fastify';
import { ROLE_PERMISSIONS, PERMISSIONS, ROLES } from '../models/Category';

export const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    console.log('requireAuth: called for URL:', request.url);
    console.log('requireAuth: headers:', request.headers);
    await (request as any).jwtVerify();
    console.log('requireAuth: after jwtVerify, user:', (request as any).user);
    
    // Проверяем, что пользователь не заблокирован
    const user = (request as any).user;
    if (user && user.role === ROLES.BANNED) {
      console.log('requireAuth: User is banned, access denied');
      return reply.status(403).send({ 
        success: false, 
        message: 'User account is banned'
      });
    }
  } catch (error) {
    console.error('requireAuth: JWT verification failed:', error);
    return reply.status(401).send({ success: false, message: 'Invalid token' });
  }
};

export const requirePermission = (permission: typeof PERMISSIONS[keyof typeof PERMISSIONS]) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    console.log('requirePermission: Checking permission:', permission, 'for URL:', request.url); // Debug log
    // User data is stored in request.user after jwtVerify
    const user = (request as any).user;
    console.log('requirePermission: User data:', user); // Debug log
    if (!user) {
      console.error('requirePermission: No user found');
      return reply.status(401).send({ success: false, message: 'Authentication required' });
    }

    // ПРОВЕРЯЕМ РОЛЬ ИЗ БД, а не из токена
    let actualRole = user.role;
    try {
      const mongo = (request.server as any).mongo;
      if (mongo && mongo.db) {
        const db = mongo.db;
        const usersCollection = db.collection('users');
        
        // Получаем актуальную роль из БД
        const { ObjectId } = await import('mongodb');
        const dbUser = await usersCollection.findOne({ _id: new ObjectId(user.userId) });
        if (dbUser) {
          actualRole = dbUser.role;
          console.log(`requirePermission: Token role: ${user.role}, DB role: ${actualRole}`);
          
          // Проверяем, что пользователь не заблокирован
          if (actualRole === ROLES.BANNED) {
            console.log('requirePermission: User is banned, access denied');
            return reply.status(403).send({ 
              success: false, 
              message: 'User account is banned'
            });
          }
        } else {
          // Пользователь не найден в БД - отказываем в доступе
          console.log('requirePermission: User not found in DB, access denied');
          return reply.status(403).send({ 
            success: false, 
            message: 'User not found in database'
          });
        }
      } else {
        // MongoDB недоступна - используем fallback на токен
        console.log('requirePermission: MongoDB not available, using token fallback');
      }
    } catch (error) {
      console.error('requirePermission: Error checking DB role:', error);
      // Если произошла ошибка при проверке БД, используем роль из токена
    }

    const userPermissions = ROLE_PERMISSIONS[actualRole as keyof typeof ROLE_PERMISSIONS] || [];
    console.log('requirePermission: User role:', actualRole, 'Permissions:', userPermissions, 'User object:', user); // Debug log
    if (!(userPermissions as string[]).includes(permission)) {
      console.error('requirePermission: Insufficient permissions. Required:', permission, 'User has:', userPermissions);
      return reply.status(403).send({ success: false, message: 'Insufficient permissions', debug: { actualRole, userPermissions, user } });
    }
    console.log('requirePermission: Permission granted for:', permission);
  };
};

export const requireRole = (role: string) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    console.log('requireRole: Checking role:', role); // Debug log
    // User data is stored in request.user after jwtVerify
    const user = (request as any).user;
    console.log('requireRole: User data:', user); // Debug log
    if (!user) {
      return reply.status(401).send({ success: false, message: 'Authentication required' });
    }

    // ПРОВЕРЯЕМ РОЛЬ ИЗ БД, а не из токена
    try {
      const mongo = (request.server as any).mongo;
      if (mongo && mongo.db) {
        const db = mongo.db;
        const usersCollection = db.collection('users');
        
        // Получаем актуальную роль из БД
        const { ObjectId } = await import('mongodb');
        const dbUser = await usersCollection.findOne({ _id: new ObjectId(user.userId) });
        if (dbUser) {
          const actualRole = dbUser.role;
          console.log(`requireRole: Token role: ${user.role}, DB role: ${actualRole}`);
          
          // Проверяем, что пользователь не заблокирован
          if (actualRole === ROLES.BANNED) {
            console.log('requireRole: User is banned, access denied');
            return reply.status(403).send({ 
              success: false, 
              message: 'User account is banned'
            });
          }
          
          if (actualRole !== role) {
            console.log(`requireRole: Access denied. Required: ${role}, DB role: ${actualRole}`);
            return reply.status(403).send({ 
              success: false, 
              message: 'Insufficient role',
              tokenRole: user.role,
              dbRole: actualRole
            });
          }
          // Если роль совпадает, продолжаем
          console.log('requireRole: Access granted for role:', role); // Debug log
          return;
        } else {
          // Пользователь не найден в БД - отказываем в доступе
          console.log('requireRole: User not found in DB, access denied');
          return reply.status(403).send({ 
            success: false, 
            message: 'User not found in database'
          });
        }
      } else {
        // MongoDB недоступна - используем fallback на токен
        console.log('requireRole: MongoDB not available, using token fallback');
        if (user.role !== role) {
          console.log(`requireRole: FALLBACK - Access denied. Required: ${role}, Token role: ${user.role}`);
          return reply.status(403).send({ success: false, message: 'Insufficient role' });
        }
        console.log('requireRole: FALLBACK - Access granted for role:', role);
        return;
      }
    } catch (error) {
      console.error('requireRole: Error checking DB role:', error);
      // Если произошла ошибка при проверке БД, используем роль из токена
      if (user.role !== role) {
        console.log(`requireRole: ERROR FALLBACK - Access denied. Required: ${role}, Token role: ${user.role}`);
        return reply.status(403).send({ success: false, message: 'Insufficient role' });
      }
      console.log('requireRole: ERROR FALLBACK - Access granted for role:', role);
      return;
    }
  };
}; 