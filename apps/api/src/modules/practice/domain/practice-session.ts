import type { AdvancedSelections, EvaluationResult, PracticeScenario } from './types'

export type SimulationStatus = 'IN_CALL' | 'EVALUATING' | 'COMPLETED' | 'FAILED'

export type PracticeSessionRecord = {
  id: string
  userId: string
  name: string
  nameIsAuto: boolean
  voiceName: string | null
  scenario: PracticeScenario
  createdAt: Date
  updatedAt: Date
}

export type SimulationRecord = {
  id: string
  sessionId: string
  userId: string
  status: SimulationStatus
  durationSeconds: number | null
  result: Omit<EvaluationResult, 'suggestedTitle'> | null
  failureReason: string | null
  statusChangedAt: Date
  createdAt: Date
}

export type SessionWithSimulations = PracticeSessionRecord & { simulations: SimulationRecord[] }

export type { AdvancedSelections }

/** Una evaluación en curso más antigua que esto se considera colgada y se puede reintentar (ADR-006). */
export const EVALUATION_STALE_MS = 2 * 60 * 1000

export type EvaluationDecision = 'evaluate' | 'already-completed' | 'in-progress'

/**
 * Máquina de estados de la evaluación idempotente:
 *   IN_CALL → EVALUATING → COMPLETED
 *                        ↘ FAILED → (reintento) EVALUATING
 * Un COMPLETED nunca se reevalúa: reenviar la misma petición devuelve el resultado guardado.
 */
export function decideEvaluation(simulation: Pick<SimulationRecord, 'status' | 'statusChangedAt'>, now: Date): EvaluationDecision {
  switch (simulation.status) {
    case 'COMPLETED':
      return 'already-completed'
    case 'EVALUATING':
      return now.getTime() - simulation.statusChangedAt.getTime() > EVALUATION_STALE_MS ? 'evaluate' : 'in-progress'
    default:
      return 'evaluate'
  }
}

/** Nombre provisional de una sesión nueva, antes de que la evaluación sugiera uno mejor. */
export function provisionalSessionName(scenario: PracticeScenario) {
  const reference = scenario.prospectName || scenario.prospectRole || scenario.prospectCompany || 'prospecto'
  return `Práctica con ${reference}`.slice(0, 120)
}
