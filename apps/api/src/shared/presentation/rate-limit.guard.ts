import { CanActivate, ExecutionContext, Inject, Injectable, SetMetadata } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { Request, Response } from 'express'
import { RateLimitedError } from '../domain/errors'
import { RATE_LIMITER, type RateLimiterPort, type RateLimitRule } from '../application/ports/rate-limiter.port'
import type { AuthenticatedRequest } from '../../modules/identity/presentation/authenticated-request'

const RATE_LIMIT_RULES = 'rate-limit-rules'

/** Declara uno o más límites (p. ej. ráfaga por minuto + tope por hora) para un endpoint. */
export const RateLimit = (...rules: RateLimitRule[]) => SetMetadata(RATE_LIMIT_RULES, rules)

/** Aplica los límites declarados por usuario autenticado (o por IP si el endpoint es público). */
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(RATE_LIMITER) private readonly limiter: RateLimiterPort,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rules = this.reflector.getAllAndOverride<RateLimitRule[] | undefined>(RATE_LIMIT_RULES, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!rules?.length) return true

    const request = context.switchToHttp().getRequest<Request & Partial<AuthenticatedRequest>>()
    const response = context.switchToHttp().getResponse<Response>()
    const subject = request.user?.id ?? request.ip ?? 'anonymous'

    for (const rule of rules) {
      const result = await this.limiter.consume(rule, subject)
      if (!result.allowed) {
        response.setHeader('Retry-After', String(result.retryAfterSeconds))
        throw new RateLimitedError(rule.message, result.retryAfterSeconds)
      }
    }
    return true
  }
}
