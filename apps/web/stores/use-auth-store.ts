import { create } from 'zustand'
import type { OnboardingProfile } from '@/app/setup/types/setup-types'
import { closerApi } from '@/lib/api/closer-api'
import { createClient, type User } from '@/lib/auth/auth-client'
import { createDefaultBillingStatus, type BillingStatus } from '@/lib/billing/plan'
import { useActiveSessionStore } from './use-active-session-store'

type AuthStore = {
  user: User | null
  /** Respuestas del onboarding guardadas en el servidor (null = no lo completó). */
  onboardingProfile: OnboardingProfile | null
  billingStatus: BillingStatus | null
  isLoading: boolean
  initialized: boolean
  initialize: () => Promise<void>
  refreshUser: () => Promise<void>
  signOut: () => Promise<void>
}

async function loadOnboarding(): Promise<OnboardingProfile | null> {
  try {
    const onboarding = await closerApi.getOnboarding()
    if (!onboarding) return null
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { completedAt, ...profile } = onboarding
    return profile
  } catch {
    return null
  }
}

/**
 * Estado de autenticación. Una sola fuente de verdad para el onboarding: la tabla
 * `onboarding_profiles` del backend (el MVP mezclaba `user_metadata` y una tabla, y se desincronizaban).
 */
export const useAuthStore = create<AuthStore>((set, get) => {
  const load = async (user: User | null) => {
    useActiveSessionStore.getState().syncUserScope(user?.id ?? null)
    const onboardingProfile = user ? await loadOnboarding() : null
    set({
      user,
      onboardingProfile,
      // Facturación congelada (observación del MVP): todos los usuarios usan el plan gratuito sin cobro.
      billingStatus: user ? createDefaultBillingStatus('free') : null,
      isLoading: false,
    })
  }

  return {
    user: null,
    onboardingProfile: null,
    billingStatus: null,
    isLoading: true,
    initialized: false,

    initialize: async () => {
      if (get().initialized) return
      set({ initialized: true })
      const auth = createClient().auth
      const { data } = await auth.getUser()
      await load(data.user)
      auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
          if ((session?.user?.id ?? null) !== (get().user?.id ?? null)) void load(session?.user ?? null)
        }
      })
    },

    refreshUser: async () => {
      const { data } = await createClient().auth.getUser()
      await load(data.user)
    },

    signOut: async () => {
      await createClient().auth.signOut()
      useActiveSessionStore.getState().syncUserScope(null)
      set({ user: null, onboardingProfile: null, billingStatus: null })
    },
  }
})
