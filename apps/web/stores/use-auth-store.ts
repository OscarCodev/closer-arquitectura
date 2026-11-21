import { create } from 'zustand'
import { createClient } from '@/mocks/supabase-client'
import type { User } from '@/mocks/supabase-client'
import type { OnboardingProfile } from '@/app/setup/types/setup-types'
import { useActiveSessionStore } from './use-active-session-store'
import type { BillingStatus } from '@/lib/billing/plan'
import { createDefaultBillingStatus } from '@/lib/billing/plan'

type AuthStore = {
  user: User | null
  onboardingProfile: OnboardingProfile | null
  billingStatus: BillingStatus | null
  isLoading: boolean
  initialized: boolean
  initialize: () => Promise<void>
  refreshUser: () => Promise<void>
  refreshBillingStatus: () => Promise<void>
  signOut: () => Promise<void>
}

function getSafeString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function parseOnboardingProfile(user: User | null): OnboardingProfile | null {
  if (!user) return null

  const userData = (user.user_metadata ?? {}) as Record<string, unknown>
  const storedProfile = userData.onboarding as Partial<OnboardingProfile> | undefined

  if (!storedProfile) return null

  return {
    firstName: getSafeString(storedProfile.firstName),
    role: getSafeString(storedProfile.role),
    roleOtherDetail: getSafeString(storedProfile.roleOtherDetail),
    industry: getSafeString(storedProfile.industry),
    industryOtherDetail: getSafeString(storedProfile.industryOtherDetail),
    sellsTo: getSafeString(storedProfile.sellsTo),
    sellsToOtherDetail: getSafeString(storedProfile.sellsToOtherDetail),
    experienceLevel: getSafeString(storedProfile.experienceLevel),
    mainChallenge: getSafeString(storedProfile.mainChallenge),
    mainChallengeOtherDetail: getSafeString(storedProfile.mainChallengeOtherDetail),
    weeklyCalls: getSafeString(storedProfile.weeklyCalls),
    goalWithCloser: getSafeString(storedProfile.goalWithCloser),
    companyName: getSafeString(storedProfile.companyName),
    phone: getSafeString(storedProfile.phone),
  }
}

// Load onboarding profile from database table (new source of truth)
async function loadOnboardingFromDB(userId: string): Promise<OnboardingProfile | null> {
  try {
    const supabase = createClient()
    const { data } = await supabase
      .from('user_onboarding')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!data) return null

    return {
      firstName: getSafeString(data.first_name),
      role: getSafeString(data.role),
      roleOtherDetail: getSafeString(data.role_other_detail),
      industry: getSafeString(data.industry),
      industryOtherDetail: getSafeString(data.industry_other_detail),
      sellsTo: getSafeString(data.sells_to),
      sellsToOtherDetail: getSafeString(data.sells_to_other_detail),
      experienceLevel: getSafeString(data.experience_level),
      mainChallenge: getSafeString(data.main_challenge),
      mainChallengeOtherDetail: getSafeString(data.main_challenge_other_detail),
      weeklyCalls: getSafeString(data.weekly_calls),
      goalWithCloser: getSafeString(data.goal_with_closer),
      companyName: getSafeString(data.company_name),
      phone: getSafeString(data.phone),
    }
  } catch {
    return null
  }
}

// MOCK: el plan/uso vendría de la base de datos; en la demo siempre es el plan gratuito.
async function loadBillingStatusFromDB(_userId: string): Promise<BillingStatus | null> {
  return createDefaultBillingStatus('free')
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  onboardingProfile: null,
  billingStatus: null,
  isLoading: true,
  initialized: false,

  initialize: async () => {
    if (get().initialized) return

    set({ initialized: true })

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    useActiveSessionStore.getState().syncUserScope(user?.id ?? null)

    // Load onboarding profile and billing status from DB (new source of truth), fallback to user_metadata
    let onboardingProfile: OnboardingProfile | null = null
    let billingStatus: BillingStatus | null = null
    if (user?.id) {
      const [dbProfile, dbBillingStatus] = await Promise.all([
        loadOnboardingFromDB(user.id),
        loadBillingStatusFromDB(user.id),
      ])

      onboardingProfile = dbProfile || parseOnboardingProfile(user)
      billingStatus = dbBillingStatus || createDefaultBillingStatus('free')
    }

    set({
      user,
      onboardingProfile,
      billingStatus,
      isLoading: false,
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      const updatedUser = session?.user ?? null
      useActiveSessionStore.getState().syncUserScope(updatedUser?.id ?? null)

      // Load onboarding profile and billing status from DB (new source of truth), fallback to user_metadata
      const loadProfile = async () => {
        let profile: OnboardingProfile | null = null
        let status: BillingStatus | null = null
        if (updatedUser?.id) {
          const [dbProfile, dbBillingStatus] = await Promise.all([
            loadOnboardingFromDB(updatedUser.id),
            loadBillingStatusFromDB(updatedUser.id),
          ])

          profile = dbProfile || parseOnboardingProfile(updatedUser)
          status = dbBillingStatus || createDefaultBillingStatus('free')
        }

        set({
          user: updatedUser,
          onboardingProfile: profile,
          billingStatus: status,
          isLoading: false,
        })
      }

      loadProfile()
    })
  },

  refreshUser: async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    useActiveSessionStore.getState().syncUserScope(user?.id ?? null)

    // Load onboarding profile and billing status from DB (new source of truth), fallback to user_metadata
    let onboardingProfile: OnboardingProfile | null = null
    let billingStatus: BillingStatus | null = null
    if (user?.id) {
      const [dbProfile, dbBillingStatus] = await Promise.all([
        loadOnboardingFromDB(user.id),
        loadBillingStatusFromDB(user.id),
      ])

      onboardingProfile = dbProfile || parseOnboardingProfile(user)
      billingStatus = dbBillingStatus || createDefaultBillingStatus('free')
    }

    set({
      user,
      onboardingProfile,
      billingStatus,
      isLoading: false,
    })
  },

  refreshBillingStatus: async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.id) {
      set({ billingStatus: null })
      return
    }

    const billingStatus = (await loadBillingStatusFromDB(user.id)) || createDefaultBillingStatus('free')
    set({ billingStatus })
  },

  signOut: async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    useActiveSessionStore.getState().syncUserScope(null)
    set({ user: null, onboardingProfile: null, billingStatus: null })
  },
}))
