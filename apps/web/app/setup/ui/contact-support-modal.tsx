import { useMemo, useState } from 'react'

type ContactSupportModalProps = {
  open: boolean
  userEmail: string
  isSubmitting: boolean
  errorMessage: string
  successMessage: string
  onClose: () => void
  onSubmit: (payload: { subject: string; message: string }) => void
}

const SUBJECT_OPTIONS = [
  'Problema técnico',
  'Feedback de producto',
  'Cuenta y acceso',
  'Facturación',
  'Otro',
]

export function ContactSupportModal({
  open,
  userEmail,
  isSubmitting,
  errorMessage,
  successMessage,
  onClose,
  onSubmit,
}: ContactSupportModalProps) {
  const [subject, setSubject] = useState('Problema técnico')
  const [message, setMessage] = useState('')

  const canSubmit = useMemo(() => message.trim().length >= 10, [message])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-[rgba(10,10,10,0.45)] backdrop-blur-[2px]" onClick={onClose} />

      <div className="modal-reveal relative flex w-full max-w-xl max-h-[88vh] min-h-0 flex-col overflow-hidden rounded-[24px] border border-[var(--brand-gray-200)] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--brand-gray-100)] px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-[var(--brand-ink-900)]">Contáctanos</h3>
            <p className="typo-micro mt-1 text-[var(--brand-gray-500)]">Cuéntanos el problema y te respondemos por correo.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg text-[var(--brand-gray-500)] hover:bg-[var(--brand-light-200)]"
            aria-label="Cerrar contacto"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div className="custom-scrollbar overflow-y-auto overflow-x-hidden px-6 py-5">
          <div className="grid gap-4">
            <label className="grid gap-1.5">
              <span className="typo-label font-semibold text-[var(--brand-gray-600)]">Tu correo</span>
              <input
                value={userEmail}
                disabled
                className="w-full rounded-xl border border-[var(--brand-gray-200)] bg-[var(--brand-light-100)] px-3 py-2.5 text-[var(--brand-gray-500)]"
              />
            </label>

            <label className="grid gap-1.5">
              <span className="typo-label font-semibold text-[var(--brand-gray-600)]">Asunto</span>
              <select
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className="w-full rounded-xl border border-[var(--brand-gray-200)] bg-white px-3 py-2.5 outline-none focus:border-[var(--brand-blue-400)]"
              >
                {SUBJECT_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5">
              <span className="typo-label font-semibold text-[var(--brand-gray-600)]">Mensaje</span>
              <textarea
                rows={6}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="custom-scrollbar w-full rounded-xl border border-[var(--brand-gray-200)] px-3 py-2.5 outline-none focus:border-[var(--brand-blue-400)]"
                placeholder="Describe qué pasó, qué esperabas que ocurriera y cómo podemos ayudarte."
              />
            </label>

            {errorMessage ? <p className="text-sm font-medium text-red-600">{errorMessage}</p> : null}
            {successMessage ? <p className="text-sm font-medium text-emerald-600">{successMessage}</p> : null}
          </div>
        </div>

        <div className="border-t border-[var(--brand-gray-100)] px-6 py-4">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[var(--brand-gray-200)] px-4 py-2.5 text-sm font-semibold text-[var(--brand-gray-600)] transition-colors hover:bg-[var(--brand-light-200)]"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!canSubmit || isSubmitting}
              onClick={() => onSubmit({ subject, message: message.trim() })}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors ${
                !canSubmit || isSubmitting
                  ? 'cursor-not-allowed bg-[var(--brand-gray-300)]'
                  : 'bg-[var(--brand-blue-600)] hover:bg-[var(--brand-blue-700)]'
              }`}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar mensaje'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
