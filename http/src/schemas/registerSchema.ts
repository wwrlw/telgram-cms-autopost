export const registerSchema = {
    tags: ['auth'],
    body: {
      type: 'object',
      required: ['username', 'password'],
      properties: {
        username: { type: 'string', minLength: 3 },
        password: { type: 'string', minLength: 6 },
        role: { type: 'string', enum: ['admin', 'user'], default: 'user' },
      },
    },
    response: {
      201: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          userId: { type: 'string' },
        },
      },
    },
  } as const;
  