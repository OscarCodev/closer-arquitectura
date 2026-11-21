import { Controller, Get, Inject } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { HealthCheck, HealthCheckService, HealthIndicatorService } from '@nestjs/terminus'
import type Redis from 'ioredis'
import { hostname } from 'node:os'
import { CACHE, type CachePort } from '../../shared/application/ports/cache.port'
import type { RedisCacheAdapter } from '../../shared/infrastructure/cache/redis-cache.adapter'
import { REDIS_CLIENT } from '../../shared/infrastructure/cache/redis.provider'
import { PrismaService } from '../../shared/infrastructure/database/prisma.service'
import { Public } from '../identity/presentation/auth.guard'

@ApiTags('Salud')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly indicator: HealthIndicatorService,
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @Inject(CACHE) private readonly cache: CachePort,
  ) {}

  @Public()
  @Get('live')
  @ApiOperation({ summary: 'El proceso está vivo (lo usa el balanceador). Incluye la réplica que respondió.' })
  live() {
    return { status: 'ok', instance: hostname() }
  }

  @Public()
  @Get('metrics')
  @ApiOperation({ summary: 'Métricas de esta réplica: aciertos de caché, memoria y tiempo activo' })
  metrics() {
    const { hits, misses } = (this.cache as RedisCacheAdapter).stats ?? { hits: 0, misses: 0 }
    const total = hits + misses
    return {
      instance: hostname(),
      uptimeSeconds: Math.round(process.uptime()),
      memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      cache: { hits, misses, hitRatio: total === 0 ? null : Number((hits / total).toFixed(3)) },
    }
  }

  @Public()
  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Dependencias listas: PostgreSQL y Redis' })
  ready() {
    return this.health.check([
      () => this.probe('database', () => this.prisma.ping()),
      () => this.probe('redis', async () => void (await this.redis.ping())),
    ])
  }

  private async probe(key: string, check: () => Promise<void>) {
    const indicator = this.indicator.check(key)
    try {
      await check()
      return indicator.up()
    } catch (error) {
      return indicator.down({ message: (error as Error).message })
    }
  }
}
