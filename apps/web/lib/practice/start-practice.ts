/**
 * Único punto de inicio de una práctica (antes había dos lanzadores duplicados).
 * Pide al backend el intento + token de voz y conecta la llamada en segundo plano,
 * mientras el usuario ve la pantalla de carga (preconexión).
 */
import { closerApi, type NewScenario } from '@/lib/api/closer-api'
import { errorMessage } from '@/lib/api/http'
import { clearActiveGeminiSession, setActiveGeminiSession } from '@/lib/gemini/active-session'
import { createVoiceSession } from '@/lib/voice/voice-session'
import { useActiveSessionStore } from '@/stores/use-active-session-store'
import { useSimulationStore } from '@/stores/use-simulation-store'

export type StartPracticeInput = NewScenario | { sessionId: string }

export async function startPractice(input: StartPracticeInput): Promise<boolean> {
  clearActiveGeminiSession()
  const simulation = useSimulationStore.getState()
  const active = useActiveSessionStore.getState()
  simulation.reset()
  active.setCurrentSimulation(null)

  let started
  try {
    started = await closerApi.startSimulation(input)
  } catch (error) {
    simulation.setErrorMessage(errorMessage(error, 'No se pudo iniciar la práctica. Intenta de nuevo.'))
    return false
  }

  const { session, prospect, live } = started
  active.setPracticeConfig({
    context: session.context,
    prospect: prospect.description,
    prospectName: prospect.name || 'Prospecto',
    prospectRole: prospect.role,
    prospectCompany: prospect.company,
    voiceName: live.voiceName,
    advancedSelections: session.advancedSelections ?? { modo: 'Ciclo Completo', tono: 'Perfil Real' },
  })
  active.setCurrentSimulation({ simulationId: started.simulationId, sessionId: session.id, maxCallMinutes: started.maxCallMinutes })

  const voice = createVoiceSession(live, {
    onStatusChange: (status) => useSimulationStore.getState().setConnectionStatus(status),
    onAudioLevel: (level) => useSimulationStore.getState().setUserAudioLevel(level),
    onModelAudioLevel: (level) => useSimulationStore.getState().setModelAudioLevel(level),
    onTranscript: (role, text, finished) => useSimulationStore.getState().addTranscriptEntry(role, text, { finished }),
    onError: (message) => useSimulationStore.getState().setErrorMessage(message),
    onInterrupted: () => {},
  })
  setActiveGeminiSession(voice)
  await voice.connect()
  return true
}
