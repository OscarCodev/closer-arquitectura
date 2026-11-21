'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppIcon } from '@/components/brand/app-icon'
import { UpgradePlanModal } from '@/components/billing/upgrade-plan-modal'
import { useActiveSessionStore } from '@/stores/use-active-session-store'
import { useSimulationStore } from '@/stores/use-simulation-store'
import { startPractice, type StartPracticeInput } from '@/lib/practice/start-practice'
import { useAdvancedOptions } from './state/use-advanced-options'
import { getInitialTabFromQuery } from './state/setup-initializers'
import { usePracticeForm } from './state/use-practice-form'
import { useProfileManager } from './state/use-profile-manager'
import { useSessionManager } from './state/use-session-manager'
import { useSetupAuth } from './state/use-setup-auth'
import { useSetupModals } from './state/use-setup-modals'
import type { SavedProfile, TabType } from './types/setup-types'
import { ProfilesLibraryTab } from './ui/profiles-library-tab'
import { ProgressDashboard } from './ui/progress-dashboard'
import { ResultsDashboard } from './ui/results-dashboard'
import { SessionDeleteModal } from './ui/session-delete-modal'
import { SetupLoadingScreen } from './ui/setup-loading-screen'
import { SetupPracticeTab } from './ui/setup-practice-tab'
import { SetupSidebar } from './ui/setup-sidebar'
import { OnboardingSettingsModal } from './ui/onboarding-settings-modal'
import { ContactSupportModal } from './ui/contact-support-modal'
import { SignOutConfirmModal } from './ui/signout-confirm-modal'

export default function SetupPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>(getInitialTabFromQuery)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<SavedProfile | null>(null)
  const [upgradeModalReason, setUpgradeModalReason] = useState<'attempts' | 'autogenerations' | 'minutes' | null>(null)
  const [practiceError, setPracticeError] = useState<string | null>(null)
  /** La pantalla de carga y el inicio en el servidor corren en paralelo; se navega cuando ambos terminan. */
  const launch = useRef<{ started: Promise<boolean> | null; loaderDone: boolean }>({ started: null, loaderDone: false })

  const { authLoading, user, onboardingProfile, billingStatus, refreshOnboardingProfile, handleSignOut } = useSetupAuth()
  const sessions = useSessionManager({ userId: user?.id, authReady: !authLoading })
  const profiles = useProfileManager({ userId: user?.id, authReady: !authLoading })
  const advanced = useAdvancedOptions()
  const closeUpgradeModal = () => setUpgradeModalReason(null)

  const form = usePracticeForm()
  const { clearActiveSession } = useActiveSessionStore()
  const selectedRecentSession = sessions.recentSessions[sessions.selectedRecentSessionIdx]

  const modals = useSetupModals({ refreshOnboardingProfile, handleSignOut })

  const handleSelectProfile = (profile: SavedProfile) => {
    form.setProspect(profile.prospect)
    if (profile.context) form.setContext(profile.context)
    setSelectedProfile(profile)
    profiles.onCloseProfileSelector()
  }

  const goToSimulationWhenReady = async () => {
    const ok = await launch.current.started
    if (!launch.current.loaderDone) return
    if (ok) {
      router.push('/simulation')
    } else {
      setPracticeError(useSimulationStore.getState().errorMessage ?? 'No se pudo iniciar la práctica.')
      form.cancelPractice()
    }
  }

  const launchPractice = (input: StartPracticeInput) => {
    setPracticeError(null)
    clearActiveSession()
    launch.current = { started: startPractice(input), loaderDone: false }
    void launch.current.started?.then(() => goToSimulationWhenReady())
    form.startPractice()
  }

  const handleStartPractice = () => {
    if (!form.isFormValid) return

    let prospectName = ''
    let prospectRole = ''
    let prospectCompany = ''

    if (selectedProfile) {
      // Prospecto elegido de la biblioteca: se envían sus datos ya estructurados.
      prospectName = selectedProfile.personName || ''
      const [role, ...company] = (selectedProfile.roleCompany ?? '').split(' en ')
      prospectRole = role?.trim() ?? ''
      prospectCompany = company.join(' en ').trim()
    } else {
      // Texto libre: se guarda en la biblioteca (el servidor extrae nombre y cargo).
      profiles.onCloseProfileSelector()
      void profiles.createProfile({
        name: form.getProfileName(form.prospect, profiles.savedProfiles.length),
        prospect: form.prospect.trim(),
        context: form.context.trim(),
      })
    }

    launchPractice({
      context: form.context.trim(),
      prospect: form.prospect.trim(),
      prospectName: prospectName || undefined,
      prospectRole: prospectRole || undefined,
      prospectCompany: prospectCompany || undefined,
      advancedSelections: advanced.advancedSelections,
    })
  }

  // Reintento: el servidor reutiliza el escenario guardado, los intentos se acumulan (1/n, 2/n…).
  const handleRetryFromResults = () => {
    if (!selectedRecentSession) return
    setSelectedProfile(null)
    launchPractice({ sessionId: selectedRecentSession.id })
  }

  if (form.isStartingPractice) {
    return (
      <main className="m-0 flex h-[100dvh] w-screen flex-col overflow-hidden bg-[var(--brand-light-50)] p-0">
        <SetupLoadingScreen
          onComplete={() => {
            launch.current.loaderDone = true
            void goToSimulationWhenReady()
          }}
        />
      </main>
    )
  }

  return (
    <div className="relative flex h-[100dvh] overflow-hidden bg-[var(--brand-light-100)] text-[var(--brand-ink-900)]">
      <button
        type="button"
        aria-label="Cerrar menu"
        onClick={() => setSidebarOpen(false)}
        className={`fixed inset-0 z-20 bg-[rgba(10,10,10,0.35)] transition-opacity md:hidden ${
          sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <SetupSidebar
        sidebarOpen={sidebarOpen}
        activeTab={activeTab}
        visibleRecentSessions={sessions.visibleRecentSessions}
        isRecentSessionsHydrating={sessions.sessionsHydrating}
        hasMoreRecentSessions={sessions.hasMoreRecentSessions}
        editingSessionId={sessions.editingSessionId}
        editingSessionName={sessions.editingSessionName}
        openSessionMenuId={sessions.openSessionMenuId}
        onSelectTab={setActiveTab}
        selectedRecentSessionIdx={sessions.selectedRecentSessionIdx}
        onSelectRecentSession={(idx) => {
          sessions.setSelectedRecentSessionIdx(idx)
          setActiveTab('resultado')
        }}
        onStartEditingSession={sessions.onStartEditingSession}
        onChangeEditingSessionName={sessions.onChangeEditingSessionName}
        onSaveEditingSessionName={sessions.onSaveEditingSessionName}
        onCancelEditingSession={sessions.onCancelEditingSession}
        onToggleSessionMenu={sessions.onToggleSessionMenu}
        onRequestDeleteSession={sessions.onRequestDeleteSession}
        onLoadMoreRecentSessions={sessions.loadMoreRecentSessions}
        onOpenSettings={modals.openSettings}
        onOpenUpgradePlan={() => setUpgradeModalReason('attempts')}
        onOpenContact={modals.openContact}
        onSignOut={modals.openSignOutConfirm}
        userName={onboardingProfile?.firstName || user?.email?.split('@')[0] || 'Tu cuenta'}
        userEmail={user?.email || ''}
        billingPlan={billingStatus?.plan || 'free'}
      />

      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex h-14 items-center justify-between border-b border-[var(--color-border)] bg-[var(--brand-light-50)] px-4 md:hidden">
          <div className="flex items-center gap-2">
            <AppIcon size={24} />
            <span className="typo-body font-semibold">Closer</span>
          </div>
          <button
            type="button"
            aria-label="Abrir menu"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg px-2 py-1.5 text-[var(--brand-gray-600)] hover:bg-[var(--brand-light-200)]"
          >
            ☰
          </button>
        </div>

        {authLoading && (
          <section className="grid flex-1 place-items-center bg-[var(--brand-light-50)] px-6 py-12">
            <div className="text-center">
              <p className="typo-micro font-semibold uppercase tracking-[0.14em] text-[var(--brand-gray-500)]">
                Preparando tu espacio
              </p>
              <h2 className="typo-page-title mt-2 font-semibold text-[var(--brand-ink-900)]">
                Cargando perfil
              </h2>
            </div>
          </section>
        )}

        {!authLoading && activeTab === 'setup' && (
          <SetupPracticeTab
            context={form.context}
            prospect={form.prospect}
            savedProfiles={profiles.savedProfiles}
            profileSelectorOpen={profiles.profileSelectorOpen}
            advancedOpen={advanced.advancedOpen}
            advancedTab={advanced.advancedTab}
            advancedPreviewCopy={advanced.activePreviewCopy}
            activePreviewOption={advanced.activePreviewOption}
            autofillStatus={form.autofillStatus}
            autofillMessage={form.autofillMessage}
            isFormValid={form.isFormValid}
            profileSelectorRef={profiles.profileSelectorRef}
            advancedPanelRef={advanced.advancedPanelRef}
            advancedSelections={advanced.advancedSelections}
            onContextChange={(val) => {
              form.setContext(val)
              setSelectedProfile(null)
            }}
            onProspectChange={(val) => {
              form.setProspect(val)
              setSelectedProfile(null)
            }}
            onToggleProfileSelector={profiles.onToggleProfileSelector}
            onSelectProfile={handleSelectProfile}
            onToggleAdvanced={advanced.onToggleAdvanced}
            onCloseAdvanced={advanced.onCloseAdvanced}
            onSetAdvancedTab={advanced.onSetAdvancedTab}
            onAdvancedSelect={advanced.onAdvancedSelect}
            onAdvancedPreview={advanced.onAdvancedPreview}
            onApplyAutofill={form.applyAutofill}
            onStartPractice={handleStartPractice}
            errorMessage={practiceError}
          />
        )}

        {!authLoading && activeTab === 'prospectos' && (
          <ProfilesLibraryTab
            savedProfiles={profiles.savedProfiles}
            editingProfile={profiles.editingProfile}
            setEditingProfile={profiles.setEditingProfile}
            onSaveProfile={(profile) => void profiles.updateProfile(profile)}
            onDeleteProfile={(profileId) => void profiles.deleteProfile(profileId)}
            errorMessage={profiles.profilesError}
            onGoToSetup={() => setActiveTab('setup')}
          />
        )}

        {!authLoading && activeTab === 'rendimiento' && (
          <ProgressDashboard sessions={sessions.recentSessions} />
        )}

        {!authLoading && activeTab === 'resultado' && (
          <ResultsDashboard
            recentSession={sessions.recentSessions[sessions.selectedRecentSessionIdx]}
            onRetry={handleRetryFromResults}
            onBack={() => setActiveTab('setup')}
          />
        )}
      </main>

      {sessions.sessionToDeleteId !== null && (
        <SessionDeleteModal
          sessionName={sessions.recentSessions.find((session) => session.id === sessions.sessionToDeleteId)?.name ?? 'esta sesión'}
          onCancel={() => sessions.setSessionToDeleteId(null)}
          onConfirm={sessions.onConfirmDeleteSession}
        />
      )}

      {/* La key reinicia el borrador cada vez que se abre el modal. */}
      <OnboardingSettingsModal
        key={modals.settingsOpen ? "settings-open" : "settings-closed"}
        open={modals.settingsOpen}
        initialProfile={onboardingProfile || {
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
        }}
        isSaving={modals.settingsSaving}
        errorMessage={modals.settingsError}
        onClose={modals.closeSettings}
        onSave={modals.handleSaveOnboardingSettings}
      />

      <ContactSupportModal
        open={modals.contactOpen}
        userEmail={user?.email || ''}
        isSubmitting={modals.contactSending}
        errorMessage={modals.contactError}
        successMessage={modals.contactSuccess}
        onClose={modals.closeContact}
        onSubmit={modals.handleSubmitContact}
      />

      {modals.signOutConfirmOpen && (
        <SignOutConfirmModal
          loading={modals.signOutLoading}
          onCancel={modals.closeSignOutConfirm}
          onConfirm={modals.handleConfirmSignOut}
        />
      )}

      <UpgradePlanModal
        open={upgradeModalReason !== null}
        currentPlan={billingStatus?.plan || 'free'}
        reason={upgradeModalReason || 'attempts'}
        onClose={closeUpgradeModal}
      />
    </div>
  )
}
