export const infiniteScrollQuerySchema = {
  type: 'object',
  properties: {
    page: { type: 'number', minimum: 1, default: 1 },
    limit: { type: 'number', minimum: 1, maximum: 100, default: 24 },
    lastId: { type: 'string' },
    text: { type: 'string' },
    is_unique: { type: 'string', enum: ['true', 'false'] },
    category_id: { type: 'string' },
    date_from: { type: 'string', format: 'date-time' },
    date_to: { type: 'string', format: 'date-time' },
    sort_field: { type: 'string', enum: ['timestamp', 'created_at', 'source_channel'] },
    sort_order: { type: 'string', enum: ['asc', 'desc'] }
  }
};

export const infiniteScrollResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          text: { type: 'string' },
          unique_text: { type: 'string' },
          is_unique: { type: 'boolean' },
          is_published: { type: 'boolean' },
          scheduled_at: { type: 'string', format: 'date-time' },
          published_at: { type: 'string', format: 'date-time' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
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
          category_id: { type: 'string' },
          category_name: { type: 'string' },
          category_color: { type: 'string' },
          channel_username: { type: 'string' },
          conversion_metrics: {
            type: 'object',
            properties: {
              views: { type: 'number' },
              reactions: { type: 'number' },
              comments: { type: 'number' },
              forwards: { type: 'number' },
              er: { type: 'number' },
              err: { type: 'number' }
            }
          }
        }
      }
    },
    params: {
      type: 'object',
      properties: {
        page: { type: 'number' },
        limit: { type: 'number' },
        total: { type: 'number' },
        hasMore: { type: 'boolean' },
        lastId: { type: 'string' }
      },
      required: ['page', 'limit', 'hasMore']
    }
  }
}; 