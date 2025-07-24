import { FastifyRequest, FastifyReply } from 'fastify';
import { ROLE_PERMISSIONS, PERMISSIONS } from '../models/Category';

export const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    console.log('requireAuth: called, headers:', request.headers);
    await (request as any).jwtVerify();
    console.log('requireAuth: after jwtVerify, user:', (request as any).user);
  } catch (error) {
    console.log('requireAuth: JWT verification failed:', error);
    return reply.status(401).send({ success: false, message: 'Invalid token' });
  }
};

export const requirePermission = (permission: typeof PERMISSIONS[keyof typeof PERMISSIONS]) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    console.log('requirePermission: Checking permission:', permission); // Debug log
    // User data is stored in request.user after jwtVerify
    const user = (request as any).user;
    console.log('requirePermission: User data:', user); // Debug log
    if (!user) {
      return reply.status(401).send({ success: false, message: 'Authentication required' });
    }

    const userRole = user.role;
    const userPermissions = ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS] || [];
    console.log('requirePermission: User role:', userRole, 'Permissions:', userPermissions, 'User object:', user); // Debug log
    if (!(userPermissions as string[]).includes(permission)) {
      return reply.status(403).send({ success: false, message: 'Insufficient permissions', debug: { userRole, userPermissions, user } });
    }
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

    if (user.role !== role) {
      console.log('requireRole: Access denied. Required:', role, 'User has:', user.role); // Debug log
      return reply.status(403).send({ success: false, message: 'Insufficient role' });
    }
    console.log('requireRole: Access granted for role:', role); // Debug log
  };
}; 