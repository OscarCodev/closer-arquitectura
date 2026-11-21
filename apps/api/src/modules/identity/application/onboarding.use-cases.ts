import { Inject, Injectable } from '@nestjs/common'
import { CACHE, type CachePort } from '../../../shared/application/ports/cache.port'
import { normalizeOnboarding, type OnboardingAnswers } from '../domain/onboarding'
import { USER_REPOSITORY, type UserRepositoryPort } from './ports'

/** El onboarding se lee en cada carga de la app (protección de rutas) y casi nunca cambia. */
export const ONBOARDING_CACHE_TTL_SECONDS = 15 * 60
export const onboardingCacheKey = (userId: string) => `onboarding:${userId}`

type CachedOnboarding = { answers: OnboardingAnswers; completedAt: string } | { none: true }

@Injectable()
export class GetOnboardingUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(CACHE) private readonly cache: CachePort,
  ) {}

  async execute(userId: string): Promise<{ answers: OnboardingAnswers; completedAt: Date } | null> {
    // También se cachea la ausencia ({ none: true }) para no consultar la BD en cada visita de un usuario nuevo.
    const cached = await this.cache.getOrSet<CachedOnboarding>(onboardingCacheKey(userId), ONBOARDING_CACHE_TTL_SECONDS, async () => {
      const row = await this.users.findOnboarding(userId)
      return row ? { answers: row.answers, completedAt: row.completedAt.toISOString() } : { none: true }
    })
    return 'none' in cached ? null : { answers: cached.answers, completedAt: new Date(cached.completedAt) }
  }
}

@Injectable()
export class SaveOnboardingUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(CACHE) private readonly cache: CachePort,
  ) {}

  async execute(userId: string, input: Record<string, unknown>) {
    const saved = await this.users.saveOnboarding(userId, normalizeOnboarding(input))
    await this.cache.delete(onboardingCacheKey(userId))
    return saved
  }
}
