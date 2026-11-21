import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common'
import type { Response } from 'express'
import {
  ConflictError,
  DomainError,
  ExternalServiceError,
  ForbiddenError,
  NotFoundError,
  RateLimitedError,
  UnauthenticatedError,
  ValidationError,
} from '../domain/errors'

const STATUS_BY_ERROR = new Map<abstract new (...args: never[]) => DomainError, number>([
  [ValidationError, HttpStatus.BAD_REQUEST],
  [UnauthenticatedError, HttpStatus.UNAUTHORIZED],
  [NotFoundError, HttpStatus.NOT_FOUND],
  [ForbiddenError, HttpStatus.FORBIDDEN],
  [ConflictError, HttpStatus.CONFLICT],
  [RateLimitedError, HttpStatus.TOO_MANY_REQUESTS],
  [ExternalServiceError, HttpStatus.BAD_GATEWAY],
])

/**
 * Traduce errores de dominio a HTTP con un formato único: `{ error, code, ... }`.
 * Así los casos de uso no conocen HTTP y el frontend recibe siempre la misma forma.
 */
@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HTTP')

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>()

    if (exception instanceof DomainError) {
      const status =
        STATUS_BY_ERROR.get(exception.constructor as abstract new (...args: never[]) => DomainError) ??
        HttpStatus.BAD_REQUEST
      const body: Record<string, unknown> = { error: exception.message, code: exception.code }
      if (exception instanceof RateLimitedError) body.retryAfterSeconds = exception.retryAfterSeconds
      return response.status(status).json(body)
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus()
      const payload = exception.getResponse()
      const message =
        typeof payload === 'string'
          ? payload
          : Array.isArray((payload as { message?: unknown }).message)
            ? ((payload as { message: string[] }).message).join('; ')
            : String((payload as { message?: unknown }).message ?? exception.message)
      return response.status(status).json({ error: message, code: `http_${status}` })
    }

    // Base de datos inalcanzable (Prisma P1001/P1002, pool agotado P2024): es temporal, se informa como 503.
    const prismaCode = (exception as { code?: unknown })?.code
    if (prismaCode === 'P1001' || prismaCode === 'P1002' || prismaCode === 'P2024') {
      this.logger.warn(`Base de datos no disponible (${prismaCode})`)
      response.setHeader('Retry-After', '5')
      return response
        .status(HttpStatus.SERVICE_UNAVAILABLE)
        .json({ error: 'El servicio no está disponible en este momento. Intenta de nuevo en unos segundos.', code: 'service_unavailable' })
    }

    this.logger.error(exception instanceof Error ? exception.stack : String(exception))
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Error interno', code: 'internal_error' })
  }
}
