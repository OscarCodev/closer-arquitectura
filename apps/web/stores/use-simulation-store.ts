/**
 * Non-persisted store for live simulation state.
 * Written to by GeminiLiveAudio callbacks (from setup page context),
 * read by the simulation page.
 */

import { create } from 'zustand'
import type { ConnectionStatus } from '@/mocks/live-audio'
import { mergeStreamingChunk, normalizeTranscriptByRole } from '@/lib/transcript/merge'

type TranscriptEntry = {
  role: 'user' | 'model'
  text: string
  startedAt: number
  endedAt: number
}

type SimulationStore = {
  connectionStatus: ConnectionStatus
  modelAudioLevel: number
  userAudioLevel: number
  errorMessage: string | null
  transcript: TranscriptEntry[]
  setConnectionStatus: (status: ConnectionStatus) => void
  setModelAudioLevel: (level: number) => void
  setUserAudioLevel: (level: number) => void
  setErrorMessage: (msg: string | null) => void
  addTranscriptEntry: (role: 'user' | 'model', text: string, options?: { finished?: boolean }) => void
  reset: () => void
}

export const useSimulationStore = create<SimulationStore>((set) => ({
  connectionStatus: 'disconnected',
  modelAudioLevel: 0,
  userAudioLevel: 0,
  errorMessage: null,
  transcript: [],
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setModelAudioLevel: (level) => set({ modelAudioLevel: level }),
  setUserAudioLevel: (level) => set({ userAudioLevel: level }),
  setErrorMessage: (msg) => set({ errorMessage: msg }),
  addTranscriptEntry: (role, text, options) =>
    set((state) => {
      if (!text || text.trim().length === 0) return state
      const incoming = normalizeTranscriptByRole(role, text)
      if (!incoming) return state
      const now = Date.now()

      const prev = state.transcript
      // When finished is explicitly false, the chunk is an interim result.
      // Default to true (treat as final) when the flag is absent.
      const isInterim = options?.finished === false

      if (role === 'user') {
        const last = prev[prev.length - 1]
        if (last && last.role === 'user') {
          // Preserve the spacing carried by transcription chunks so word
          // boundaries like "Hola " + "Alejandro" remain intact.
          const updated = [...prev]
          updated[updated.length - 1] = {
            ...last,
            text: mergeStreamingChunk(last.text, incoming),
            endedAt: now,
          }
          return { transcript: updated }
        }

        // Preserve interim user chunks as a new user entry when speaker changes.
        // Some providers may never emit a final=true event, so dropping interim
        // chunks can erase the whole user side of the conversation.
        if (isInterim) {
          return { transcript: [...prev, { role, text: incoming, startedAt: now, endedAt: now }] }
        }

        return { transcript: [...prev, { role, text: incoming, startedAt: now, endedAt: now }] }
      }

      if (prev.length > 0 && prev[prev.length - 1].role === role) {
        const merged = [...prev]
        const previousText = merged[merged.length - 1].text
        // Use mergeStreamingChunk so that:
        //  • cumulative chunks (where the new text already starts with the old) replace instead of duplicating
        //  • delta chunks that lack a leading space get a word-boundary space inserted
        merged[merged.length - 1] = {
          ...merged[merged.length - 1],
          text: mergeStreamingChunk(previousText, text),
          endedAt: now,
        }
        return { transcript: merged }
      }

      return { transcript: [...prev, { role, text: incoming, startedAt: now, endedAt: now }] }
    }),
  reset: () =>
    set({ connectionStatus: 'disconnected', modelAudioLevel: 0, userAudioLevel: 0, errorMessage: null, transcript: [] }),
}))
