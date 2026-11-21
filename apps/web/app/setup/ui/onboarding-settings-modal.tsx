import { useEffect, useMemo, useState } from 'react'
import type { OnboardingProfile } from '../types/setup-types'

type OnboardingSettingsModalProps = {
  open: boolean
  initialProfile: OnboardingProfile
  isSaving: boolean
  errorMessage: string
  onClose: () => void
  onSave: (profile: OnboardingProfile) => void
}

const roleOptions = [
  'Prospecto o captador',
  'Vendedor o closer',
  'Líder o gerente de ventas',
  'Dueño o emprendedor',
  'Profesional independiente',
  'Otro',
]

const industryOptions = [
  'Tecnología / Software',
  'Salud y bienestar',
  'Educación y formación',
  'Finanzas y seguros',
  'Inmobiliaria',
  'Comercio y retail',
  'Industria y manufactura',
  'Servicios a empresas (B2B)',
  'Alimentación / Consumo masivo',
  'Otro',
]

const sellsToOptions = [
  'Personas y consumidores finales',
  'Dueños y emprendedores',
  'Pymes con equipo directivo',
  'Corporativos y grandes empresas',
  'Gobierno e instituciones públicas',
  'Otro',
]

const experienceOptions = ['Estoy empezando', '1-3 años', '4-7 años', '8+ años']

const mainChallengeOptions = [
  'Conseguir más prospectos o contactos',
  'Lograr que me escuchen en el primer contacto',
  'Transmitir bien el valor de lo que vendo',
  'Manejar objeciones de precio',
  'Cerrar y conseguir el compromiso',
  'Hacer seguimiento sin parecer pesado',
  'Superar el miedo al rechazo',
  'Otro',
]

const emptyProfile: OnboardingProfile = {
  firstName: '',
  role: '',
  roleOtherDetail: '',
  industry: '',
  industryOtherDetail: '',
  sellsTo: '',
  sellsToOtherDetail: '',
  experienceLevel: '',
  mainChallenge: '',
  mainChallengeOtherDetail: '',
  weeklyCalls: '',
  goalWithCloser: '',
  companyName: '',
  phone: '',
}

export function OnboardingSettingsModal({
  open,
  initialProfile,
  isSaving,
  errorMessage,
  onClose,
  onSave,
}: OnboardingSettingsModalProps) {
  const [draft, setDraft] = useState<OnboardingProfile>(initialProfile || emptyProfile)

  useEffect(() => {
    if (open) {
      setDraft(initialProfile || emptyProfile)
    }
  }, [open, initialProfile])

  const canSave = useMemo(() => {
    const roleOk = draft.role !== 'Otro' || draft.roleOtherDetail.trim().length > 1
    const industryOk = draft.industry !== 'Otro' || draft.industryOtherDetail.trim().length > 1
    const sellsToOk = draft.sellsTo !== 'Otro' || draft.sellsToOtherDetail.trim().length > 1
    const challengeOk = draft.mainChallenge !== 'Otro' || draft.mainChallengeOtherDetail.trim().length > 1

    return Boolean(
      draft.experienceLevel.trim() &&
        draft.role.trim() &&
        draft.industry.trim() &&
        draft.sellsTo.trim() &&
        draft.mainChallenge.trim() &&
        roleOk &&
        industryOk &&
        sellsToOk &&
        challengeOk,
    )
  }, [draft])

  if (!open) return null

  const update = (field: keyof OnboardingProfile, value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-[rgba(10,10,10,0.45)] backdrop-blur-[2px]" onClick={onClose} />

      <div className="modal-reveal relative flex w-full max-w-3xl max-h-[88vh] min-h-0 flex-col overflow-hidden rounded-[24px] border border-[var(--brand-gray-200)] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--brand-gray-100)] px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-[var(--brand-ink-900)]">Configuracion de Onboarding</h3>
            <p className="typo-micro mt-1 text-[var(--brand-gray-500)]">Edita tus selecciones para personalizar mejor simulaciones y feedback.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg text-[var(--brand-gray-500)] hover:bg-[var(--brand-light-200)]"
            aria-label="Cerrar configuracion"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto overflow-x-hidden px-6 py-5">
          <div className="grid min-w-0 gap-4 lg:grid-cols-2">
          <label className="grid min-w-0 gap-1.5">
            <span className="typo-label font-semibold text-[var(--brand-gray-600)]">Nombre</span>
            <input
              value={draft.firstName}
              onChange={(event) => update('firstName', event.target.value)}
              className="w-full min-w-0 rounded-xl border border-[var(--brand-gray-200)] px-3 py-2.5 outline-none focus:border-[var(--brand-blue-400)]"
              placeholder="Tu nombre"
            />
          </label>

          <label className="grid min-w-0 gap-1.5">
            <span className="typo-label font-semibold text-[var(--brand-gray-600)]">Experiencia en ventas</span>
            <select
              value={draft.experienceLevel}
              onChange={(event) => update('experienceLevel', event.target.value)}
              className="w-full min-w-0 rounded-xl border border-[var(--brand-gray-200)] bg-white px-3 py-2.5 outline-none focus:border-[var(--brand-blue-400)]"
            >
              <option value="">Selecciona una opcion</option>
              {experienceOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>

          <label className="grid min-w-0 gap-1.5">
            <span className="typo-label font-semibold text-[var(--brand-gray-600)]">Rol</span>
            <select
              value={draft.role}
              onChange={(event) => update('role', event.target.value)}
              className="w-full min-w-0 rounded-xl border border-[var(--brand-gray-200)] bg-white px-3 py-2.5 outline-none focus:border-[var(--brand-blue-400)]"
            >
              <option value="">Selecciona una opcion</option>
              {roleOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>

          {draft.role === 'Otro' && (
            <label className="grid min-w-0 gap-1.5 lg:col-span-2">
              <span className="typo-label font-semibold text-[var(--brand-gray-600)]">Detalle de rol</span>
              <input
                value={draft.roleOtherDetail}
                onChange={(event) => update('roleOtherDetail', event.target.value)}
                className="w-full min-w-0 rounded-xl border border-[var(--brand-gray-200)] px-3 py-2.5 outline-none focus:border-[var(--brand-blue-400)]"
                placeholder="Describe tu rol"
              />
            </label>
          )}

          <label className="grid min-w-0 gap-1.5">
            <span className="typo-label font-semibold text-[var(--brand-gray-600)]">Industria</span>
            <select
              value={draft.industry}
              onChange={(event) => update('industry', event.target.value)}
              className="w-full min-w-0 rounded-xl border border-[var(--brand-gray-200)] bg-white px-3 py-2.5 outline-none focus:border-[var(--brand-blue-400)]"
            >
              <option value="">Selecciona una opcion</option>
              {industryOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>

          <label className="grid min-w-0 gap-1.5">
            <span className="typo-label font-semibold text-[var(--brand-gray-600)]">Cliente tipico</span>
            <select
              value={draft.sellsTo}
              onChange={(event) => update('sellsTo', event.target.value)}
              className="w-full min-w-0 rounded-xl border border-[var(--brand-gray-200)] bg-white px-3 py-2.5 outline-none focus:border-[var(--brand-blue-400)]"
            >
              <option value="">Selecciona una opcion</option>
              {sellsToOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>

          {draft.industry === 'Otro' && (
            <label className="grid min-w-0 gap-1.5 lg:col-span-2">
              <span className="typo-label font-semibold text-[var(--brand-gray-600)]">Detalle de industria</span>
              <input
                value={draft.industryOtherDetail}
                onChange={(event) => update('industryOtherDetail', event.target.value)}
                className="w-full min-w-0 rounded-xl border border-[var(--brand-gray-200)] px-3 py-2.5 outline-none focus:border-[var(--brand-blue-400)]"
                placeholder="Describe tu industria"
              />
            </label>
          )}

          {draft.sellsTo === 'Otro' && (
            <label className="grid min-w-0 gap-1.5 lg:col-span-2">
              <span className="typo-label font-semibold text-[var(--brand-gray-600)]">Detalle de cliente</span>
              <input
                value={draft.sellsToOtherDetail}
                onChange={(event) => update('sellsToOtherDetail', event.target.value)}
                className="w-full min-w-0 rounded-xl border border-[var(--brand-gray-200)] px-3 py-2.5 outline-none focus:border-[var(--brand-blue-400)]"
                placeholder="Describe a quien vendes"
              />
            </label>
          )}

          <label className="grid min-w-0 gap-1.5">
            <span className="typo-label font-semibold text-[var(--brand-gray-600)]">Reto principal</span>
            <select
              value={draft.mainChallenge}
              onChange={(event) => update('mainChallenge', event.target.value)}
              className="w-full min-w-0 rounded-xl border border-[var(--brand-gray-200)] bg-white px-3 py-2.5 outline-none focus:border-[var(--brand-blue-400)]"
            >
              <option value="">Selecciona una opcion</option>
              {mainChallengeOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>

          {draft.mainChallenge === 'Otro' && (
            <label className="grid min-w-0 gap-1.5 lg:col-span-2">
              <span className="typo-label font-semibold text-[var(--brand-gray-600)]">Detalle del reto</span>
              <input
                value={draft.mainChallengeOtherDetail}
                onChange={(event) => update('mainChallengeOtherDetail', event.target.value)}
                className="w-full min-w-0 rounded-xl border border-[var(--brand-gray-200)] px-3 py-2.5 outline-none focus:border-[var(--brand-blue-400)]"
                placeholder="Describe tu reto"
              />
            </label>
          )}
          </div>
        </div>

        <div className="border-t border-[var(--brand-gray-100)] px-6 py-4">
          {errorMessage ? (
            <p className="mb-3 text-sm font-medium text-red-600">{errorMessage}</p>
          ) : null}
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
              disabled={!canSave || isSaving}
              onClick={() => onSave(draft)}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors ${
                !canSave || isSaving
                  ? 'cursor-not-allowed bg-[var(--brand-gray-300)]'
                  : 'bg-[var(--brand-blue-600)] hover:bg-[var(--brand-blue-700)]'
              }`}
            >
              {isSaving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
