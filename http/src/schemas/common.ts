export const idParamSchema = {
  type: 'object',
  properties: { id: { type: 'string', minLength: 1 } },
  required: ['id']
} as const;

export const paginationQuerySchema = {
  type: 'object',
  properties: {
    page: { type: 'number', minimum: 1 },
    limit: { type: 'number', minimum: 1, maximum: 100 }
  }
} as const;


