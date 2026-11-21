'use client'

import { mockFetch } from '@/mocks/api'
import { useCallback, useState } from 'react'
import type { SupabaseClient } from '@/mocks/supabase-client'
import { SUPPORT_EMAIL } from '@/lib/billing/plan'
import type { OnboardingProfile } from '../types/setup-types'

interface UseSetupModalsOptions {
  supabase: SupabaseClient
  refreshOnboardingProfile: () => Promise<void>
  handleSignOut: () => Promise<void>
}

export function useSetupModals({ supabase, refreshOnboardingProfile, handleSignOut }: UseSetupModalsOptions) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsError, setSettingsError] = useState('')

  const [contactOpen, setContactOpen] = useState(false)
  const [contactSending, setContactSending] = useState(false)
  const [contactError, setContactError] = useState('')
  const [contactSuccess, setContactSuccess] = useState('')

  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false)
  const [signOutLoading, setSignOutLoading] = useState(false)

  const openMailFallback = useCallback((subject: string, message: string) => {
    const composed = `${message}\n\nRuta: ${window.location.pathname}`
    const href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`[Closer] ${subject}`)}&body=${encodeURIComponent(composed)}`
    window.location.href = href
  }, [])

  const handleSubmitContact = useCallback(
    async (payload: { subject: string; message: string }) => {
      setContactSending(true)
      setContactError('')
      setContactSuccess('')

      try {
        const res = await mockFetch('/api/support/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: payload.subject,
            message: payload.message,
            pagePath: window.location.pathname,
          }),
        })

        if (!res.ok) {
          if (res.status === 429) {
            const data = (await res.json().catch(() => ({}))) as { retryAfterSeconds?: number; error?: string }
            const retrySeconds = Number.isFinite(data.retryAfterSeconds)
              ? Math.max(1, Math.floor(data.retryAfterSeconds as number))
              : 60
            setContactError(data.error || `Límite temporal alcanzado. Reintenta en ${retrySeconds}s.`)
            setContactSending(false)
            return
          }

          openMailFallback(payload.subject, payload.message)
          setContactError('No pudimos enviarlo desde la app. Abrimos tu correo como alternativa.')
          setContactSending(false)
          return
        }

        setContactSuccess('Mensaje enviado. Te responderemos por correo lo antes posible.')
        setContactSending(false)
      } catch {
        openMailFallback(payload.subject, payload.message)
        setContactError('No pudimos enviarlo desde la app. Abrimos tu correo como alternativa.')
        setContactSending(false)
      }
    },
    [openMailFallback],
  )

  const handleSaveOnboardingSettings = useCallback(
    async (profile: OnboardingProfile) => {
      setSettingsSaving(true)
      setSettingsError('')

      const normalizedProfile: OnboardingProfile = {
        ...profile,
        firstName: profile.firstName.trim(),
        roleOtherDetail: profile.roleOtherDetail.trim(),
        industryOtherDetail: profile.industryOtherDetail.trim(),
        sellsToOtherDetail: profile.sellsToOtherDetail.trim(),
        mainChallengeOtherDetail: profile.mainChallengeOtherDetail.trim(),
        goalWithCloser: profile.goalWithCloser.trim(),
        companyName: profile.companyName.trim(),
        phone: profile.phone.trim(),
      }

      const payload: Record<string, unknown> = {
        onboarding_completed: true,
        onboarding: normalizedProfile,
      }

      if (normalizedProfile.firstName) {
        payload.firstName = normalizedProfile.firstName
        payload.full_name = normalizedProfile.firstName
      }

      const { error } = await supabase.auth.updateUser({ data: payload })
      if (error) {
        setSettingsSaving(false)
        setSettingsError('No pudimos guardar la configuración. Inténtalo de nuevo.')
        return
      }

      await refreshOnboardingProfile()
      setSettingsSaving(false)
      setSettingsOpen(false)
    },
    [refreshOnboardingProfile, supabase.auth],
  )

  const handleConfirmSignOut = useCallback(async () => {
    setSignOutLoading(true)
    await handleSignOut()
  }, [handleSignOut])

  return {
    // settings modal
    settingsOpen,
    settingsSaving,
    settingsError,
    openSettings: () => { setSettingsError(''); setSettingsOpen(true) },
    closeSettings: () => { if (!settingsSaving) setSettingsOpen(false) },
    handleSaveOnboardingSettings,

    // contact modal
    contactOpen,
    contactSending,
    contactError,
    contactSuccess,
    openContact: () => { setContactError(''); setContactSuccess(''); setContactOpen(true) },
    closeContact: () => { if (!contactSending) setContactOpen(false) },
    handleSubmitContact,

    // sign-out modal
    signOutConfirmOpen,
    signOutLoading,
    openSignOutConfirm: () => setSignOutConfirmOpen(true),
    closeSignOutConfirm: () => setSignOutConfirmOpen(false),
    handleConfirmSignOut,
  }
}
