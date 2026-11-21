import { ValidationError } from '../../../shared/domain/errors'
import { clampText } from '../../../shared/domain/text'

export type SupportContact = { subject: string; message: string; pagePath: string | null }

export function buildSupportContact(raw: { subject?: unknown; message?: unknown; pagePath?: unknown }): SupportContact {
  const subject = clampText(raw.subject, 200)
  const message = clampText(raw.message, 5000)
  if (!subject) throw new ValidationError('El asunto es obligatorio.')
  if (message.length < 10) throw new ValidationError('El mensaje debe tener al menos 10 caracteres.')
  return { subject, message, pagePath: clampText(raw.pagePath, 300) || null }
}
