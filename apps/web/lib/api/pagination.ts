/**
 * Parse page + pageSize from URL search params.
 * Returns { skip, take, page, pageSize }
 */
export function parsePagination(searchParams: URLSearchParams, defaultPageSize = 20) {
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? String(defaultPageSize))))
  return {
    skip: (page - 1) * pageSize,
    take: pageSize,
    page,
    pageSize,
  }
}

export function paginatedResponse<T>(data: T[], total: number, page: number, pageSize: number) {
  return {
    data,
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  }
}
