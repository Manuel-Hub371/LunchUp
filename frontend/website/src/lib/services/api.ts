/**
 * Service layer foundation.
 *
 * Every service in this application resolves through this module so the
 * asynchronous contract (loading / error / empty states) is identical.
 *
 * Two worlds coexist here:
 * - `apiRequest` / `request`: the real LunchUp API client. Requests go to
 *   `/api/v1/...`, which Next rewrites to the running backend. Session
 *   cookies are sent with `credentials: 'include'`.
 * - The legacy simulation helpers below are kept for services that still
 *   resolve from local data (contact / newsletter), so their async
 *   contract stays identical to the API layer.
 */
import { delay } from '@/lib/utils'

export class ApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status = 500, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

/** Default simulated network latency in milliseconds (legacy helpers). */
export const DEFAULT_LATENCY = 240

function effectiveLatency(ms = DEFAULT_LATENCY): number {
  const configured = Number(process.env.NEXT_PUBLIC_API_LATENCY ?? ms)
  return Number.isFinite(configured) && configured >= 0 ? configured : ms
}

/* ------------------------------------------------------------------ *
 * Real API client
 * ------------------------------------------------------------------ */

/** Base URL for the LunchUp API. Set NEXT_PUBLIC_API_URL to call it
 * cross-origin; otherwise Next's `/api/v1` rewrite proxies to the backend. */
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || '/api/v1').replace(/\/+$/, '')

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface ApiEnvelope<T> {
  success: boolean
  data: T
  message?: string
  meta?: PaginationMeta
  error?: {
    code?: string
    message?: string
    details?: unknown
  }
}

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

export interface RequestOptions {
  method?: HttpMethod
  body?: unknown
  headers?: Record<string, string>
  query?: Record<string, string | number | boolean | undefined | null>
  signal?: AbortSignal
}

function toQuery(query: NonNullable<RequestOptions['query']>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue
    params.set(key, String(value))
  }
  const raw = params.toString()
  return raw ? `?${raw}` : ''
}

/**
 * Calls the LunchUp API and unwraps the `{ success, data, meta }` envelope.
 * Throws an `ApiError` carrying the server message + status on failure.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<ApiEnvelope<T>> {
  const url = `${API_BASE_URL}${path}${toQuery(options.query || {})}`
  const headers: Record<string, string> = { ...options.headers }
  const init: RequestInit = {
    method: options.method || 'GET',
    credentials: 'include',
    headers,
    signal: options.signal,
  }
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    init.body = JSON.stringify(options.body)
  }

  let res: Response
  try {
    res = await fetch(url, init)
  } catch {
    throw new ApiError('Unable to reach the LunchUp service. Please try again.', 0, 'NETWORK_ERROR')
  }

  let payload: ApiEnvelope<T> | undefined
  try {
    const body = (await res.json()) as ApiEnvelope<T>
    if (body && typeof body === 'object' && 'success' in body) payload = body
  } catch {
    payload = undefined
  }

  if (!res.ok) {
    const message = payload?.error?.message || payload?.message || `Request failed (${res.status})`
    throw new ApiError(message, res.status, payload?.error?.code)
  }
  if (!payload) {
    throw new ApiError('The server returned an empty response.', 502, 'EMPTY_RESPONSE')
  }
  return payload
}

/** Convenience wrapper returning just the envelope's `data`. */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const payload = await apiRequest<T>(path, options)
  return payload.data
}

/* ------------------------------------------------------------------ *
 * Legacy simulation helpers
 * ------------------------------------------------------------------ */

function mapBody<T>(body: T | null | undefined): T {
  if (body === null || body === undefined) {
    throw new ApiError('The requested resource could not be found', 404)
  }
  return body
}

/** Resolves a value as if it came from a network request. */
export async function fetchData<T>(data: T | Promise<T>): Promise<T> {
  const resolved = await data
  return mapBody(resolved)
}

/** Simulates an endpoint that intentionally rejects (for testing error states). */
export async function fetchError(message = 'Unable to load content right now.'): Promise<never> {
  await delay(effectiveLatency())
  throw new ApiError(message, 500)
}

/** Simulates a request that fails when a guard condition is true. */
export async function guardedRequest<T>(
  result: T,
  failWhen: () => boolean,
  message = 'Something went wrong while saving your details. Please try again.'
): Promise<T> {
  await delay(effectiveLatency())
  if (failWhen()) {
    throw new ApiError(message, 422)
  }
  return result
}

/** Applies simulated latency. Used by services that resolve built-in data. */
export async function withLatency<T>(value: T, ms = DEFAULT_LATENCY): Promise<T> {
  const latency = effectiveLatency(ms)
  if (latency > 0) {
    await delay(latency)
  }
  return value
}