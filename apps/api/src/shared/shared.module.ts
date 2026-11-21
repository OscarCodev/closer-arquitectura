import { Global, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { CACHE } from './application/ports/cache.port'
import { RATE_LIMITER } from './application/ports/rate-limiter.port'
import { RedisCacheAdapter } from './infrastructure/cache/redis-cache.adapter'
import { redisProvider, REDIS_CLIENT } from './infrastructure/cache/redis.provider'
import { AppConfig } from './infrastructure/config/app-config.service'
import { validateEnv } from './infrastructure/config/env'
import { PrismaService } from './infrastructure/database/prisma.service'
import { RedisRateLimiterAdapter } from './infrastructure/rate-limit/redis-rate-limiter.adapter'

/** Infraestructura transversal disponible para todos los módulos. */
@Global()
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, validate: validateEnv, cache: true })],
  providers: [
    AppConfig,
    PrismaService,
    redisProvider,
    { provide: CACHE, useClass: RedisCacheAdapter },
    { provide: RATE_LIMITER, useClass: RedisRateLimiterAdapter },
  ],
  exports: [AppConfig, PrismaService, REDIS_CLIENT, CACHE, RATE_LIMITER],
})
export class SharedModule {}
