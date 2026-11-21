/**
 * Errores de dominio: los casos de uso los lanzan sin conocer HTTP.
 * La capa de presentación los traduce a códigos de estado (DomainExceptionFilter).
 */
export abstract class DomainError extends Error {
  abstract readonly code: string

  constructor(message: string) {
    super(message)
    this.name = new.target.name
  }
}

export class ValidationError extends DomainError {
  readonly code = 'validation_error'
}

export class NotFoundError extends DomainError {
  readonly code = 'not_found'
}

export class UnauthenticatedError extends DomainError {
  readonly code = 'unauthenticated'

  constructor(message = 'Sesión inválida o expirada') {
    super(message)
  }
}

export class ForbiddenError extends DomainError {
  readonly code = 'forbidden'
}

export class ConflictError extends DomainError {
  readonly code = 'conflict'
}

export class RateLimitedError extends DomainError {
  readonly code = 'rate_limited'

  constructor(
    message: string,
    readonly retryAfterSeconds: number,
  ) {
    super(message)
  }
}

/** Falla de un proveedor externo (IA, webhook). */
export class ExternalServiceError extends DomainError {
  readonly code = 'external_service_error'
}
