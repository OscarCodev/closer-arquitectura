import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { RateLimitGuard } from '../../shared/presentation/rate-limit.guard'
import { AuthenticateUseCase } from './application/authenticate.use-case'
import { GetOnboardingUseCase, SaveOnboardingUseCase } from './application/onboarding.use-cases'
import { TOKEN_VERIFIER, USER_REPOSITORY } from './application/ports'
import { PrismaUserRepository } from './infrastructure/prisma-user.repository'
import { SupabaseJwtVerifier } from './infrastructure/supabase-jwt.verifier'
import { AuthGuard } from './presentation/auth.guard'
import { DevAuthController } from './presentation/dev-auth.controller'
import { MeController } from './presentation/me.controller'

/** Módulo de identidad: autenticación (Supabase JWT), usuario actual y onboarding. */
@Module({
  controllers: [MeController, DevAuthController],
  providers: [
    AuthenticateUseCase,
    GetOnboardingUseCase,
    SaveOnboardingUseCase,
    { provide: TOKEN_VERIFIER, useClass: SupabaseJwtVerifier },
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    // Orden: primero autenticación, después rate limit por usuario.
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RateLimitGuard },
  ],
})
export class IdentityModule {}
