'use client'

import { useCallback, useState } from 'react'
import { closerApi } from '@/lib/api/closer-api'
import { ApiError } from '@/lib/api/http'
import { SUPPORT_EMAIL } from '@/lib/billing/plan'
import type { OnboardingProfile } from '../types/setup-types'

interface UseSetupModalsOptions {
  refreshOnboardingProfile: () => Promise<void>
  handleSignOut: () => Promise<void>
}

export function useSetupModals({ refreshOnboardingProfile, handleSignOut }: UseSetupModalsOptions) {
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
        await closerApi.sendSupportMessage(payload.subject, payload.message, window.location.pathname)
        setContactSuccess('Mensaje enviado. Te responderemos por correo lo antes posible.')
      } catch (error) {
        if (error instanceof ApiError && (error.isRateLimited || error.status === 400)) {
          setContactError(error.message)
        } else {
          openMailFallback(payload.subject, payload.message)
          setContactError('No pudimos enviarlo desde la app. Abrimos tu correo como alternativa.')
        }
      } finally {
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

      // Corrige el bug del MVP: antes se guardaba en user_metadata pero se leía de otra tabla.
      try {
        await closerApi.saveOnboarding(normalizedProfile)
      } catch (error) {
        setSettingsSaving(false)
        setSettingsError(error instanceof ApiError ? error.message : 'No pudimos guardar la configuración. Inténtalo de nuevo.')
        return
      }

      await refreshOnboardingProfile()
      setSettingsSaving(false)
      setSettingsOpen(false)
    },
    [refreshOnboardingProfile],
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
