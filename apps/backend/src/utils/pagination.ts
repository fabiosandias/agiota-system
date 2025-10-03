interface PaginationParams {
  page: number;
  pageSize: number;
}

export const parsePagination = (
  query: Record<string, unknown>,
  defaults: PaginationParams = { page: 1, pageSize: 10 }
): PaginationParams => {
  const page = Number(query.page ?? defaults.page);
  const pageSize = Number(query.pageSize ?? defaults.pageSize);

  return {
    page: Number.isFinite(page) && page > 0 ? Math.floor(page) : defaults.page,
    pageSize: Number.isFinite(pageSize) && pageSize > 0 ? Math.min(Math.floor(pageSize), 100) : defaults.pageSize
  };
};

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export const buildPaginationMeta = (total: number, page: number, pageSize: number): PaginatedResult<never>['meta'] => {
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const currentPage = Math.min(page, totalPages);
  return {
    page: currentPage,
    pageSize,
    total,
    totalPages
  };
};
