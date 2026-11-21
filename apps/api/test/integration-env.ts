/** Variables de entorno de las pruebas de integración (tienen prioridad sobre el .env). */
const base = process.env.INTEGRATION_DATABASE_URL ?? 'postgresql://closer:closer@127.0.0.1:5432/closer'

Object.assign(process.env, {
  NODE_ENV: 'test',
  DATABASE_URL: `${base}?schema=integration&connection_limit=5`,
  DIRECT_DATABASE_URL: `${base}?schema=integration`,
  REDIS_URL: process.env.INTEGRATION_REDIS_URL ?? 'redis://127.0.0.1:6379/1',
  AUTH_JWT_SECRET: 'integration-secret-de-al-menos-32-caracteres',
  AUTH_DEV_LOGIN: 'true',
  AI_PROVIDER: 'fake',
  SUPABASE_URL: '',
  SUPPORT_WEBHOOK_URL: '',
  CORS_ORIGINS: 'http://localhost:3000',
})
export {}
