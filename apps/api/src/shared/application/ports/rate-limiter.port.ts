export type RateLimitRule = {
  /** Nombre lógico del límite, p. ej. `sim-start-burst`. */
  name: string
  limit: number
  windowSeconds: number
  message: string
}

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

/** Puerto de rate limiting distribuido: el contador es compartido por todas las réplicas. */
export interface RateLimiterPort {
  consume(rule: RateLimitRule, subject: string): Promise<RateLimitResult>
}

export const RATE_LIMITER = Symbol('RATE_LIMITER')
