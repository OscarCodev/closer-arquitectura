'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { routes } from '@/lib/routes'
import { useAuthStore } from '@/stores/use-auth-store'
import { useActiveSessionStore } from '@/stores/use-active-session-store'
import { UpgradePlanModal } from '@/components/billing/upgrade-plan-modal'
import { ResultsDashboard } from '@/app/setup/ui/results-dashboard'
import { SetupLoadingScreen } from '@/app/setup/ui/setup-loading-screen'
import { startPractice } from '@/lib/practice/start-practice'
import { useSimulationStore } from '@/stores/use-simulation-store'

const noopSubscribe = () => () => {}

export default function SimulationResultPage() {
  const router = useRouter()
  const { user, isLoading, initialize, billingStatus } = useAuthStore()
  const { activeSession } = useActiveSessionStore()
  const [isRetryStarting, setIsRetryStarting] = useState(false)
  const [retryError, setRetryError] = useState<string | null>(null)
  // false en el servidor y durante la hidratación; true en el cliente (el resultado vive en localStorage).
  const hasMounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  )
  const [upgradeModalReason, setUpgradeModalReason] = useState<'attempts' | 'autogenerations' | 'minutes' | null>(null)
  const retry = useRef<{ started: Promise<boolean> | null; loaderDone: boolean }>({ started: null, loaderDone: false })

  const goToSimulationWhenReady = useCallback(async () => {
    const ok = await retry.current.started
    if (!retry.current.loaderDone) return
    if (ok) {
      router.push('/simulation')
    } else {
      setRetryError(useSimulationStore.getState().errorMessage ?? 'No se pudo iniciar el reintento.')
      setIsRetryStarting(false)
    }
  }, [router])

  // El servidor reutiliza el escenario de la sesión: el nuevo intento se suma como n+1.
  const handleRetryFromResults = useCallback(() => {
    if (!activeSession) return
    setRetryError(null)
    retry.current = { started: startPractice({ sessionId: activeSession.id }), loaderDone: false }
    void retry.current.started?.then(() => goToSimulationWhenReady())
    setIsRetryStarting(true)
  }, [activeSession, goToSimulationWhenReady])

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (!isLoading && !user) router.replace(routes.login)
  }, [isLoading, user, router])

  if (!hasMounted) {
    return (
      <main className="grid h-[100dvh] w-screen place-items-center bg-[var(--brand-light-50)]">
        <div className="text-center">
          <p className="typo-micro font-semibold uppercase tracking-[0.14em] text-[var(--brand-gray-500)]">
            Preparando resultados
          </p>
          <h2 className="typo-page-title mt-2 font-semibold text-[var(--brand-ink-900)]">
            Cargando análisis
          </h2>
        </div>
      </main>
    )
  }

  if (isRetryStarting) {
    return (
      <main className="m-0 flex h-[100dvh] w-screen flex-col overflow-hidden bg-[var(--brand-light-50)] p-0">
        <SetupLoadingScreen
          onComplete={() => {
            retry.current.loaderDone = true
            void goToSimulationWhenReady()
          }}
        />
      </main>
    )
  }

  if (!activeSession) {
    return (
      <main className="grid h-[100dvh] w-screen place-items-center bg-[var(--brand-light-50)] px-6 text-center">
        <div>
          <p className="typo-micro font-semibold uppercase tracking-[0.14em] text-[var(--brand-gray-500)]">
            Sin sesión activa
          </p>
          <h2 className="typo-page-title mt-2 font-semibold text-[var(--brand-ink-900)]">
            No encontré un resultado para mostrar
          </h2>
          <button
            type="button"
            onClick={() => router.push('/setup')}
            className="mt-6 rounded-xl bg-[var(--brand-ink-900)] px-5 py-3 font-semibold text-white"
          >
            Ir al menú
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="flex h-[100dvh] w-screen flex-col overflow-hidden bg-[var(--brand-light-50)] selection:bg-[var(--brand-blue-100)] selection:text-[var(--brand-blue-700)]">
      {retryError && (
        <p role="alert" className="typo-body border-b border-red-200 bg-red-50 px-6 py-3 text-center text-red-600">
          {retryError}
        </p>
      )}
      <ResultsDashboard
        recentSession={activeSession}
        onBack={() => router.push('/setup')}
        onRetry={handleRetryFromResults}
      />

      <UpgradePlanModal
        open={upgradeModalReason !== null}
        currentPlan={billingStatus?.plan || 'free'}
        reason={upgradeModalReason || 'minutes'}
        onClose={() => setUpgradeModalReason(null)}
      />
    </main>
  )
}
