import { Injectable } from '@nestjs/common'
import { AppConfig } from '../../../shared/infrastructure/config/app-config.service'
import { PrismaService } from '../../../shared/infrastructure/database/prisma.service'
import type { AuthenticatedUser } from '../../identity/domain/authenticated-user'
import type { SupportNotifierPort, SupportRepositoryPort } from '../application/send-support-contact.use-case'
import type { SupportContact } from '../domain/support-contact'

@Injectable()
export class PrismaSupportRepository implements SupportRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async save(userId: string, contact: SupportContact) {
    await this.prisma.supportContact.create({ data: { userId, ...contact } })
  }
}

@Injectable()
export class WebhookSupportNotifier implements SupportNotifierPort {
  constructor(private readonly config: AppConfig) {}

  async notify(user: AuthenticatedUser, contact: SupportContact) {
    const url = this.config.get('SUPPORT_WEBHOOK_URL')
    if (!url) return false
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'closer', type: 'support-contact', createdAt: new Date().toISOString(), user, contact }),
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return true
  }
}
