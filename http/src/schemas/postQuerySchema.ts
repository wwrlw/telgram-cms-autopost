export const postQuerySchema = {
  type: 'object',
  properties: {
    page: {
      type: 'integer',
      minimum: 1,
      default: 1
    },
    limit: {
      type: 'integer',
      minimum: 1,
      maximum: 100,
      default: 10
    },
    source_channel: {
      type: 'string',
      minLength: 1
    },
    text: {
      type: 'string',
      minLength: 1
    },
    is_unique: {
      type: 'boolean'
    },
    // Теперь можно передавать либо ObjectId, либо имя категории (в т.ч. на русском)
    category_id: {
      type: 'string',
      minLength: 1
    },
    category_name: { type: 'string', minLength: 1 },
    category: { type: 'string', minLength: 1 },
    date_from: {
      type: 'string',
      format: 'date-time'
    },
    date_to: {
      type: 'string',
      format: 'date-time'
    },
    // Новый параметр фильтра-сортировки из UI
    filter: { type: 'string', enum: ['timestamp', 'created_at', 'source_channel', 'err'] },
    // Направление сортировки
    order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
    // Алиасы сортировки
    sort: { type: 'string', enum: ['timestamp', 'created_at', 'source_channel', 'err'] },
    sortBy: { type: 'string', enum: ['timestamp', 'created_at', 'source_channel', 'err'] },
    sort_field: { type: 'string', enum: ['timestamp', 'created_at', 'source_channel', 'err'] },
    sort_order: { type: 'string', enum: ['asc', 'desc'] }
  },
  additionalProperties: false
};

export const postSearchResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          source_channel: { type: 'string' },
          text: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
          url: { type: 'string' },
          media: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                file_path: { type: 'string' }
              }
            }
          },
          is_unique: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' }
        }
      }
    },
    pagination: {
      type: 'object',
      properties: {
        page: { type: 'integer' },
        limit: { type: 'integer' },
        total: { type: 'integer' },
        totalPages: { type: 'integer' },
        hasNext: { type: 'boolean' },
        hasPrev: { type: 'boolean' }
      }
    }
  }
}; 