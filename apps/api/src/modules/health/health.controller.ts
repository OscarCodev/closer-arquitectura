import { Controller, Get, Inject } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { HealthCheck, HealthCheckService, HealthIndicatorService } from '@nestjs/terminus'
import type Redis from 'ioredis'
import { hostname } from 'node:os'
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
  ) {}

  @Public()
  @Get('live')
  @ApiOperation({ summary: 'El proceso está vivo (lo usa el balanceador). Incluye la réplica que respondió.' })
  live() {
    return { status: 'ok', instance: hostname() }
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
