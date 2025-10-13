export const createCategoryBodySchema = {
  type: 'object',
  required: ['name'],
  properties: {
    name: { type: 'string', minLength: 1 },
    description: { type: 'string' },
    color: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
    is_active: { type: 'boolean' }
  }
} as const;

export const updateCategoryBodySchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    description: { type: 'string' },
    color: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
    is_active: { type: 'boolean' }
  }
} as const;


