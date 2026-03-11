import { FastifyRequest, FastifyReply } from 'fastify';
import { ValidationError } from '../exceptions/ValidationError';
import { NotFoundError } from '../exceptions/NotFoundError';
import { AuthenticationError } from '../exceptions/AuthenticationError';

export function errorHandler(
  error: Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  request.log.error(error);
  console.error('ErrorHandler caught error:', error);

  if (error instanceof ValidationError) {
    return reply.status(400).send({
      success: false,
      message: error.message
    });
  }

  if (error instanceof NotFoundError) {
    return reply.status(404).send({
      success: false,
      message: error.message
    });
  }

  if (error instanceof AuthenticationError) {
    return reply.status(401).send({
      success: false,
      message: error.message
    });
  }

  if (error.message.includes('Invalid post ID') || error.message.includes('Invalid user ID')) {
    return reply.status(400).send({
      success: false,
      message: error.message
    });
  }

  if (error.message.includes('User already exists')) {
    return reply.status(409).send({
      success: false,
      message: error.message
    });
  }

  return reply.status(500).send({
    success: false,
    message: 'Something went wrong',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
} 