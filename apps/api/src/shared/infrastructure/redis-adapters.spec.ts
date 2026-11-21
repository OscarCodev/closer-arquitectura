import type Redis from 'ioredis'
import { RedisCacheAdapter } from './cache/redis-cache.adapter'
import { RedisRateLimiterAdapter } from './rate-limit/redis-rate-limiter.adapter'

/** Redis caído: todas las operaciones fallan. */
const brokenRedis = {
  get: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
  set: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
  del: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
  multi: () => ({ set: () => ({ incr: () => ({ ttl: () => ({ exec: () => Promise.reject(new Error('ECONNREFUSED')) }) }) }) }),
} as unknown as Redis

describe('Degradación controlada sin Redis (CA-08.4)', () => {
  it('la caché responde "sin dato" y la carga viene de la fuente original', async () => {
    const cache = new RedisCacheAdapter(brokenRedis)
    const loader = jest.fn().mockResolvedValue(['desde postgres'])
    await expect(cache.getOrSet('k', 60, loader)).resolves.toEqual(['desde postgres'])
    expect(loader).toHaveBeenCalledTimes(1)
    await expect(cache.delete('k')).resolves.toBeUndefined()
  })

  it('el rate limit deja pasar (fail-open)', async () => {
    const limiter = new RedisRateLimiterAdapter(brokenRedis)
    await expect(limiter.consume({ name: 'x', limit: 1, windowSeconds: 60, message: '' }, 'u')).resolves.toMatchObject({ allowed: true })
  })
})

describe('RedisCacheAdapter', () => {
  it('cuenta aciertos y fallos (CA-08.5)', async () => {
    const data = new Map<string, string>()
    const redis = {
      get: async (k: string) => data.get(k) ?? null,
      set: async (k: string, v: string) => void data.set(k, v),
    } as unknown as Redis
    const cache = new RedisCacheAdapter(redis)
    await cache.getOrSet('a', 60, async () => 1)
    await cache.getOrSet('a', 60, async () => 2)
    expect(cache.stats).toEqual({ hits: 1, misses: 1 })
    expect(data.has('closer:cache:a')).toBe(true)
  })
})
