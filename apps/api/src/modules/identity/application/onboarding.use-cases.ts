import { Inject, Injectable } from '@nestjs/common'
import { normalizeOnboarding } from '../domain/onboarding'
import { USER_REPOSITORY, type UserRepositoryPort } from './ports'

@Injectable()
export class GetOnboardingUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort) {}

  execute(userId: string) {
    return this.users.findOnboarding(userId)
  }
}

@Injectable()
export class SaveOnboardingUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort) {}

  execute(userId: string, input: Record<string, unknown>) {
    return this.users.saveOnboarding(userId, normalizeOnboarding(input))
  }
}
