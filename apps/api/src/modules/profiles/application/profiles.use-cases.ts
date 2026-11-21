import { Inject, Injectable } from '@nestjs/common'
import { CACHE, type CachePort } from '../../../shared/application/ports/cache.port'
import { NotFoundError } from '../../../shared/domain/errors'
import { buildProfileInput, type ProspectProfile, type ProspectProfileInput } from '../domain/prospect-profile'
import { PROFILE_REPOSITORY, type ProfileRepositoryPort } from './ports'

/** TTL de la lista de prospectos en caché. Toda escritura la invalida. */
export const PROFILES_CACHE_TTL_SECONDS = 300
export const profilesCacheKey = (userId: string) => `profiles:${userId}`

type ProfileFields = Partial<Record<keyof ProspectProfileInput, string | null>>

@Injectable()
export class ListProfilesUseCase {
  constructor(
    @Inject(PROFILE_REPOSITORY) private readonly profiles: ProfileRepositoryPort,
    @Inject(CACHE) private readonly cache: CachePort,
  ) {}

  /** Cache-aside: la biblioteca se lee en cada carga de /setup y cambia poco. */
  async execute(userId: string): Promise<ProspectProfile[]> {
    const cached = await this.cache.getOrSet(profilesCacheKey(userId), PROFILES_CACHE_TTL_SECONDS, () =>
      this.profiles.listByUser(userId),
    )
    return cached.map(reviveDates)
  }
}

@Injectable()
export class CreateProfileUseCase {
  constructor(
    @Inject(PROFILE_REPOSITORY) private readonly profiles: ProfileRepositoryPort,
    @Inject(CACHE) private readonly cache: CachePort,
  ) {}

  async execute(userId: string, fields: ProfileFields): Promise<ProspectProfile> {
    const created = await this.profiles.create(userId, buildProfileInput(fields))
    await this.cache.delete(profilesCacheKey(userId))
    return created
  }
}

@Injectable()
export class UpdateProfileUseCase {
  constructor(
    @Inject(PROFILE_REPOSITORY) private readonly profiles: ProfileRepositoryPort,
    @Inject(CACHE) private readonly cache: CachePort,
  ) {}

  async execute(userId: string, id: string, fields: ProfileFields): Promise<ProspectProfile> {
    const current = await this.profiles.findById(userId, id)
    if (!current) throw new NotFoundError('Prospecto no encontrado')

    const merged = buildProfileInput({
      name: fields.name ?? current.name,
      prospect: fields.prospect ?? current.prospect,
      context: fields.context ?? current.context,
      personName: fields.personName !== undefined ? fields.personName : current.personName,
      roleCompany: fields.roleCompany !== undefined ? fields.roleCompany : current.roleCompany,
    })
    const updated = await this.profiles.update(userId, id, merged)
    if (!updated) throw new NotFoundError('Prospecto no encontrado')
    await this.cache.delete(profilesCacheKey(userId))
    return updated
  }
}

@Injectable()
export class DeleteProfileUseCase {
  constructor(
    @Inject(PROFILE_REPOSITORY) private readonly profiles: ProfileRepositoryPort,
    @Inject(CACHE) private readonly cache: CachePort,
  ) {}

  async execute(userId: string, id: string): Promise<void> {
    const deleted = await this.profiles.delete(userId, id)
    if (!deleted) throw new NotFoundError('Prospecto no encontrado')
    await this.cache.delete(profilesCacheKey(userId))
  }
}

/** Al volver de Redis las fechas llegan como string. */
function reviveDates(profile: ProspectProfile): ProspectProfile {
  return { ...profile, createdAt: new Date(profile.createdAt), updatedAt: new Date(profile.updatedAt) }
}
