'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { routes } from '@/lib/routes'
import { useAuthStore } from '@/stores/use-auth-store'

export function useSetupAuth() {
  const { user, onboardingProfile, billingStatus, isLoading, initialize, refreshUser, refreshBillingStatus, signOut: storeSignOut } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (isLoading) return

    if (!user) {
      router.replace(routes.login)
      return
    }

    const onboardingDone = Boolean((user.user_metadata ?? {}).onboarding_completed)

    if (!onboardingDone) {
      router.replace(routes.onboarding)
    }
  }, [isLoading, user, router])

  const handleSignOut = async () => {
    await storeSignOut()
    router.replace(routes.login)
  }

  return {
    authLoading: isLoading,
    user,
    onboardingProfile,
    billingStatus,
    refreshOnboardingProfile: refreshUser,
    refreshBillingStatus,
    handleSignOut,
  }
}
