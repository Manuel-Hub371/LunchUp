import { Request, Response } from 'express'
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { ApiException } from './api-exception'

interface ErrorBody {
  success: boolean
  error: { code: string; message: string }
}

const DEFAULT_STATUS = HttpStatus.INTERNAL_SERVER_ERROR

function buildBody(code: string, message: string, status: number): ErrorBody {
  return {
    success: false,
    error: {
      code: code || (status === 500 ? 'INTERNAL_ERROR' : 'REQUEST_FAILED'),
      message: message || 'Something went wrong. Please try again.',
    },
  }
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception')

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    // Non-HTTP transports (e.g. websockets) get a plain rejection.
    if (!response || typeof response.status !== 'function' || !request) {
      throw exception
    }

    let status = DEFAULT_STATUS
    let code = 'INTERNAL_ERROR'
    let message = 'Something went wrong. Please try again.'
    const details: string[] = []

    if (exception instanceof ApiException) {
      status = exception.getStatus()
      code = exception.code
      message = exception.message
    } else if (exception instanceof HttpException) {
      status = exception.getStatus()
      const body = exception.getResponse()
      if (typeof body === 'string') {
        message = body
      } else if (body && typeof body === 'object') {
        const raw = body as { message?: unknown; error?: string }
        if (Array.isArray(raw.message)) {
          const messages = raw.message as string[]
          message = messages.join(', ')
          details.push(...messages)
        } else if (typeof raw.message === 'string') {
          message = raw.message
        } else if (raw.error) {
          message = raw.error
        }
      }
      code = detailCode(status) || this.httpCode(status)
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT
          code = 'CONFLICT'
          message = 'A record with this value already exists.'
          break
        case 'P2025':
          status = HttpStatus.NOT_FOUND
          code = 'NOT_FOUND'
          message = 'The requested resource could not be found.'
          break
        default:
          status = HttpStatus.UNPROCESSABLE_ENTITY
          code = 'DATABASE_ERROR'
          message = 'The request could not be completed.'
          break
      }
    } else if (exception instanceof Error) {
      status = statusFrom(errorStatusDetector(exception)) || DEFAULT_STATUS
      this.logger.error(
        `Unhandled: ${exception.message}\n${exception.stack || ''}\nmethod=${request.method} url=${request.url}`
      )
    }

    if (status >= 500 && !(exception instanceof Prisma.PrismaClientKnownRequestError)) {
      if (exception instanceof Error) {
        this.logger.error(`Unhandled exception: ${exception.stack || exception.message}`)
      }
    }

    response.status(status).json(buildBody(code, message, status))
  }

  private httpCode(status: number): string {
    const map: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
    }
    return map[status] || 'REQUEST_FAILED'
  }
}

function detailCode(status: number): string | undefined {
  if (status === 400) return 'VALIDATION_ERROR'
  return undefined
}

interface StatusHolder {
  code?: string | number
  statusCode?: string | number
  status?: string | number
}

function errorStatusDetector(exception: unknown): number | undefined {
  const ex = exception as StatusHolder
  const code = ex?.code ?? ex?.statusCode ?? ex?.status
  if (typeof code === 'number') return code
  if (typeof code === 'string' && /^\d+$/.test(code)) return parseInt(code, 10)
  return undefined
}

function statusFrom(code: number | undefined): number | undefined {
  if (!code) return undefined
  const valid = [400, 401, 403, 404, 409, 410, 422, 429, 502, 503]
  return valid.includes(code) ? code : undefined
}