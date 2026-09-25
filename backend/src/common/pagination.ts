import { PaginatedResult } from './response.interceptor'

export interface PageQuery {
  page?: number
  pageSize?: number
}

export function normalizePagination(page?: number, pageSize?: number) {
  const safePage = Math.max(1, Math.floor(page || 1))
  const safeSize = Math.min(100, Math.max(1, Math.floor(pageSize || 20)))
  return { page: safePage, pageSize: safeSize, skip: (safePage - 1) * safeSize }
}

/** Builds the `{ data, meta }` shape the response interceptor wraps. */
export function paginate<T>(data: T[], total: number, page: number, pageSize: number): PaginatedResult<T> {
  return {
    data,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  }
}