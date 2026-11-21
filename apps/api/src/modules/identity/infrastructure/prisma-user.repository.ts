import { Injectable } from '@nestjs/common'
import type { Prisma } from '@prisma/client'
import { PrismaService } from '../../../shared/infrastructure/database/prisma.service'
import type { UserRepositoryPort } from '../application/ports'
import type { AuthenticatedUser } from '../domain/authenticated-user'
import type { OnboardingAnswers } from '../domain/onboarding'

@Injectable()
export class PrismaUserRepository implements UserRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(user: AuthenticatedUser): Promise<void> {
    await this.prisma.user.upsert({
      where: { id: user.id },
      create: { id: user.id, email: user.email },
      update: { email: user.email, lastSeenAt: new Date() },
    })
  }

  async findOnboarding(userId: string) {
    const row = await this.prisma.onboardingProfile.findUnique({ where: { userId } })
    return row ? { answers: row.answers as OnboardingAnswers, completedAt: row.completedAt } : null
  }

  async saveOnboarding(userId: string, answers: OnboardingAnswers) {
    const json = answers as unknown as Prisma.InputJsonObject
    const row = await this.prisma.onboardingProfile.upsert({
      where: { userId },
      create: { userId, answers: json },
      update: { answers: json },
    })
    return { answers: row.answers as OnboardingAnswers, completedAt: row.completedAt }
  }
}
