export const createChannelBodySchema = {
  type: 'object',
  required: ['username', 'channel_id'],
  properties: {
    username: { type: 'string', minLength: 1 },
    channel_id: { type: 'number' },
    is_private: { type: 'boolean' },
    prompt: { type: 'string' }
  }
} as const;

export const updateChannelBodySchema = {
  type: 'object',
  properties: {
    username: { type: 'string', minLength: 1 },
    channel_id: { type: 'number' },
    is_private: { type: 'boolean' },
    prompt: { type: 'string' },
    category_id: { type: 'string' }
  }
} as const;


