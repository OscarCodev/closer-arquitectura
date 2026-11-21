'use client'

import { mockFetch } from '@/mocks/api'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { routes } from '@/lib/routes'
import { getActiveGeminiSession, clearActiveGeminiSession } from '@/lib/gemini/active-session'
import { useSimulationStore } from '@/stores/use-simulation-store'
import { useActiveSessionStore } from '@/stores/use-active-session-store'
import { useAuthStore } from '@/stores/use-auth-store'
import { getPlanLimits } from '@/lib/billing/plan'
import { playSessionStart, playSessionEnd, playError } from '@/lib/audio/sounds'
import { FeedbackLoadingScreen } from './_components/feedback-loading-screen'
import { DEFAULT_SIMULATION_PROSPECT, formatSimulationTime } from './config/simulation-config'
import { useSimulationTimer } from './state/use-simulation-timer'
import { SimulationControls } from './ui/simulation-controls'
import { SimulationStage } from './ui/simulation-stage'
import { SimulationTopbar } from './ui/simulation-topbar'
import type { RecentSession, SimulationSession } from '@/app/setup/types/setup-types'
import { normalizeStructuredValue } from '@/lib/utils/normalize'

function mergeCanonicalContext(
  base: {
    prospectName?: string
    prospectRole?: string
    prospectCompany?: string
    prospectDescription?: string
    salesContext?: string
  } | null | undefined,
  incoming: {
    prospectName?: string
    prospectRole?: string
    prospectCompany?: string
    prospectDescription?: string
    salesContext?: string
  },
) {
  return {
    prospectName: normalizeStructuredValue(base?.prospectName) || normalizeStructuredValue(incoming.prospectName) || 'Prospecto',
    prospectRole: normalizeStructuredValue(base?.prospectRole) || normalizeStructuredValue(incoming.prospectRole),
    prospectCompany: normalizeStructuredValue(base?.prospectCompany) || normalizeStructuredValue(incoming.prospectCompany),
    prospectDescription:
      normalizeStructuredValue(base?.prospectDescription) ||
      normalizeStructuredValue(incoming.prospectDescription) ||
      '',
    salesContext: normalizeStructuredValue(base?.salesContext) || normalizeStructuredValue(incoming.salesContext) || '',
  }
}

async function syncSessionToCloud(session: RecentSession) {
  try {
    const getRes = await mockFetch('/api/setup/sessions', { method: 'GET' })
    if (!getRes.ok) return

    const data = (await getRes.json().catch(() => ({}))) as { sessions?: RecentSession[] }
    const existing = Array.isArray(data.sessions) ? data.sessions : []

    const merged = [session, ...existing.filter((item) => item.id !== session.id)].slice(0, 60)

    await mockFetch('/api/setup/sessions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessions: merged }),
    })
  } catch {
    // non-blocking persistence path
  }
}

export default function SimulationPage() {
  const [isMicMuted, setIsMicMuted] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isLoadingComplete, setIsLoadingComplete] = useState(false)
  const [isResultReady, setIsResultReady] = useState(false)
  const [coachSuggestions, setCoachSuggestions] = useState<string[]>([])
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0)
  const [showCoachCard, setShowCoachCard] = useState(false)
  const [isCoachThinking, setIsCoachThinking] = useState(false)
  const prevStatusRef = useRef<string>('disconnected')
  const prevErrorRef = useRef<string | null>(null)
  const wasModelSpeakingRef = useRef(false)
  const lastModelSpeechEndAtRef = useRef<number | null>(null)
  const autoEndedRef = useRef(false)
  const router = useRouter()

  const { user, isLoading, initialize, billingStatus } = useAuthStore()
  const { practiceConfig, activeSession, setActiveSession } = useActiveSessionStore()
  const { connectionStatus, modelAudioLevel, userAudioLevel, errorMessage, transcript } = useSimulationStore()

  const isModelSpeaking = connectionStatus === 'connected' && modelAudioLevel > 0.03
  const isUserSpeaking = !isMicMuted && connectionStatus === 'connected' && userAudioLevel > 0.08
  const callLimitSeconds = getPlanLimits(billingStatus?.plan).sessionMinutes * 60

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (!isLoading && !user) router.replace(routes.login)
  }, [isLoading, user, router])

  // Fires when the live session becomes connected (or on mount if already connected).
  // startConversation() is normally triggered from startMicrophone() automatically,
  // but calling it here is a safe fallback: if startMicrophone() hasn't completed yet,
  // startConversation() will be a no-op (playbackNode not ready) and startMicrophone()
  // will call it again once the audio pipeline is fully set up.
  useEffect(() => {
    if (prevStatusRef.current !== 'connected' && connectionStatus === 'connected') {
      setCoachSuggestions([])
      setCurrentSuggestionIndex(0)
      setShowCoachCard(false)
      const gemini = getActiveGeminiSession()
      if (gemini) {
        playSessionStart()
        if (!gemini.hasConversationStarted()) {
          gemini.startConversation()
        }
      }
    }
    prevStatusRef.current = connectionStatus
  }, [connectionStatus])

  // Play error sound when a new error message appears
  useEffect(() => {
    if (errorMessage && errorMessage !== prevErrorRef.current) {
      playError()
    }
    prevErrorRef.current = errorMessage
  }, [errorMessage])

  useEffect(() => {
    if (!wasModelSpeakingRef.current && isModelSpeaking) {
      wasModelSpeakingRef.current = true
      return
    }

    if (wasModelSpeakingRef.current && !isModelSpeaking) {
      wasModelSpeakingRef.current = false
      lastModelSpeechEndAtRef.current = Date.now()
    }
  }, [isModelSpeaking])

  const coachGate = useMemo(() => {
    if (connectionStatus !== 'connected') {
      return { canRequest: false, reason: 'Conectate a la simulacion para pedir consejos' }
    }

    if (!practiceConfig) {
      return { canRequest: false, reason: 'No hay contexto de practica disponible' }
    }

    if (isMicMuted) {
      return { canRequest: false, reason: 'Activa el microfono para pedir una sugerencia' }
    }

    if (isCoachThinking) {
      return { canRequest: false, reason: 'Generando sugerencia...' }
    }

    if (transcript.length < 2) {
      return { canRequest: false, reason: 'Necesitas al menos un intercambio antes del consejo' }
    }

    if (isModelSpeaking) {
      return { canRequest: false, reason: 'Espera a que la IA termine de hablar' }
    }

    if (isUserSpeaking) {
      return { canRequest: false, reason: 'Pide el consejo antes de empezar tu respuesta' }
    }

    const lastRole = transcript[transcript.length - 1]?.role
    if (lastRole !== 'model') {
      return { canRequest: false, reason: 'Puedes pedir consejo cuando termine la intervencion de la IA' }
    }

    const lastModelSpeechEndAt = lastModelSpeechEndAtRef.current
    if (!lastModelSpeechEndAt || Date.now() - lastModelSpeechEndAt < 500) {
      return { canRequest: false, reason: 'Esperando fin de turno de la IA...' }
    }

    return { canRequest: true, reason: 'Pedir consejo para tu siguiente respuesta' }
  }, [connectionStatus, practiceConfig, isMicMuted, isCoachThinking, transcript, isModelSpeaking, isUserSpeaking])

  const handleRequestCoachTip = useCallback(async () => {
    if (!coachGate.canRequest) {
      setShowCoachCard(true)
      setCoachSuggestions([coachGate.reason])
      setCurrentSuggestionIndex(0)
      return
    }

    setShowCoachCard(true)

    if (connectionStatus !== 'connected') {
      setCoachSuggestions(['Conéctate a la simulación para poder pedir consejo.'])
      setCurrentSuggestionIndex(0)
      return
    }

    if (!practiceConfig) {
      setCoachSuggestions(['No encontré el contexto de práctica. Vuelve a iniciar la simulación.'])
      setCurrentSuggestionIndex(0)
      return
    }

    if (transcript.length < 2) {
      setCoachSuggestions(['Todavía no hay contexto suficiente. Haz 1-2 intercambios más y vuelve a pedir consejo.'])
      setCurrentSuggestionIndex(0)
      return
    }

    setIsCoachThinking(true)
    try {
      const res = await mockFetch('/api/simulation/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: practiceConfig.context,
          prospect: practiceConfig.prospect,
          modo: practiceConfig.advancedSelections.modo,
          tono: practiceConfig.advancedSelections.tono,
          transcript,
        }),
      })

      if (!res.ok) {
        if (res.status === 429) {
          const data = (await res.json().catch(() => ({}))) as { retryAfterSeconds?: number; error?: string }
          const retrySeconds = Number.isFinite(data.retryAfterSeconds)
            ? Math.max(1, Math.floor(data.retryAfterSeconds as number))
            : 30
          setCoachSuggestions([
            data.error || `Límite temporal alcanzado para consejos. Reintenta en ${retrySeconds}s.`,
          ])
          setCurrentSuggestionIndex(0)
          return
        }

        setCoachSuggestions(['No pude generar sugerencia ahora. Intenta de nuevo en unos segundos.'])
        setCurrentSuggestionIndex(0)
        return
      }

      const data: { tip?: string } = await res.json()
      const tipText = (data.tip && data.tip.trim().length > 0) 
        ? data.tip.trim()
        : 'Haz una pregunta de seguimiento concreta para descubrir impacto y urgencia.'
      
      const updatedSuggestions = [...coachSuggestions, tipText]
      setCoachSuggestions(updatedSuggestions)
      setCurrentSuggestionIndex(updatedSuggestions.length - 1)
    } catch {
      setCoachSuggestions(['No pude generar sugerencia ahora. Intenta de nuevo en unos segundos.'])
      setCurrentSuggestionIndex(0)
    } finally {
      setIsCoachThinking(false)
    }
  }, [coachGate.canRequest, coachGate.reason, coachSuggestions, connectionStatus, practiceConfig, transcript])

  const handlePrevSuggestion = useCallback(() => {
    setCurrentSuggestionIndex((prev) => Math.max(0, prev - 1))
  }, [])

  const handleNextSuggestion = useCallback(() => {
    setCurrentSuggestionIndex((prev) => Math.min(coachSuggestions.length - 1, prev + 1))
  }, [coachSuggestions.length])

  const handleCloseCoachCard = useCallback(() => {
    setShowCoachCard(false)
  }, [])

  const { seconds } = useSimulationTimer(isAnalyzing)
  const time = useMemo(() => formatSimulationTime(seconds), [seconds])

  const prospect = useMemo(
    () =>
      practiceConfig
        ? {
            name: normalizeStructuredValue(practiceConfig.prospectName) || DEFAULT_SIMULATION_PROSPECT.name,
            role: normalizeStructuredValue(practiceConfig.prospectRole),
            company: normalizeStructuredValue(practiceConfig.prospectCompany),
          }
        : DEFAULT_SIMULATION_PROSPECT,
    [practiceConfig],
  )

  const handleToggleMic = useCallback(() => {
    const gemini = getActiveGeminiSession()
    if (gemini) {
      const muted = gemini.toggleMute()
      setIsMicMuted(muted)
    } else {
      setIsMicMuted((prev) => !prev)
    }
  }, [])

  const handleEndCall = useCallback(() => {
    playSessionEnd()
    clearActiveGeminiSession()
    setIsAnalyzing(true)
    setIsLoadingComplete(false)
    setIsResultReady(false)

    void (async () => {
      if (!practiceConfig) {
        setIsResultReady(true)
        return
      }

      try {
        const res = await mockFetch('/api/simulation/result', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            practiceConfig,
            transcript,
            durationSeconds: seconds,
          }),
        })

        if (res.status === 429) {
          const data = (await res.json().catch(() => ({}))) as { retryAfterSeconds?: number; error?: string }
          const retrySeconds = Number.isFinite(data.retryAfterSeconds)
            ? Math.max(1, Math.floor(data.retryAfterSeconds as number))
            : 60
          useSimulationStore
            .getState()
            .setErrorMessage(data.error || `Límite temporal alcanzado para análisis. Reintenta en ${retrySeconds}s.`)
          setIsAnalyzing(false)
          setIsLoadingComplete(false)
          setIsResultReady(false)
          return
        }

        const data: { simulation?: SimulationSession; suggestedTitle?: string; error?: string } = await res.json()

        if (!res.ok || !data.simulation) {
          throw new Error(data.error || 'Error generando resultados')
        }

        const sessionName =
          activeSession?.name ||
          data.suggestedTitle ||
          `Simulación de ${practiceConfig.prospectName || 'prospecto'}`
        const baseSession: RecentSession =
          activeSession || {
            id: `session-${Date.now()}`,
            name: sessionName,
            voiceName: practiceConfig.voiceName,
            prospect: practiceConfig.prospectName || practiceConfig.prospect,
            context: practiceConfig.context,
            advancedSelections: practiceConfig.advancedSelections,
            createdAt: new Date().toISOString(),
            simulations: [],
          }

        const canonicalContext = mergeCanonicalContext(baseSession.simulations[0]?.context, {
          prospectName: practiceConfig.prospectName || baseSession.prospect || 'Prospecto',
          prospectRole: practiceConfig.prospectRole || '',
          prospectCompany: practiceConfig.prospectCompany || '',
          prospectDescription: practiceConfig.prospect || baseSession.context || '',
          salesContext: practiceConfig.context || baseSession.context || '',
        })

        const normalizedSimulation: SimulationSession = {
          ...data.simulation,
          context: canonicalContext,
        }

        const updatedSession: RecentSession = {
          ...baseSession,
          voiceName: baseSession.voiceName || practiceConfig.voiceName,
          prospect: canonicalContext.prospectName || baseSession.prospect,
          context: canonicalContext.salesContext || baseSession.context,
          advancedSelections: practiceConfig.advancedSelections || baseSession.advancedSelections,
          simulations: [...baseSession.simulations, normalizedSimulation],
        }

        setActiveSession(updatedSession)
        await syncSessionToCloud(updatedSession)
      } catch {
        const fallbackSession: RecentSession =
          activeSession || {
            id: `session-${Date.now()}`,
            name: `Simulación de ${practiceConfig.prospectName || 'prospecto'}`,
            voiceName: practiceConfig.voiceName,
            prospect: practiceConfig.prospectName || practiceConfig.prospect,
            context: practiceConfig.context,
            advancedSelections: practiceConfig.advancedSelections,
            createdAt: new Date().toISOString(),
            simulations: [],
          }

        setActiveSession(fallbackSession)
        await syncSessionToCloud(fallbackSession)
      } finally {
        setIsResultReady(true)
      }
    })()
  }, [activeSession, practiceConfig, seconds, setActiveSession, transcript])

  useEffect(() => {
    if (isAnalyzing || autoEndedRef.current) return

    if (seconds >= callLimitSeconds) {
      autoEndedRef.current = true
      try {
        window.sessionStorage.setItem('closer.upgrade.reason', 'minutes')
      } catch {
        // ignore storage failures
      }
      handleEndCall()
    }
  }, [callLimitSeconds, handleEndCall, isAnalyzing, seconds])

  useEffect(() => {
    if (isAnalyzing && isLoadingComplete && isResultReady) {
      router.push('/simulation/result')
    }
  }, [isAnalyzing, isLoadingComplete, isResultReady, router])

  if (isAnalyzing) {
    return (
      <main className="m-0 flex h-[100dvh] w-screen flex-col overflow-hidden bg-[var(--brand-light-50)] p-0">
        <FeedbackLoadingScreen onComplete={() => setIsLoadingComplete(true)} />
      </main>
    )
  }

  return (
    <div className="flex h-[100dvh] w-screen flex-col overflow-hidden bg-[var(--brand-light-50)] selection:bg-[var(--brand-blue-100)] selection:text-[var(--brand-blue-700)]">
      <SimulationTopbar time={time} />
      <SimulationStage
        prospect={prospect}
        connectionStatus={connectionStatus}
        modelAudioLevel={modelAudioLevel}
        userAudioLevel={userAudioLevel}
        errorMessage={errorMessage}
        showCoachCard={showCoachCard}
        coachSuggestion={coachSuggestions[currentSuggestionIndex] || ''}
        suggestionCount={coachSuggestions.length}
        currentSuggestionIndex={currentSuggestionIndex}
        isCoachThinking={isCoachThinking}
        onCloseCoachCard={handleCloseCoachCard}
        onPrevSuggestion={handlePrevSuggestion}
        onNextSuggestion={handleNextSuggestion}
      />
      <SimulationControls
        isMicMuted={isMicMuted}
        isConnected={connectionStatus === 'connected'}
        isRequestingConsejo={isCoachThinking}
        canRequestConsejo={coachGate.canRequest}
        coachDisabledReason={coachGate.reason}
        userAudioLevel={userAudioLevel}
        onToggleMic={handleToggleMic}
        onRequestConsejo={handleRequestCoachTip}
        onEndCall={handleEndCall}
      />
    </div>
  )
}
