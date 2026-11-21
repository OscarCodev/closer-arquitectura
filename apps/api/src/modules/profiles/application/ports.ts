import type { ProspectProfile, ProspectProfileInput } from '../domain/prospect-profile'

export interface ProfileRepositoryPort {
  listByUser(userId: string): Promise<ProspectProfile[]>
  findById(userId: string, id: string): Promise<ProspectProfile | null>
  create(userId: string, input: ProspectProfileInput): Promise<ProspectProfile>
  update(userId: string, id: string, input: ProspectProfileInput): Promise<ProspectProfile | null>
  delete(userId: string, id: string): Promise<boolean>
}

export const PROFILE_REPOSITORY = Symbol('PROFILE_REPOSITORY')
