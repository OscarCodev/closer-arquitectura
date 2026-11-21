import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AdvancedTab, RecentSession } from '@/app/setup/types/setup-types'

export type PracticeConfig = {
  context: string
  prospect: string
  prospectName: string
  prospectRole: string
  prospectCompany: string
  prospectGender?: 'female' | 'male' | 'unknown'
  voiceName?: string
  advancedSelections: Record<AdvancedTab, string>
  selectedProfileId?: string
}

type ActiveSessionStore = {
  ownerUserId: string | null
  practiceConfig: PracticeConfig | null
  activeSession: RecentSession | null
  syncUserScope: (userId: string | null) => void
  setPracticeConfig: (config: PracticeConfig) => void
  updatePracticeConfig: (update: Partial<PracticeConfig>) => void
  setActiveSession: (session: RecentSession) => void
  clearActiveSession: () => void
  clearPracticeConfig: () => void
}

export const useActiveSessionStore = create<ActiveSessionStore>()(
  persist(
    (set, get) => ({
      ownerUserId: null,
      practiceConfig: null,
      activeSession: null,
      syncUserScope: (userId) => {
        const currentOwner = get().ownerUserId

        if (!userId) {
          set({ ownerUserId: null, practiceConfig: null, activeSession: null })
          return
        }

        if (!currentOwner) {
          set({ ownerUserId: userId, practiceConfig: null, activeSession: null })
          return
        }

        if (currentOwner !== userId) {
          set({ ownerUserId: userId, practiceConfig: null, activeSession: null })
        }
      },
      setPracticeConfig: (config) => set({ practiceConfig: config }),
      updatePracticeConfig: (update) =>
        set((state) =>
          state.practiceConfig
            ? { practiceConfig: { ...state.practiceConfig, ...update } }
            : state,
        ),
      setActiveSession: (session) => set({ activeSession: session }),
      clearActiveSession: () => set({ activeSession: null }),
      clearPracticeConfig: () => set({ practiceConfig: null }),
    }),
    {
      name: 'closer.active-session.v1',
    },
  ),
)
