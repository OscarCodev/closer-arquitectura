'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { routes } from '@/lib/routes'
import { closerApi } from '@/lib/api/closer-api'
import { errorMessage as apiErrorMessage } from '@/lib/api/http'
import { getActiveGeminiSession, clearActiveGeminiSession } from '@/lib/gemini/active-session'
import { useSimulationStore } from '@/stores/use-simulation-store'
import { useActiveSessionStore } from '@/stores/use-active-session-store'
import { useAuthStore } from '@/stores/use-auth-store'
import { playSessionStart, playSessionEnd, playError } from '@/lib/audio/sounds'
import { FeedbackLoadingScreen } from './_components/feedback-loading-screen'
import { DEFAULT_SIMULATION_PROSPECT, formatSimulationTime } from './config/simulation-config'
import { useSimulationTimer } from './state/use-simulation-timer'
import { SimulationControls } from './ui/simulation-controls'
import { SimulationStage } from './ui/simulation-stage'
import { SimulationTopbar } from './ui/simulation-topbar'
import { normalizeStructuredValue } from '@/lib/utils/normalize'

export default function SimulationPage() {
  const [isMicMuted, setIsMicMuted] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isLoadingComplete, setIsLoadingComplete] = useState(false)
  const [isResultReady, setIsResultReady] = useState(false)
  const [evaluationError, setEvaluationError] = useState<string | null>(null)
  const evaluationInput = useRef<{ transcript: Parameters<typeof closerApi.evaluateSimulation>[1]; seconds: number } | null>(null)
  const [coachSuggestions, setCoachSuggestions] = useState<string[]>([])
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0)
  const [showCoachCard, setShowCoachCard] = useState(false)
  const [isCoachThinking, setIsCoachThinking] = useState(false)
  const prevStatusRef = useRef<string>('disconnected')
  const prevErrorRef = useRef<string | null>(null)
  const wasModelSpeakingRef = useRef(false)
  const lastModelSpeechEndAtRef = useRef<number | null>(null)
  const endCallRef = useRef<() => void>(() => {})
  const router = useRouter()

  const { user, isLoading, initialize } = useAuthStore()
  const { practiceConfig, currentSimulation, setActiveSession, setCurrentSimulation } = useActiveSessionStore()
  const { connectionStatus, modelAudioLevel, userAudioLevel, errorMessage, transcript } = useSimulationStore()

  const isModelSpeaking = connectionStatus === 'connected' && modelAudioLevel > 0.03
  const isUserSpeaking = !isMicMuted && connectionStatus === 'connected' && userAudioLevel > 0.08
  const callLimitSeconds = (currentSimulation?.maxCallMinutes ?? 10) * 60

  // Sin intento activo (p. ej. recarga de la página) no hay llamada que mostrar.
  useEffect(() => {
    if (!isLoading && user && !currentSimulation && !isAnalyzing) router.replace(routes.setup)
  }, [currentSimulation, isAnalyzing, isLoading, router, user])

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

    // Margen de medio segundo tras el fin del turno de la IA (se evalúa al hacer clic, no en el render).
    const lastModelSpeechEndAt = lastModelSpeechEndAtRef.current
    if (!lastModelSpeechEndAt || Date.now() - lastModelSpeechEndAt < 500) {
      setCoachSuggestions(['Esperando fin de turno de la IA...'])
      setCurrentSuggestionIndex(0)
      return
    }

    if (!currentSimulation) return
    setIsCoachThinking(true)
    try {
      const tip = await closerApi.coachTip(currentSimulation.simulationId, transcript)
      const updatedSuggestions = [...coachSuggestions, tip]
      setCoachSuggestions(updatedSuggestions)
      setCurrentSuggestionIndex(updatedSuggestions.length - 1)
    } catch (error) {
      setCoachSuggestions([apiErrorMessage(error, 'No pude generar sugerencia ahora. Intenta de nuevo en unos segundos.')])
      setCurrentSuggestionIndex(0)
    } finally {
      setIsCoachThinking(false)
    }
  }, [coachGate.canRequest, coachGate.reason, coachSuggestions, connectionStatus, currentSimulation, practiceConfig, transcript])

  const handlePrevSuggestion = useCallback(() => {
    setCurrentSuggestionIndex((prev) => Math.max(0, prev - 1))
  }, [])

  const handleNextSuggestion = useCallback(() => {
    setCurrentSuggestionIndex((prev) => Math.min(coachSuggestions.length - 1, prev + 1))
  }, [coachSuggestions.length])

  const handleCloseCoachCard = useCallback(() => {
    setShowCoachCard(false)
  }, [])

  // Al llegar al límite de minutos la llamada se cierra y se evalúa sola.
  const { seconds } = useSimulationTimer(connectionStatus === 'connected' && !isAnalyzing, callLimitSeconds, () =>
    endCallRef.current(),
  )
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

  /** Envía la transcripción al servidor, que evalúa y guarda el resultado (idempotente: se puede reintentar). */
  const runEvaluation = useCallback(async () => {
    const input = evaluationInput.current
    if (!currentSimulation || !input) return
    setEvaluationError(null)
    try {
      const { session } = await closerApi.evaluateSimulation(currentSimulation.simulationId, input.transcript, input.seconds)
      setActiveSession(session)
      setCurrentSimulation(null)
      setIsResultReady(true)
    } catch (error) {
      setEvaluationError(apiErrorMessage(error, 'No pudimos evaluar la llamada.'))
    }
  }, [currentSimulation, setActiveSession, setCurrentSimulation])

  const handleEndCall = useCallback(() => {
    playSessionEnd()
    clearActiveGeminiSession()
    evaluationInput.current = { transcript, seconds }
    setIsAnalyzing(true)
    setIsLoadingComplete(false)
    setIsResultReady(false)
    void runEvaluation()
  }, [runEvaluation, seconds, transcript])

  useEffect(() => {
    endCallRef.current = handleEndCall
  }, [handleEndCall])

  useEffect(() => {
    if (isAnalyzing && isLoadingComplete && isResultReady) {
      router.push('/simulation/result')
    }
  }, [isAnalyzing, isLoadingComplete, isResultReady, router])

  if (isAnalyzing && evaluationError) {
    return (
      <main className="grid h-[100dvh] w-screen place-items-center bg-[var(--brand-light-50)] px-6 text-center">
        <div className="max-w-md">
          <p className="typo-micro font-semibold uppercase tracking-[0.14em] text-[var(--brand-gray-500)]">
            Evaluación pendiente
          </p>
          <h2 className="typo-page-title mt-2 font-semibold text-[var(--brand-ink-900)]">No pudimos evaluar tu llamada</h2>
          <p className="typo-body mt-3 text-[var(--brand-gray-500)]">
            {evaluationError} Tu conversación sigue guardada: puedes reintentar sin repetir la llamada.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => void runEvaluation()}
              className="rounded-xl bg-[var(--brand-ink-900)] px-5 py-3 font-semibold text-white"
            >
              Reintentar evaluación
            </button>
            <button
              type="button"
              onClick={() => router.push(routes.setup)}
              className="rounded-xl border border-[var(--color-border)] bg-white px-5 py-3 font-semibold text-[var(--brand-ink-900)]"
            >
              Volver al menú
            </button>
          </div>
        </div>
      </main>
    )
  }

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
