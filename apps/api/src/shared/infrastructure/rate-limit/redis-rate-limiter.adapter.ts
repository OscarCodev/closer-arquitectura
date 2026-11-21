import { Inject, Injectable, Logger } from '@nestjs/common'
import type Redis from 'ioredis'
import type { RateLimiterPort, RateLimitResult, RateLimitRule } from '../../application/ports/rate-limiter.port'
import { REDIS_CLIENT } from '../cache/redis.provider'

/**
 * Ventana fija con INCR + EXPIRE atómicos en Redis.
 * Reemplaza el `Map` en memoria del MVP, que con N réplicas permitía N veces el límite.
 */
@Injectable()
export class RedisRateLimiterAdapter implements RateLimiterPort {
  private readonly logger = new Logger(RedisRateLimiterAdapter.name)

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async consume(rule: RateLimitRule, subject: string): Promise<RateLimitResult> {
    const key = `closer:rl:${rule.name}:${subject}`
    try {
      // SET NX crea la ventana con su TTL solo la primera vez; INCR cuenta. Todo en una transacción.
      const results = (await this.redis
        .multi()
        .set(key, 0, 'EX', rule.windowSeconds, 'NX')
        .incr(key)
        .ttl(key)
        .exec()) as Array<[Error | null, unknown]>

      const count = Number(results[1][1])
      const ttl = Number(results[2][1])
      const retryAfterSeconds = ttl > 0 ? ttl : rule.windowSeconds

      return {
        allowed: count <= rule.limit,
        remaining: Math.max(0, rule.limit - count),
        retryAfterSeconds,
      }
    } catch (error) {
      // Si Redis no responde, no bloqueamos a los usuarios (fail-open) y lo registramos.
      this.logger.warn(`rate limit sin Redis (${rule.name}): ${(error as Error).message}`)
      return { allowed: true, remaining: rule.limit, retryAfterSeconds: 0 }
    }
  }
}
