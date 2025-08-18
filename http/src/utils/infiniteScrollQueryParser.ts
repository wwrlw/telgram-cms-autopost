import { InfiniteScrollQuery, InfiniteScrollParams, PostFilters, SortParams } from '../types/PostQuery';

export function parseInfiniteScrollQuery(query: any): InfiniteScrollQuery {
  const pagination = parseInfiniteScrollPagination(query);
  const filters = parseFilters(query);
  const sort = parseSort(query);

  return {
    pagination,
    filters,
    sort
  };
}

function parseInfiniteScrollPagination(query: any): InfiniteScrollParams {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 24)); // Default 24 for infinite scroll
  const lastId = query.lastId || undefined;

  return { page, limit, lastId };
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

  if (query.category_id) {
    filters.category_id = query.category_id;
    hasFilters = true;
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
  if (!query.sort_field) {
    return undefined;
  }

  const validFields = ['timestamp', 'created_at', 'source_channel', 'err'];
  const field = validFields.includes(query.sort_field) ? query.sort_field : 'created_at';
  const order = query.sort_order === 'asc' ? 'asc' : 'desc';

  return { field, order };
} 