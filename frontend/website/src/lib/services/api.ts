/**
 * Service layer foundation.
 *
 * Every service in this application resolves through this module so the
 * asynchronous contract (loading / error / empty states) is identical,
 * whether the data currently comes from the development dataset or, later,
 * from the LunchUp API. Swapping the data source for real fetch calls only
 * requires editing these service modules — components stay unchanged.
 */
import { delay } from '@/lib/utils'

export class ApiError extends Error {
  status: number

  constructor(message: string, status = 500) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** Default simulated network latency in milliseconds. */
export const DEFAULT_LATENCY = 240

function effectiveLatency(ms = DEFAULT_LATENCY): number {
  const configured = Number(process.env.NEXT_PUBLIC_API_LATENCY ?? ms)
  return Number.isFinite(configured) && configured >= 0 ? configured : ms
}

/**
 * Resolves a value as if it came from a network request, so components
 * exercise real loading / error paths.
 */
export async function fetchData<T>(data: T | Promise<T>): Promise<T> {
  const resolved = await data
  if (resolved === null || resolved === undefined) {
    throw new ApiError('The requested resource could not be found', 404)
  }
  return resolved
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

/** Applies simulated latency. Used by services that fetch built-in data. */
export async function withLatency<T>(value: T, ms = DEFAULT_LATENCY): Promise<T> {
  const latency = effectiveLatency(ms)
  if (latency > 0) {
    await delay(latency)
  }
  return value
}