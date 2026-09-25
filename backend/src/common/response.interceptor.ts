import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

/** Marks a controller return value that must be streamed/passed through untouched. */
export const RAW_RESPONSE = Symbol('RAW_RESPONSE')

export interface PaginatedResult<T> {
  data: T[]
  meta: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface PayloadT<T> {
  data?: T
  meta?: Record<string, unknown> | PaginatedResult<T>['meta']
  [key: string]: unknown
}

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((value) => {
        if (value === null || value === undefined) return { success: true, data: null }
        if ((value as { [RAW_RESPONSE]?: unknown })?.[RAW_RESPONSE]) {
          return (value as { [RAW_RESPONSE]: unknown })[RAW_RESPONSE]
        }
        if (typeof value !== 'object') return { success: true, data: value }
        if (Array.isArray(value)) return { success: true, data: value }
        const record = value as PayloadT<unknown>
        const hasMeta = record.meta && typeof record.meta === 'object' && 'total' in record.meta
        const message = record.message
        const rest: Record<string, unknown> = { ...record }
        delete rest.data
        delete rest.meta
        delete rest.message
        const extra = Object.keys(rest).length > 0 ? rest : undefined
        const body: Record<string, unknown> = { success: true }
        if ('data' in record || extra) {
          body.data = record.data ?? extra
        } else {
          body.data = record
        }
        if (message !== undefined) body.message = message
        if (hasMeta) body.meta = record.meta
        return body
      })
    )
  }
}