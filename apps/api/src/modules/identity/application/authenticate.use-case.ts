import { Inject, Injectable } from '@nestjs/common'
import { CACHE, type CachePort } from '../../../shared/application/ports/cache.port'
import type { AuthenticatedUser } from '../domain/authenticated-user'
import { TOKEN_VERIFIER, USER_REPOSITORY, type TokenVerifierPort, type UserRepositoryPort } from './ports'

const KNOWN_USER_TTL_SECONDS = 10 * 60

/**
 * Verifica el token y registra al usuario en la BD la primera vez.
 * La marca "usuario conocido" vive en caché para no escribir en la BD en cada petición.
 */
@Injectable()
export class AuthenticateUseCase {
  constructor(
    @Inject(TOKEN_VERIFIER) private readonly verifier: TokenVerifierPort,
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(CACHE) private readonly cache: CachePort,
  ) {}

  async execute(token: string): Promise<AuthenticatedUser> {
    const user = await this.verifier.verify(token)
    const knownKey = `user:known:${user.id}`
    if (!(await this.cache.get<boolean>(knownKey))) {
      await this.users.upsert(user)
      await this.cache.set(knownKey, true, KNOWN_USER_TTL_SECONDS)
    }
    return user
  }
}
