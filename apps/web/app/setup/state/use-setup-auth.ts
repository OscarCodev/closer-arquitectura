'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { routes } from '@/lib/routes'
import { useAuthStore } from '@/stores/use-auth-store'

/** Protege /setup: sin sesión → login; sin onboarding → onboarding. */
export function useSetupAuth() {
  const { user, onboardingProfile, billingStatus, isLoading, initialize, refreshUser, signOut } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    void initialize()
  }, [initialize])

  useEffect(() => {
    if (isLoading) return
    if (!user) router.replace(routes.login)
    else if (!onboardingProfile) router.replace(routes.onboarding)
  }, [isLoading, user, onboardingProfile, router])

  const handleSignOut = async () => {
    await signOut()
    router.replace(routes.login)
  }

  return {
    authLoading: isLoading || !user || !onboardingProfile,
    user,
    onboardingProfile,
    billingStatus,
    refreshOnboardingProfile: refreshUser,
    handleSignOut,
  }
}
