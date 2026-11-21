import { plainToInstance, Type } from 'class-transformer'
import { IsBooleanString, IsIn, IsInt, IsOptional, IsString, Max, Min, MinLength, validateSync } from 'class-validator'

/** Variables de entorno del backend. Se validan al arrancar: si falta algo, el proceso no inicia. */
export class Env {
  @IsIn(['development', 'test', 'production'])
  NODE_ENV: 'development' | 'test' | 'production' = 'development'

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 4000

  @IsString()
  CORS_ORIGINS = 'http://localhost:3000'

  @IsString()
  DATABASE_URL: string

  @IsString()
  REDIS_URL: string

  @IsOptional()
  @IsString()
  SUPABASE_URL?: string

  @IsString()
  @MinLength(32)
  AUTH_JWT_SECRET: string

  @IsBooleanString()
  AUTH_DEV_LOGIN = 'false'

  @IsIn(['gemini', 'fake'])
  AI_PROVIDER: 'gemini' | 'fake' = 'fake'

  @IsOptional()
  @IsString()
  GEMINI_API_KEY?: string

  @IsString()
  GEMINI_TEXT_MODEL = 'gemini-2.5-flash-lite'

  @IsString()
  GEMINI_LIVE_MODEL = 'gemini-2.5-flash-native-audio-latest'

  @IsOptional()
  @IsString()
  SUPPORT_WEBHOOK_URL?: string
}

export function validateEnv(raw: Record<string, unknown>): Env {
  const env = plainToInstance(Env, raw, { enableImplicitConversion: true, exposeDefaultValues: true })
  const errors = validateSync(env, { skipMissingProperties: false })
  if (errors.length > 0) {
    const detail = errors.map((e) => `${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`).join('\n')
    throw new Error(`Variables de entorno inválidas:\n${detail}`)
  }
  if (env.AI_PROVIDER === 'gemini' && !env.GEMINI_API_KEY) {
    throw new Error('AI_PROVIDER=gemini requiere GEMINI_API_KEY')
  }
  if (env.NODE_ENV === 'production' && env.AUTH_DEV_LOGIN === 'true') {
    throw new Error('AUTH_DEV_LOGIN no puede estar activo en producción')
  }
  return env
}
