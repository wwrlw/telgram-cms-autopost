export interface PaginationParams {
  page: number;
  limit: number;
}

export interface InfiniteScrollParams {
  page: number;
  limit: number;
  lastId?: string; // ID последнего поста для курсорной пагинации
}

export interface PostFilters {
  source_channel?: string;
  text?: string;
  is_unique?: boolean;
  category_id?: string;
  date_from?: Date;
  date_to?: Date;
}

export interface SortParams {
  field: 'timestamp' | 'created_at' | 'source_channel' | 'err';
  order: 'asc' | 'desc';
}

export interface PostQuery {
  pagination: PaginationParams;
  filters?: PostFilters;
  sort?: SortParams;
}

export interface InfiniteScrollQuery {
  pagination: InfiniteScrollParams;
  filters?: PostFilters;
  sort?: SortParams;
}

export interface PostStats {
  total: number;
  unique: number;
  today: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  params: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface InfiniteScrollResponse<T> {
  data: T[];
  params: {
    page: number;
    limit: number;
    total?: number;
    hasMore: boolean;
    lastId?: string;
  };
} 