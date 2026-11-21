import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AdvancedTab, RecentSession } from '@/app/setup/types/setup-types'

export type PracticeConfig = {
  context: string
  prospect: string
  prospectName: string
  prospectRole: string
  prospectCompany: string
  voiceName?: string
  advancedSelections: Record<AdvancedTab, string>
}

/** Intento en curso: lo emite el backend al iniciar la llamada y lo exige para evaluarla. */
export type CurrentSimulation = {
  simulationId: string
  sessionId: string
  maxCallMinutes: number
}

type ActiveSessionStore = {
  ownerUserId: string | null
  practiceConfig: PracticeConfig | null
  currentSimulation: CurrentSimulation | null
  /** Sesión que se muestra en /simulation/result (la última evaluada). */
  activeSession: RecentSession | null
  syncUserScope: (userId: string | null) => void
  setPracticeConfig: (config: PracticeConfig) => void
  updatePracticeConfig: (update: Partial<PracticeConfig>) => void
  setCurrentSimulation: (simulation: CurrentSimulation | null) => void
  setActiveSession: (session: RecentSession) => void
  clearActiveSession: () => void
}

export const useActiveSessionStore = create<ActiveSessionStore>()(
  persist(
    (set, get) => ({
      ownerUserId: null,
      practiceConfig: null,
      currentSimulation: null,
      activeSession: null,
      syncUserScope: (userId) => {
        // Al cambiar de cuenta se descarta todo lo de la cuenta anterior.
        if (get().ownerUserId !== userId) {
          set({ ownerUserId: userId, practiceConfig: null, currentSimulation: null, activeSession: null })
        }
      },
      setPracticeConfig: (config) => set({ practiceConfig: config }),
      updatePracticeConfig: (update) =>
        set((state) => (state.practiceConfig ? { practiceConfig: { ...state.practiceConfig, ...update } } : state)),
      setCurrentSimulation: (simulation) => set({ currentSimulation: simulation }),
      setActiveSession: (session) => set({ activeSession: session }),
      clearActiveSession: () => set({ activeSession: null }),
    }),
    { name: 'closer.active-session.v2' },
  ),
)
