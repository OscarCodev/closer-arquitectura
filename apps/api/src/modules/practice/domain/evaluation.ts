import { ExternalServiceError } from '../../../shared/domain/errors'
import { buildSkillRadar, computeMetrics } from './scoring'
import { buildSessionTitle } from './session-title'
import { buildTurns, formatTranscriptForDisplay, type TurnPair } from './transcript'
import { EVALUATION_TYPES, type ConversationTurn, type EvaluationResult, type PracticeScenario, type TranscriptItem } from './types'
import { buildVoiceMetrics } from './voice-metrics'

/** Salida estructurada que debe devolver el evaluador de IA (puerto ConversationAiPort). */
export type AiEvaluation = {
  suggestedTitle?: string
  turns: Array<{
    turn: number
    evaluation: string
    title: string
    diagnostic: string
    improvement?: string | null
  }>
  skills: { values: number[]; improvementMessage?: string }
}

/** La IA devolvió algo que no se puede usar. La simulación queda FAILED y se puede reintentar. */
export class InvalidEvaluationError extends ExternalServiceError {}

/** Mínimo de turnos que la IA debe evaluar para aceptar la evaluación. */
const MIN_EVALUATED_RATIO = 0.5

/**
 * Combina la transcripción real con la evaluación de la IA.
 * - Los turnos se emparejan por número (`turn`), no por posición: si la IA omite uno, no se desplaza el resto.
 * - Si la IA no evaluó un turno, se marca como "Sin evaluación". Nunca se inventa feedback (observación del MVP).
 */
export function assembleEvaluation(params: {
  merged: TranscriptItem[]
  durationSeconds: number
  scenario: PracticeScenario
  ai: AiEvaluation
}): EvaluationResult {
  const { merged, durationSeconds, scenario, ai } = params
  const pairs = buildTurns(merged)
  if (pairs.length === 0) throw new InvalidEvaluationError('La llamada no tiene intercambios para evaluar.')

  const aiByTurn = new Map<number, AiEvaluation['turns'][number]>()
  for (const item of ai.turns ?? []) {
    if (Number.isInteger(item?.turn) && EVALUATION_TYPES.includes(item.evaluation as never)) aiByTurn.set(item.turn, item)
  }

  const evaluated = pairs.filter((pair) => aiByTurn.has(pair.turn)).length
  if (evaluated / pairs.length < MIN_EVALUATED_RATIO) {
    throw new InvalidEvaluationError('La evaluación de la IA no cubre suficientes turnos.')
  }

  const skills = buildSkillRadar(ai.skills?.values, ai.skills?.improvementMessage)
  if (!skills) throw new InvalidEvaluationError('La evaluación de la IA no incluye habilidades válidas.')

  const conversation = pairs.map((pair) => toConversationTurn(pair, aiByTurn.get(pair.turn)))
  const analysis = { voice: buildVoiceMetrics(merged, durationSeconds), skills }

  return {
    metrics: computeMetrics(conversation, analysis, durationSeconds),
    conversation,
    analysis,
    transcript: formatTranscriptForDisplay(merged),
    suggestedTitle: buildSessionTitle(ai.suggestedTitle, scenario, conversation),
  }
}

function toConversationTurn(pair: TurnPair, ai: AiEvaluation['turns'][number] | undefined): ConversationTurn {
  if (!ai) {
    return {
      turn: pair.turn,
      ia: pair.ia,
      tu: pair.tu,
      evaluation: 'neutral',
      title: 'Sin evaluación',
      diagnostic: 'La IA no evaluó este turno.',
      improvement: null,
    }
  }
  const improvement = typeof ai.improvement === 'string' && ai.improvement.trim() ? ai.improvement.trim() : null
  return {
    turn: pair.turn,
    ia: pair.ia,
    tu: pair.tu,
    evaluation: ai.evaluation as ConversationTurn['evaluation'],
    title: (ai.title ?? '').trim().slice(0, 140) || 'Turno evaluado',
    diagnostic: (ai.diagnostic ?? '').trim().slice(0, 600),
    improvement: improvement ? improvement.slice(0, 600) : null,
  }
}
