import { getPlanLimits, type SubscriptionPlan, SUPPORT_EMAIL } from '@/lib/billing/plan'

type UpgradePlanModalProps = {
  open: boolean
  currentPlan: SubscriptionPlan
  reason: 'attempts' | 'autogenerations' | 'minutes'
  onClose: () => void
}

function reasonCopy(reason: UpgradePlanModalProps['reason']) {
  if (reason === 'autogenerations') {
    return {
      eyebrow: 'Autogeneraciones agotadas',
      title: 'Llegaste al límite mensual de autogeneraciones',
      description: 'Con Pro puedes crear más escenarios nuevos cada mes y seguir practicando sin depender de plantillas manuales.',
    }
  }

  if (reason === 'minutes') {
    return {
      eyebrow: 'Tiempo de llamada agotado',
      title: 'Tu sesión alcanzó el límite permitido',
      description: 'El plan Pro amplía el tiempo disponible por sesión para que puedas practicar llamadas más largas y completas.',
    }
  }

  return {
    eyebrow: 'Intentos agotados',
    title: 'Llegaste al límite mensual de simulaciones',
    description: 'Con Pro tienes más margen para repetir, corregir y medir progreso real durante el mes.',
  }
}

export function UpgradePlanModal({ open, currentPlan, reason, onClose }: UpgradePlanModalProps) {
  if (!open) return null

  const freeLimits = getPlanLimits('free')
  const proLimits = getPlanLimits('pro')
  const copy = reasonCopy(reason)

  const openMail = () => {
    const subject = encodeURIComponent('[Closer] Quiero actualizar a Pro')
    const body = encodeURIComponent(
      `Hola, quiero actualizar mi cuenta al plan Pro.\n\nPlan actual: ${currentPlan}\nMotivo: ${copy.title}\n\nGracias.`,
    )
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-[rgba(10,10,10,0.55)] backdrop-blur-[2px]" onClick={onClose} />

      <section className="relative w-full max-w-4xl overflow-hidden rounded-[28px] border border-[var(--brand-gray-200)] bg-white shadow-2xl">
        <div className="border-b border-[var(--brand-gray-100)] px-6 py-5 sm:px-8">
          <p className="typo-micro font-semibold uppercase tracking-[0.18em] text-[var(--brand-blue-600)]">{copy.eyebrow}</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-2xl font-bold text-[var(--brand-ink-900)]">{copy.title}</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--brand-gray-600)]">{copy.description}</p>
            </div>
            <div className="rounded-full bg-[var(--brand-light-200)] px-3 py-1.5 text-sm font-semibold text-[var(--brand-gray-700)]">
              Plan actual: {currentPlan === 'pro' ? 'Pro' : 'Gratis'}
            </div>
          </div>
        </div>

        <div className="grid gap-4 px-6 py-6 sm:grid-cols-2 sm:px-8">
          <article className="rounded-[24px] border border-[var(--brand-gray-200)] bg-[var(--brand-light-50)] p-5">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-bold text-[var(--brand-ink-900)]">Gratis</h4>
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[var(--brand-gray-600)]">Limitado</span>
            </div>
            <p className="mt-2 text-sm text-[var(--brand-gray-600)]">Ideal para probar el producto y entender el flujo principal.</p>
            <ul className="mt-4 space-y-2 text-sm text-[var(--brand-gray-700)]">
              <li>Tiempo de llamada: {freeLimits.sessionMinutes} min/sesión</li>
              <li>Intentos: {freeLimits.simulationsPerMonth} al mes</li>
              <li>Autogeneraciones: {freeLimits.autogenerationsPerMonth} al mes</li>
            </ul>
          </article>

          <article className="rounded-[24px] border border-[var(--brand-blue-200)] bg-[linear-gradient(180deg,rgba(0,87,255,0.08),rgba(255,255,255,1))] p-5 shadow-[0_18px_50px_rgba(0,87,255,0.08)]">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-bold text-[var(--brand-ink-900)]">Pro</h4>
              <span className="rounded-full bg-[var(--brand-blue-600)] px-2.5 py-1 text-xs font-semibold text-white">Recomendado</span>
            </div>
            <p className="mt-2 text-sm text-[var(--brand-gray-600)]">Pensado para practicar de forma continua y con más volumen.</p>
            <ul className="mt-4 space-y-2 text-sm text-[var(--brand-gray-700)]">
              <li>Tiempo de llamada: {proLimits.sessionMinutes} min/sesión</li>
              <li>Intentos: {proLimits.simulationsPerMonth} al mes</li>
              <li>Autogeneraciones: {proLimits.autogenerationsPerMonth} al mes</li>
            </ul>
          </article>
        </div>

        <div className="border-t border-[var(--brand-gray-100)] px-6 py-5 sm:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--brand-ink-900)]">Escríbenos para activar Pro</p>
              <p className="text-sm text-[var(--brand-gray-600)]">{SUPPORT_EMAIL}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[var(--brand-gray-200)] px-4 py-2.5 text-sm font-semibold text-[var(--brand-gray-600)] transition-colors hover:bg-[var(--brand-light-200)]"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={openMail}
                className="rounded-xl bg-[var(--brand-blue-600)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-blue-700)]"
              >
                Abrir correo
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
