'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppIcon } from '@/components/brand/app-icon'
import { UpgradePlanModal } from '@/components/billing/upgrade-plan-modal'
import { createClient } from '@/mocks/supabase-client'
import { useActiveSessionStore } from '@/stores/use-active-session-store'
import { getPlanLimits } from '@/lib/billing/plan'
import { useAdvancedOptions } from './state/use-advanced-options'
import { getInitialTabFromQuery } from './state/setup-initializers'
import { usePracticeForm } from './state/use-practice-form'
import { useProfileManager } from './state/use-profile-manager'
import { useSessionManager } from './state/use-session-manager'
import { useSetupAuth } from './state/use-setup-auth'
import { useSetupModals } from './state/use-setup-modals'
import { useSimulationLauncher, resolveRetryPayloadFromSession } from './state/use-simulation-launcher'
import { normalizeStructuredValue } from '@/lib/utils/normalize'
import type { SavedProfile, TabType } from './types/setup-types'
import type { PracticeConfig } from '@/stores/use-active-session-store'
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
  const supabase = createClient()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>(getInitialTabFromQuery)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<SavedProfile | null>(null)
  const [upgradeModalReason, setUpgradeModalReason] = useState<'attempts' | 'autogenerations' | 'minutes' | null>(null)

  const { authLoading, user, onboardingProfile, billingStatus, refreshOnboardingProfile, handleSignOut } = useSetupAuth()
  const sessions = useSessionManager({ userId: user?.id, authReady: !authLoading })
  const profiles = useProfileManager({ userId: user?.id, authReady: !authLoading })
  const advanced = useAdvancedOptions()
  const planLimits = getPlanLimits(billingStatus?.plan)
  const openUpgradeModal = (reason: 'attempts' | 'autogenerations' | 'minutes') => setUpgradeModalReason(reason)
  const closeUpgradeModal = () => setUpgradeModalReason(null)

  const form = usePracticeForm({
    onboardingProfile,
    onUpgradeRequired: () => openUpgradeModal('autogenerations'),
  })
  const { setPracticeConfig, updatePracticeConfig, setActiveSession, clearActiveSession } = useActiveSessionStore()
  const selectedRecentSession = sessions.recentSessions[sessions.selectedRecentSessionIdx]

  const modals = useSetupModals({ supabase, refreshOnboardingProfile, handleSignOut })
  const launcher = useSimulationLauncher({
    updatePracticeConfig,
    setSavedProfiles: profiles.setSavedProfiles,
    onUpgradeRequired: () => openUpgradeModal('attempts'),
  })

  const handleSelectProfile = (profile: SavedProfile) => {
    form.setProspect(profile.prospect)
    if (profile.context) form.setContext(profile.context)
    setSelectedProfile(profile)
    profiles.onCloseProfileSelector()
  }

  const handleStartPractice = () => {
    if (!form.isFormValid) return

    if (billingStatus && billingStatus.simulationsUsed >= planLimits.simulationsPerMonth) {
      openUpgradeModal('attempts')
      return
    }

    let prospectName = form.getProfileName(form.prospect, profiles.savedProfiles.length)
    let prospectRole = ''
    let prospectCompany = ''
    let selectedProfileId: string | undefined

    clearActiveSession()

    if (selectedProfile) {
      // Profile pre-selected from "Elegir perfil" — use its structured data
      prospectName = selectedProfile.personName || prospectName
      selectedProfileId = selectedProfile.id

      if (selectedProfile.roleCompany) {
        const firstEnIdx = selectedProfile.roleCompany.indexOf(' en ')
        if (firstEnIdx !== -1) {
          prospectRole = selectedProfile.roleCompany.substring(0, firstEnIdx).trim()
          prospectCompany = selectedProfile.roleCompany.substring(firstEnIdx + 4).trim()
        } else {
          prospectRole = selectedProfile.roleCompany.trim()
        }
      }
    } else {
      // Free-text entry — save profile and fire async extraction
      const newProfile: SavedProfile = {
        id: `${Date.now()}`,
        name: prospectName,
        prospect: form.prospect.trim(),
        context: form.context.trim(),
        createdAt: new Date().toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
      }
      profiles.setSavedProfiles((prev) => [newProfile, ...prev].slice(0, 20))
      profiles.onCloseProfileSelector()

      // Fire async extraction during the loading screen (best-effort)
      launcher.extractProfileAsync(newProfile.id, form.prospect.trim())
    }

    const finalConfig: PracticeConfig = {
      context: form.context.trim(),
      prospect: form.prospect.trim(),
      prospectName,
      prospectRole,
      prospectCompany,
      prospectGender: 'unknown',
      voiceName: undefined,
      advancedSelections: advanced.advancedSelections,
      selectedProfileId,
    }

    setPracticeConfig(finalConfig)

    // Start Gemini session in background — runs during the loading screen (~4.8s)
    // so by the time the user reaches /simulation, the AI is already connected
    launcher.startGeminiSessionInBackground(finalConfig)

    form.startPractice()
  }

  const handleRetryFromResults = () => {
    if (!selectedRecentSession) return

    if (billingStatus && billingStatus.simulationsUsed >= planLimits.simulationsPerMonth) {
      openUpgradeModal('attempts')
      return
    }

    // Keep retries within the same session item so attempts stack as 1/n, 2/n, etc.
    setActiveSession(selectedRecentSession)

    const retryPayload = resolveRetryPayloadFromSession(selectedRecentSession)

    form.setContext(retryPayload.contextValue)
    form.setProspect(retryPayload.prospectValue)
    setSelectedProfile(null)

    const retryConfig: PracticeConfig = {
      context: retryPayload.contextValue,
      prospect: retryPayload.prospectValue,
      prospectName: retryPayload.prospectName || retryPayload.prospectValue || 'Prospecto',
      prospectRole: retryPayload.prospectRole,
      prospectCompany: retryPayload.prospectCompany,
      prospectGender: 'unknown',
      voiceName: normalizeStructuredValue(selectedRecentSession.voiceName),
      advancedSelections: selectedRecentSession.advancedSelections || advanced.advancedSelections,
    }

    setPracticeConfig(retryConfig)
    launcher.extractProfileAsync(`retry-${Date.now()}`, retryPayload.prospectValue)
    launcher.startGeminiSessionInBackground(retryConfig)
    form.startPractice()
  }

  if (form.isStartingPractice) {
    return (
      <main className="m-0 flex h-[100dvh] w-screen flex-col overflow-hidden bg-[var(--brand-light-50)] p-0">
        <SetupLoadingScreen onComplete={() => router.push('/simulation')} />
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
            onApplyAutofill={async () => {
              if (billingStatus && billingStatus.autogenerationsUsed >= planLimits.autogenerationsPerMonth) {
                openUpgradeModal('autogenerations')
                return
              }

              await form.applyAutofill()
            }}
            onStartPractice={handleStartPractice}
          />
        )}

        {!authLoading && activeTab === 'prospectos' && (
          <ProfilesLibraryTab
            savedProfiles={profiles.savedProfiles}
            editingProfile={profiles.editingProfile}
            setSavedProfiles={profiles.setSavedProfiles}
            setEditingProfile={profiles.setEditingProfile}
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

      <OnboardingSettingsModal
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
