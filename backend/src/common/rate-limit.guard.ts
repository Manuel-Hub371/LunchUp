import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { ApiException } from './api-exception'

export interface RateLimitOptions {
  limit: number
  ttlMs: number
}

export const RATE_LIMIT_KEY = 'rateLimit'

export const RateLimit = (options: RateLimitOptions) => {
  return (target: unknown, key?: unknown, descriptor?: PropertyDescriptor) => {
    if (descriptor) Reflect.defineMetadata(RATE_LIMIT_KEY, options, descriptor.value)
    else Reflect.defineMetadata(RATE_LIMIT_KEY, options, target as object)
  }
}

interface Bucket {
  hits: number
  resetAt: number
}

/**
 * Single-instance in-memory rate limiter keyed by client IP. In production
 * deployments with multiple replicas, replace with a Redis-backed store.
 * Disabled entirely while running tests (`NODE_ENV === 'test'`) so e2e
 * suites are not throttled.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, Bucket>()

  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService
  ) {}

  canActivate(context: ExecutionContext): boolean {
    if (this.config.get('env') === 'test') return true

    const request = context.switchToHttp().getRequest<{
      ip?: string
      connection?: { remoteAddress?: string }
      socket?: { remoteAddress?: string }
    }>()
    const key = request.ip || request.socket?.remoteAddress || request.connection?.remoteAddress || 'unknown'

    const custom = this.reflector.get<RateLimitOptions | undefined>(
      RATE_LIMIT_KEY,
      context.getHandler()
    ) ?? this.reflector.getAllAndOverride<RateLimitOptions>(RATE_LIMIT_KEY, [context.getClass()])

    const ttlMs = custom?.ttlMs ?? this.config.get<number>('throttle.ttlMs') ?? 60000
    const limit = custom?.limit ?? this.config.get<number>('throttle.limit') ?? 120

    const now = Date.now()
    const bucket = this.buckets.get(key)
    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(key, { hits: 1, resetAt: now + ttlMs })
      return true
    }
    bucket.hits += 1
    if (bucket.hits > limit) {
      throw ApiException.notFound('TOO_MANY_REQUESTS', 'Too many requests. Please slow down.')
    }
    return true
  }
}