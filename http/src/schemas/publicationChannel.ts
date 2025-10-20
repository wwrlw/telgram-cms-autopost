export const createPublicationChannelBodySchema = {
  type: 'object',
  required: ['name', 'channel_id', 'is_private'],
  properties: {
    name: { type: 'string', minLength: 1 },
    channel_id: { type: 'string', minLength: 1 },
    is_private: { type: 'boolean' },
    is_active: { type: 'boolean' },
    bot_token: { type: 'string' },
    signature: { type: 'string' }
  }
} as const;

export const updatePublicationChannelBodySchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    channel_id: { type: 'string', minLength: 1 },
    is_private: { type: 'boolean' },
    is_active: { type: 'boolean' },
    bot_token: { type: 'string' },
    signature: { type: 'string' }
  }
} as const;


