import { Inject, Injectable, Logger } from '@nestjs/common'
import type { AuthenticatedUser } from '../../identity/domain/authenticated-user'
import { buildSupportContact, type SupportContact } from '../domain/support-contact'

export interface SupportRepositoryPort {
  save(userId: string, contact: SupportContact): Promise<void>
}
export const SUPPORT_REPOSITORY = Symbol('SUPPORT_REPOSITORY')

export interface SupportNotifierPort {
  /** Devuelve false si no hay canal externo configurado. */
  notify(user: AuthenticatedUser, contact: SupportContact): Promise<boolean>
}
export const SUPPORT_NOTIFIER = Symbol('SUPPORT_NOTIFIER')

/** Guarda siempre el mensaje (trazabilidad) y, si hay webhook configurado, lo reenvía. */
@Injectable()
export class SendSupportContactUseCase {
  private readonly logger = new Logger(SendSupportContactUseCase.name)

  constructor(
    @Inject(SUPPORT_REPOSITORY) private readonly repo: SupportRepositoryPort,
    @Inject(SUPPORT_NOTIFIER) private readonly notifier: SupportNotifierPort,
  ) {}

  async execute(user: AuthenticatedUser, raw: Record<string, unknown>): Promise<{ delivered: boolean }> {
    const contact = buildSupportContact(raw)
    await this.repo.save(user.id, contact)
    try {
      return { delivered: await this.notifier.notify(user, contact) }
    } catch (error) {
      this.logger.warn(`Webhook de soporte falló: ${(error as Error).message}`)
      return { delivered: false }
    }
  }
}
