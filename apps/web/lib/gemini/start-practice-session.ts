import { mockFetch } from '@/mocks/api'
import { GeminiLiveAudio } from '@/mocks/live-audio'
import { getProspectSystemPrompt } from './prompts'
import { clearActiveGeminiSession, setActiveGeminiSession } from './active-session'
import { selectVoiceForProspect } from './voice-selector'
import { ADVANCED_OPTION_COPY } from '@/app/setup/config/setup-config'
import { useSimulationStore } from '@/stores/use-simulation-store'
import type { PracticeConfig } from '@/stores/use-active-session-store'

function normalizeStructuredValue(value: string | undefined | null): string {
  const raw = (value || '').trim()
  if (!raw) return ''

  const normalized = raw.toLowerCase()
  if (
    normalized === 'unknown' ||
    normalized === 'desconocido' ||
    normalized === 'no especificado' ||
    normalized === 'sin especificar' ||
    normalized === 'n/a' ||
    normalized === 'na' ||
    normalized === '-' ||
    normalized === '--'
  ) {
    return ''
  }

  return raw
}

async function enrichProspectProfile(
  config: PracticeConfig,
  updatePracticeConfig?: (update: Partial<PracticeConfig>) => void,
): Promise<PracticeConfig> {
  try {
    const res = await mockFetch('/api/simulation/extract-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prospect: config.prospect }),
    })

    if (!res.ok) {
      if (res.status === 429) {
        const data = (await res.json().catch(() => ({}))) as { retryAfterSeconds?: number; error?: string }
        const retrySeconds = Number.isFinite(data.retryAfterSeconds)
          ? Math.max(1, Math.floor(data.retryAfterSeconds as number))
          : 30
        useSimulationStore
          .getState()
          .setErrorMessage(data.error || `Límite temporal alcanzado. Reintenta en ${retrySeconds}s.`)
      }
      return config
    }

    const data: {
      name?: string
      role?: string
      company?: string
      gender?: 'female' | 'male' | 'unknown'
    } = await res.json()

    const enriched: PracticeConfig = {
      ...config,
      prospectName: normalizeStructuredValue(data.name) || config.prospectName,
      prospectRole: normalizeStructuredValue(data.role) || config.prospectRole,
      prospectCompany: normalizeStructuredValue(data.company) || config.prospectCompany,
      prospectGender: data.gender || config.prospectGender || 'unknown',
    }

    updatePracticeConfig?.({
      prospectName: enriched.prospectName,
      prospectRole: enriched.prospectRole,
      prospectCompany: enriched.prospectCompany,
      prospectGender: enriched.prospectGender,
    })

    return enriched
  } catch {
    return config
  }
}

export async function startGeminiSessionInBackground(
  config: PracticeConfig,
  updatePracticeConfig?: (update: Partial<PracticeConfig>) => void,
  onUpgradeRequired?: () => void,
) {
  clearActiveGeminiSession()
  useSimulationStore.getState().reset()

  try {
    const resolvedConfig = await enrichProspectProfile(config, updatePracticeConfig)

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

      useSimulationStore.getState().setErrorMessage('No se pudo iniciar la sesi\u00f3n. Intenta de nuevo.')
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
      updatePracticeConfig?.({ voiceName })
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
    useSimulationStore.getState().setErrorMessage('Error al iniciar la simulaci\u00f3n.')
  }
}