import { PostQuery, PaginationParams, PostFilters, SortParams } from '../../modules/post/post.types';

export function parsePostQuery(query: any): PostQuery {
  const pagination = parsePagination(query);
  const filters = parseFilters(query);
  const sort = parseSort(query);

  return {
    pagination,
    filters,
    sort
  };
}

function parsePagination(query: any): PaginationParams {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));

  return { page, limit };
}

function parseFilters(query: any): PostFilters | undefined {
  const filters: PostFilters = {};
  let hasFilters = false;

  if (query.source_channel) {
    filters.source_channel = query.source_channel;
    hasFilters = true;
  }

  if (query.text) {
    filters.text = query.text;
    hasFilters = true;
  }

  if (query.is_unique !== undefined) {
    filters.is_unique = query.is_unique === 'true' || query.is_unique === true;
    hasFilters = true;
  }

  // Поддержка фильтра по категории: можно передавать как ObjectId, так и имя
  if (query.category_id || query.category_name || query.category) {
    const category = query.category_id || query.category_name || query.category;
    if (typeof category === 'string' && category.trim() !== '') {
      // Если это строка длиной 24 символа hex — оставим как id, иначе считаем именем
      filters.category_id = category.trim();
      hasFilters = true;
    }
  }

  if (query.date_from) {
    const dateFrom = new Date(query.date_from);
    if (!isNaN(dateFrom.getTime())) {
      filters.date_from = dateFrom;
      hasFilters = true;
    }
  }

  if (query.date_to) {
    const dateTo = new Date(query.date_to);
    if (!isNaN(dateTo.getTime())) {
      filters.date_to = dateTo;
      hasFilters = true;
    }
  }

  return hasFilters ? filters : undefined;
}

function parseSort(query: any): SortParams | undefined {
  // Алиасы: filter (из UI), sort, sortBy, sort_field
  const rawField = query.filter || query.sort || query.sortBy || query.sort_field || query.orderBy;
  if (!rawField) return undefined;

  const validFields = ['timestamp', 'created_at', 'source_channel', 'err'];
  const field = validFields.includes(rawField) ? rawField : 'created_at';

  // Алиасы: order, sort_order, dir
  const rawOrder = query.order || query.sort_order || query.dir;
  const order: any = rawOrder === 'asc' ? 'asc' : 'desc';

  return { field: field as any, order };
}