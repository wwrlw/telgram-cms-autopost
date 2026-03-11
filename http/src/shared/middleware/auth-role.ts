import { FastifyRequest, FastifyReply } from 'fastify';
import { ROLE_PERMISSIONS, PERMISSIONS, ROLES } from '../../modules/category/category.model';
import { ObjectId } from 'mongodb';

async function getActualRoleFromDB(request: FastifyRequest, userId: string): Promise<string | null> {
  const mongo = (request.server as any).mongo;
  if (!mongo?.db) return null;
  const dbUser = await mongo.db.collection('users').findOne({ _id: new ObjectId(userId) });
  return dbUser?.role ?? null;
}

export const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await (request as any).jwtVerify();
    const user = (request as any).user;
    if (user?.role === ROLES.BANNED) {
      return reply.status(403).send({ success: false, message: 'User account is banned' });
    }
  } catch {
    return reply.status(401).send({ success: false, message: 'Invalid token' });
  }
};

export const requirePermission = (permission: typeof PERMISSIONS[keyof typeof PERMISSIONS]) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    if (!user) {
      return reply.status(401).send({ success: false, message: 'Authentication required' });
    }

    const actualRole = await getActualRoleFromDB(request, user.userId) ?? user.role;

    if (actualRole === ROLES.BANNED) {
      return reply.status(403).send({ success: false, message: 'User account is banned' });
    }

    if (actualRole === null) {
      return reply.status(404).send({ success: false, message: 'User not found', code: 'USER_NOT_FOUND' });
    }

    const userPermissions = ROLE_PERMISSIONS[actualRole as keyof typeof ROLE_PERMISSIONS] || [];
    if (!(userPermissions as string[]).includes(permission)) {
      return reply.status(403).send({ success: false, message: 'Insufficient permissions' });
    }
  };
};

export const requireRole = (role: string) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    if (!user) {
      return reply.status(401).send({ success: false, message: 'Authentication required' });
    }

    const actualRole = await getActualRoleFromDB(request, user.userId) ?? user.role;

    if (actualRole === ROLES.BANNED) {
      return reply.status(403).send({ success: false, message: 'User account is banned' });
    }

    if (actualRole !== role) {
      return reply.status(403).send({ success: false, message: 'Insufficient role' });
    }
  };
};
