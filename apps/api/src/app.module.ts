import { Module } from '@nestjs/common'
import { HealthModule } from './modules/health/health.module'
import { IdentityModule } from './modules/identity/identity.module'
import { PracticeModule } from './modules/practice/practice.module'
import { ProfilesModule } from './modules/profiles/profiles.module'
import { SupportModule } from './modules/support/support.module'
import { SharedModule } from './shared/shared.module'

/**
 * Monolito modular (ADR-001): cada módulo de negocio tiene sus capas
 * domain → application → infrastructure / presentation (ADR-002).
 */
@Module({
  imports: [SharedModule, HealthModule, IdentityModule, ProfilesModule, PracticeModule, SupportModule],
})
export class AppModule {}
