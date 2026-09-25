import { HttpException, HttpStatus } from '@nestjs/common'

/**
 * Application-level error that carries a stable machine-readable `code`
 * alongside the HTTP status and human message. Serialized by the global
 * exception filter as `{ success: false, error: { code, message } }`.
 */
export class ApiException extends HttpException {
  readonly code: string

  constructor(code: string, message: string, status: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, status)
    this.code = code
  }

  static notFound(code = 'NOT_FOUND', message = 'Resource not found') {
    return new ApiException(code, message, HttpStatus.NOT_FOUND)
  }

  static conflict(code: string, message: string) {
    return new ApiException(code, message, HttpStatus.CONFLICT)
  }

  static unauthorized(message = 'Authentication required') {
    return new ApiException('UNAUTHORIZED', message, HttpStatus.UNAUTHORIZED)
  }

  static forbidden(message = 'You do not have permission to perform this action') {
    return new ApiException('FORBIDDEN', message, HttpStatus.FORBIDDEN)
  }

  static validation(message: string) {
    return new ApiException('VALIDATION_ERROR', message, HttpStatus.BAD_REQUEST)
  }

  static unprocessable(message: string, code = 'UNPROCESSABLE') {
    return new ApiException(code, message, HttpStatus.UNPROCESSABLE_ENTITY)
  }

  static gone(message: string) {
    return new ApiException('GONE', message, HttpStatus.GONE)
  }
}