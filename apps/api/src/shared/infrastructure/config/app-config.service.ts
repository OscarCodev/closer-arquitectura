import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { Env } from './env'

/** Acceso tipado a la configuración validada. */
@Injectable()
export class AppConfig {
  constructor(private readonly config: ConfigService<Env, true>) {}

  get<K extends keyof Env>(key: K): Env[K] {
    return this.config.get(key, { infer: true })
  }

  get isProduction() {
    return this.get('NODE_ENV') === 'production'
  }

  get devLoginEnabled() {
    return this.get('AUTH_DEV_LOGIN') === 'true' && !this.isProduction
  }

  get corsOrigins() {
    return this.get('CORS_ORIGINS')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
  }
}
