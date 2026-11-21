import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../shared/infrastructure/database/prisma.service'
import type { ProfileRepositoryPort } from '../application/ports'
import type { ProspectProfile, ProspectProfileInput } from '../domain/prospect-profile'

const MAX_PROFILES_PER_USER = 200

@Injectable()
export class PrismaProfileRepository implements ProfileRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  listByUser(userId: string): Promise<ProspectProfile[]> {
    return this.prisma.prospectProfile.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: MAX_PROFILES_PER_USER,
      select: SELECT,
    })
  }

  findById(userId: string, id: string): Promise<ProspectProfile | null> {
    return this.prisma.prospectProfile.findFirst({ where: { id, userId }, select: SELECT })
  }

  create(userId: string, input: ProspectProfileInput): Promise<ProspectProfile> {
    return this.prisma.prospectProfile.create({ data: { ...input, userId }, select: SELECT })
  }

  async update(userId: string, id: string, input: ProspectProfileInput): Promise<ProspectProfile | null> {
    // updateMany filtra por dueño: un usuario nunca modifica el prospecto de otro.
    const { count } = await this.prisma.prospectProfile.updateMany({ where: { id, userId }, data: input })
    return count === 0 ? null : this.findById(userId, id)
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const { count } = await this.prisma.prospectProfile.deleteMany({ where: { id, userId } })
    return count > 0
  }
}

const SELECT = {
  id: true,
  name: true,
  prospect: true,
  context: true,
  personName: true,
  roleCompany: true,
  createdAt: true,
  updatedAt: true,
} as const
