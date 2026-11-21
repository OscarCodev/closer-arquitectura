import { Injectable } from '@nestjs/common'
import { createRemoteJWKSet, decodeProtectedHeader, jwtVerify, type JWTPayload } from 'jose'
import { UnauthenticatedError } from '../../../shared/domain/errors'
import { AppConfig } from '../../../shared/infrastructure/config/app-config.service'
import type { TokenVerifierPort } from '../application/ports'
import type { AuthenticatedUser } from '../domain/authenticated-user'

/**
 * Valida los access tokens de Supabase Auth sin llamar a Supabase en cada petición:
 *  - HS256 → con el JWT secret del proyecto (o el secreto local de desarrollo).
 *  - RS256/ES256 → con las claves públicas (JWKS) publicadas por el proyecto de Supabase.
 * El identificador del usuario sale del token verificado, nunca del body (ADR-007 / EQ-04).
 */
@Injectable()
export class SupabaseJwtVerifier implements TokenVerifierPort {
  private readonly secret: Uint8Array
  private readonly jwks?: ReturnType<typeof createRemoteJWKSet>

  constructor(config: AppConfig) {
    this.secret = new TextEncoder().encode(config.get('AUTH_JWT_SECRET'))
    const supabaseUrl = config.get('SUPABASE_URL')
    if (supabaseUrl) {
      this.jwks = createRemoteJWKSet(new URL('/auth/v1/.well-known/jwks.json', supabaseUrl))
    }
  }

  async verify(token: string): Promise<AuthenticatedUser> {
    let payload: JWTPayload
    try {
      const { alg } = decodeProtectedHeader(token)
      if (alg === 'HS256') {
        ;({ payload } = await jwtVerify(token, this.secret, { algorithms: ['HS256'] }))
      } else if (this.jwks) {
        ;({ payload } = await jwtVerify(token, this.jwks))
      } else {
        throw new Error(`Algoritmo ${alg} sin JWKS configurado`)
      }
    } catch {
      throw new UnauthenticatedError()
    }

    if (!payload.sub || payload.role === 'anon') throw new UnauthenticatedError()
    return { id: payload.sub, email: typeof payload.email === 'string' ? payload.email : null }
  }
}
