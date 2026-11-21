import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common'
import type Redis from 'ioredis'
import { REDIS_CLIENT } from './redis.provider'

/** Cierra la conexión a Redis al apagar la réplica (apagado ordenado en despliegues y pruebas). */
@Injectable()
export class RedisShutdown implements OnApplicationShutdown {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async onApplicationShutdown() {
    await this.redis.quit().catch(() => this.redis.disconnect())
  }
}
