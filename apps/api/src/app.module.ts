import { Module } from '@nestjs/common'
import { HealthModule } from './modules/health/health.module'
import { IdentityModule } from './modules/identity/identity.module'
import { SharedModule } from './shared/shared.module'

/**
 * Monolito modular (ADR-001): cada módulo de negocio tiene sus capas
 * domain → application → infrastructure / presentation (ADR-002).
 */
@Module({
  imports: [SharedModule, HealthModule, IdentityModule],
})
export class AppModule {}
