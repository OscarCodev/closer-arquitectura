import { Inject, Injectable, Logger } from '@nestjs/common'
import type Redis from 'ioredis'
import type { CachePort } from '../../application/ports/cache.port'
import { REDIS_CLIENT } from './redis.provider'

/**
 * Caché en Redis compartida por todas las réplicas del backend.
 * Si Redis falla, la aplicación sigue funcionando contra la base de datos (degradación controlada).
 */
@Injectable()
export class RedisCacheAdapter implements CachePort {
  private readonly logger = new Logger(RedisCacheAdapter.name)
  private readonly prefix = 'closer:cache:'

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(this.prefix + key)
      return raw ? (JSON.parse(raw) as T) : null
    } catch (error) {
      this.logger.warn(`get ${key} falló: ${(error as Error).message}`)
      return null
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.set(this.prefix + key, JSON.stringify(value), 'EX', ttlSeconds)
    } catch (error) {
      this.logger.warn(`set ${key} falló: ${(error as Error).message}`)
    }
  }

  async delete(...keys: string[]): Promise<void> {
    if (keys.length === 0) return
    try {
      await this.redis.del(...keys.map((key) => this.prefix + key))
    } catch (error) {
      this.logger.warn(`delete falló: ${(error as Error).message}`)
    }
  }

  /** Contadores de esta réplica (se exponen en GET /health/metrics para las pruebas de carga). */
  readonly stats = { hits: 0, misses: 0 }

  async getOrSet<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key)
    if (cached !== null) {
      this.stats.hits++
      return cached
    }
    this.stats.misses++
    const value = await loader()
    await this.set(key, value, ttlSeconds)
    return value
  }
}
