'use client'

import { mockFetch } from '@/mocks/api'
import { useCallback } from 'react'
import { GeminiLiveAudio } from '@/mocks/live-audio'
import { getProspectSystemPrompt } from '@/lib/gemini/prompts'
import { setActiveGeminiSession, clearActiveGeminiSession } from '@/lib/gemini/active-session'
import { selectVoiceForProspect } from '@/lib/gemini/voice-selector'
import { useSimulationStore } from '@/stores/use-simulation-store'
import { normalizeStructuredValue } from '@/lib/utils/normalize'
import { ADVANCED_OPTION_COPY } from '../config/setup-config'
import type { PracticeConfig } from '@/stores/use-active-session-store'
import type { SavedProfile } from '../types/setup-types'

export function resolveRetryPayloadFromSession(session: {
  context: string
  prospect: string
  simulations: Array<{
    context?: {
      prospectName?: string
      prospectRole?: string
      prospectCompany?: string
      prospectDescription?: string
      salesContext?: string
    }
  }>
}) {
  const latestContext = session.simulations[session.simulations.length - 1]?.context
  const firstContext = session.simulations[0]?.context

  let prospectName = normalizeStructuredValue(latestContext?.prospectName) || normalizeStructuredValue(firstContext?.prospectName)
  let prospectRole = normalizeStructuredValue(latestContext?.prospectRole) || normalizeStructuredValue(firstContext?.prospectRole)
  let prospectCompany = normalizeStructuredValue(latestContext?.prospectCompany) || normalizeStructuredValue(firstContext?.prospectCompany)

  const contextValue = normalizeStructuredValue(latestContext?.salesContext) || session.context.trim()
  const prospectValue = normalizeStructuredValue(latestContext?.prospectDescription) || session.prospect.trim()

  // If the last attempt is incomplete, backfill from older attempts.
  for (const sim of [...session.simulations].reverse()) {
    if (!prospectName) prospectName = normalizeStructuredValue(sim.context?.prospectName)
    if (!prospectRole) prospectRole = normalizeStructuredValue(sim.context?.prospectRole)
    if (!prospectCompany) prospectCompany = normalizeStructuredValue(sim.context?.prospectCompany)
  }

  return { contextValue, prospectValue, prospectName, prospectRole, prospectCompany }
}

interface UseSimulationLauncherOptions {
  updatePracticeConfig: (partial: Partial<PracticeConfig>) => void
  setSavedProfiles: (updater: (prev: SavedProfile[]) => SavedProfile[]) => void
  onUpgradeRequired?: () => void
}

export function useSimulationLauncher({ updatePracticeConfig, setSavedProfiles, onUpgradeRequired }: UseSimulationLauncherOptions) {
  const enrichProspectProfile = useCallback(
    async (config: PracticeConfig): Promise<PracticeConfig> => {
      try {
        const res = await mockFetch('/api/simulation/extract-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prospect: config.prospect }),
        })

        if (!res.ok) return config

        const data: { name?: string; role?: string; company?: string; gender?: 'female' | 'male' | 'unknown' } = await res.json()

        const enriched: PracticeConfig = {
          ...config,
          prospectName: normalizeStructuredValue(data.name) || config.prospectName,
          prospectRole: normalizeStructuredValue(data.role) || config.prospectRole,
          prospectCompany: normalizeStructuredValue(data.company) || config.prospectCompany,
          prospectGender: data.gender || config.prospectGender || 'unknown',
        }

        updatePracticeConfig({
          prospectName: enriched.prospectName,
          prospectRole: enriched.prospectRole,
          prospectCompany: enriched.prospectCompany,
          prospectGender: enriched.prospectGender,
        })

        return enriched
      } catch {
        return config
      }
    },
    [updatePracticeConfig],
  )

  const startGeminiSessionInBackground = useCallback(
    async (config: PracticeConfig) => {
      clearActiveGeminiSession()
      useSimulationStore.getState().reset()

      try {
        const resolvedConfig = await enrichProspectProfile(config)

        const tokenRes = await mockFetch('/api/simulation/token', { method: 'POST' })
        if (!tokenRes.ok) {
          if (tokenRes.status === 429) {
            const data = (await tokenRes.json().catch(() => ({}))) as { retryAfterSeconds?: number; error?: string; errorCode?: string }
            if (data.errorCode === 'quota_exhausted') {
              onUpgradeRequired?.()
            }
            const retrySeconds = Number.isFinite(data.retryAfterSeconds)
              ? Math.max(1, Math.floor(data.retryAfterSeconds as number))
              : 30
            useSimulationStore
              .getState()
              .setErrorMessage(data.error || `Límite temporal alcanzado. Reintenta en ${retrySeconds}s.`)
            return
          }

          useSimulationStore.getState().setErrorMessage('No se pudo iniciar la sesión. Intenta de nuevo.')
          return
        }
        const { token } = await tokenRes.json()

        const modo = resolvedConfig.advancedSelections.modo
        const tono = resolvedConfig.advancedSelections.tono

        const systemPrompt = getProspectSystemPrompt({
          prospect: resolvedConfig.prospect,
          salesContext: resolvedConfig.context,
          modo,
          modoDescription: ADVANCED_OPTION_COPY.modo[modo]?.description ?? '',
          tono,
          tonoDescription: ADVANCED_OPTION_COPY.tono[tono]?.description ?? '',
          prospectName: resolvedConfig.prospectName || undefined,
          prospectRole: resolvedConfig.prospectRole || undefined,
          prospectCompany: resolvedConfig.prospectCompany || undefined,
        })

        const voiceName =
          normalizeStructuredValue(resolvedConfig.voiceName) ||
          selectVoiceForProspect(resolvedConfig.prospectName, {
            prospectGender: resolvedConfig.prospectGender || 'unknown',
            prospectText: resolvedConfig.prospect,
          })

        if (voiceName !== resolvedConfig.voiceName) {
          updatePracticeConfig({ voiceName })
        }

        const gemini = new GeminiLiveAudio(
          {
            onStatusChange: (status) => useSimulationStore.getState().setConnectionStatus(status),
            onAudioLevel: (level) => useSimulationStore.getState().setUserAudioLevel(level),
            onModelAudioLevel: (level) => useSimulationStore.getState().setModelAudioLevel(level),
            onTranscript: (role, text, finished) =>
              useSimulationStore.getState().addTranscriptEntry(role, text, { finished }),
            onError: (err) => useSimulationStore.getState().setErrorMessage(err),
            onInterrupted: () => {},
          },
          systemPrompt,
          token,
          voiceName,
        )

        setActiveGeminiSession(gemini)
        await gemini.connect()
      } catch {
        useSimulationStore.getState().setErrorMessage('Error al iniciar la simulación.')
      }
    },
    [enrichProspectProfile, onUpgradeRequired, updatePracticeConfig],
  )

  const extractProfileAsync = useCallback(
    async (profileId: string, prospectText: string) => {
      try {
        const res = await mockFetch('/api/simulation/extract-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prospect: prospectText }),
        })
        if (!res.ok) return

        const data: { name: string; role: string; company: string; gender?: 'female' | 'male' | 'unknown' } = await res.json()
        const normalizedName = normalizeStructuredValue(data.name)
        const normalizedRole = normalizeStructuredValue(data.role)
        const normalizedCompany = normalizeStructuredValue(data.company)
        if (!normalizedName && !normalizedRole && !normalizedCompany) return

        updatePracticeConfig({
          prospectName: normalizedName || undefined,
          prospectRole: normalizedRole || undefined,
          prospectCompany: normalizedCompany || undefined,
          prospectGender: data.gender || 'unknown',
        })

        const roleCompany =
          normalizedRole && normalizedCompany
            ? `${normalizedRole} en ${normalizedCompany}`
            : normalizedRole || normalizedCompany || undefined

        setSavedProfiles((prev) =>
          prev.map((p) =>
            p.id === profileId
              ? {
                  ...p,
                  name: normalizedName || p.name,
                  personName: normalizedName || p.personName,
                  roleCompany: roleCompany || p.roleCompany,
                }
              : p,
          ),
        )
      } catch {
        // silent fail — extraction is best-effort
      }
    },
    [updatePracticeConfig, setSavedProfiles],
  )

  return { enrichProspectProfile, startGeminiSessionInBackground, extractProfileAsync }
}
