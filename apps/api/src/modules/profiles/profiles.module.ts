import { Module } from '@nestjs/common'
import { PROFILE_REPOSITORY } from './application/ports'
import {
  CreateProfileUseCase,
  DeleteProfileUseCase,
  ListProfilesUseCase,
  UpdateProfileUseCase,
} from './application/profiles.use-cases'
import { PrismaProfileRepository } from './infrastructure/prisma-profile.repository'
import { ProfilesController } from './presentation/profiles.controller'

/** Biblioteca de prospectos: CRUD por entidad (reemplaza el PUT de estado completo del MVP). */
@Module({
  controllers: [ProfilesController],
  providers: [
    ListProfilesUseCase,
    CreateProfileUseCase,
    UpdateProfileUseCase,
    DeleteProfileUseCase,
    { provide: PROFILE_REPOSITORY, useClass: PrismaProfileRepository },
  ],
})
export class ProfilesModule {}
