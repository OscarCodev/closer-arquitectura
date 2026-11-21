'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { routes } from '@/lib/routes'
import { useAuthStore } from '@/stores/use-auth-store'
import { useActiveSessionStore } from '@/stores/use-active-session-store'
import { UpgradePlanModal } from '@/components/billing/upgrade-plan-modal'
import { ResultsDashboard } from '@/app/setup/ui/results-dashboard'
import { SetupLoadingScreen } from '@/app/setup/ui/setup-loading-screen'
import { startGeminiSessionInBackground } from '@/lib/gemini/start-practice-session'
import type { PracticeConfig } from '@/stores/use-active-session-store'

export default function SimulationResultPage() {
  const router = useRouter()
  const { user, isLoading, initialize, billingStatus } = useAuthStore()
  const { activeSession, setPracticeConfig, updatePracticeConfig } = useActiveSessionStore()
  const [isRetryStarting, setIsRetryStarting] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)
  const [upgradeModalReason, setUpgradeModalReason] = useState<'attempts' | 'autogenerations' | 'minutes' | null>(null)

  const handleRetryFromResults = useCallback(() => {
    if (!activeSession) return

    const latestContext = activeSession.simulations[activeSession.simulations.length - 1]?.context
    const retryConfig: PracticeConfig = {
      context: latestContext?.salesContext || activeSession.context,
      prospect: latestContext?.prospectDescription || activeSession.prospect,
      prospectName: latestContext?.prospectName || activeSession.prospect || 'Prospecto',
      prospectRole: latestContext?.prospectRole || '',
      prospectCompany: latestContext?.prospectCompany || '',
      prospectGender: 'unknown',
      voiceName: activeSession.voiceName,
      advancedSelections: activeSession.advancedSelections || {
        modo: 'Ciclo Completo',
        tono: 'Perfil Real',
      },
    }

    setPracticeConfig(retryConfig)
    setIsRetryStarting(true)
    void startGeminiSessionInBackground(retryConfig, updatePracticeConfig, () => setUpgradeModalReason('attempts'))
  }, [activeSession, setPracticeConfig, updatePracticeConfig])

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    setHasMounted(true)
    try {
      const reason = window.sessionStorage.getItem('closer.upgrade.reason')
      if (reason === 'attempts' || reason === 'autogenerations' || reason === 'minutes') {
        setUpgradeModalReason(reason)
        window.sessionStorage.removeItem('closer.upgrade.reason')
      }
    } catch {
      // ignore storage failures
    }
  }, [])

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
        <SetupLoadingScreen onComplete={() => router.push('/simulation')} />
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
