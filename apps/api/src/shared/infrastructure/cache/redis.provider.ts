import { Logger, Provider } from '@nestjs/common'
import Redis from 'ioredis'
import { AppConfig } from '../config/app-config.service'

export const REDIS_CLIENT = Symbol('REDIS_CLIENT')

export const redisProvider: Provider = {
  provide: REDIS_CLIENT,
  inject: [AppConfig],
  useFactory: (config: AppConfig) => {
    const logger = new Logger('Redis')
    const client = new Redis(config.get('REDIS_URL'), {
      maxRetriesPerRequest: 2,
      enableOfflineQueue: false,
      lazyConnect: false,
    })
    client.on('error', (error) => logger.warn(`Redis no disponible: ${error.message}`))
    return client
  },
}
