import { Inject, Injectable } from '@nestjs/common'
import { CACHE, type CachePort } from '../../../shared/application/ports/cache.port'
import { NotFoundError, ValidationError } from '../../../shared/domain/errors'
import type { SessionWithSimulations } from '../domain/practice-session'
import { PRACTICE_REPOSITORY, type PracticeRepositoryPort } from './ports'

/** Historial del sidebar: se lee en cada carga de /setup, cambia solo al evaluar, renombrar o borrar. */
export const SESSIONS_CACHE_TTL_SECONDS = 120
export const SESSIONS_LIST_LIMIT = 60
export const sessionsCacheKey = (userId: string) => `sessions:${userId}`

@Injectable()
export class ListSessionsUseCase {
  constructor(
    @Inject(PRACTICE_REPOSITORY) private readonly repo: PracticeRepositoryPort,
    @Inject(CACHE) private readonly cache: CachePort,
  ) {}

  async execute(userId: string): Promise<SessionWithSimulations[]> {
    const sessions = await this.cache.getOrSet(sessionsCacheKey(userId), SESSIONS_CACHE_TTL_SECONDS, () =>
      this.repo.listSessions(userId, SESSIONS_LIST_LIMIT),
    )
    return sessions.map(reviveSession)
  }
}

@Injectable()
export class GetSessionUseCase {
  constructor(@Inject(PRACTICE_REPOSITORY) private readonly repo: PracticeRepositoryPort) {}

  async execute(userId: string, sessionId: string): Promise<SessionWithSimulations> {
    const session = await this.repo.findSession(userId, sessionId)
    if (!session) throw new NotFoundError('Sesión no encontrada')
    return session
  }
}

@Injectable()
export class RenameSessionUseCase {
  constructor(
    @Inject(PRACTICE_REPOSITORY) private readonly repo: PracticeRepositoryPort,
    @Inject(CACHE) private readonly cache: CachePort,
  ) {}

  async execute(userId: string, sessionId: string, rawName: string): Promise<void> {
    const name = rawName.trim().slice(0, 120)
    if (!name) throw new ValidationError('El nombre no puede estar vacío.')
    if (!(await this.repo.renameSession(userId, sessionId, name))) throw new NotFoundError('Sesión no encontrada')
    await this.cache.delete(sessionsCacheKey(userId))
  }
}

@Injectable()
export class DeleteSessionUseCase {
  constructor(
    @Inject(PRACTICE_REPOSITORY) private readonly repo: PracticeRepositoryPort,
    @Inject(CACHE) private readonly cache: CachePort,
  ) {}

  async execute(userId: string, sessionId: string): Promise<void> {
    if (!(await this.repo.deleteSession(userId, sessionId))) throw new NotFoundError('Sesión no encontrada')
    await this.cache.delete(sessionsCacheKey(userId))
  }
}

/** Al volver de Redis las fechas llegan como string. */
function reviveSession(session: SessionWithSimulations): SessionWithSimulations {
  return {
    ...session,
    createdAt: new Date(session.createdAt),
    updatedAt: new Date(session.updatedAt),
    simulations: session.simulations.map((sim) => ({
      ...sim,
      createdAt: new Date(sim.createdAt),
      statusChangedAt: new Date(sim.statusChangedAt),
    })),
  }
}
