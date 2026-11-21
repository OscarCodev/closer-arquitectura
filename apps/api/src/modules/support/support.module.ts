import { Module } from '@nestjs/common'
import { SendSupportContactUseCase, SUPPORT_NOTIFIER, SUPPORT_REPOSITORY } from './application/send-support-contact.use-case'
import { PrismaSupportRepository, WebhookSupportNotifier } from './infrastructure/support.adapters'
import { SupportController } from './presentation/support.controller'

@Module({
  controllers: [SupportController],
  providers: [
    SendSupportContactUseCase,
    { provide: SUPPORT_REPOSITORY, useClass: PrismaSupportRepository },
    { provide: SUPPORT_NOTIFIER, useClass: WebhookSupportNotifier },
  ],
})
export class SupportModule {}
