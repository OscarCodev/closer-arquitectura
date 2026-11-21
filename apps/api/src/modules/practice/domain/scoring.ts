import { durationToSeconds, formatDuration } from './voice-metrics'
import type {
  ConversationTurn,
  EvaluationType,
  SessionMetrics,
  SimulationAnalysis,
  SkillLabels,
  SkillRadarMetrics,
  SkillValues,
  VoiceMetrics,
} from './types'

export const SKILL_LABELS: SkillLabels = ['Prospección', 'Descubrimiento', 'Demo', 'Objeciones', 'Cierre Venta']

/** Puntos por tipo de turno. Un turno crítico no vale 0 para no hundir todo el promedio con un solo error. */
export const EVALUATION_POINTS: Record<EvaluationType, number> = {
  critical: 20,
  warning: 55,
  neutral: 72,
  good: 92,
}

/** Pesos del puntaje global: turnos evaluados por la IA + habilidades + métricas de voz estimadas. */
export const SCORE_WEIGHTS = { conversation: 0.5, skills: 0.35, voice: 0.15 } as const

const IMPROVEMENT_BY_SKILL: Record<string, string> = {
  Prospección: 'Trabaja una apertura de 20-30 segundos con permiso, contexto y una pregunta de interés para elevar tus primeras impresiones.',
  Descubrimiento: 'Profundiza con preguntas de impacto y urgencia antes de presentar solución; apunta a entender dolor, costo y prioridad.',
  Demo: 'Conecta cada capacidad con un resultado de negocio medible del prospecto y evita listar funcionalidades sin contexto.',
  Objeciones: 'Cuando aparezca una objeción, valida primero, reencuadra después y cierra con una pregunta de avance para recuperar control.',
  'Cierre Venta': 'Define un siguiente paso concreto con fecha, responsables y objetivo de la reunión para aumentar avance comercial real.',
}

export function clampPercent(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : 0
}

export function improvementForSkill(label: string) {
  return IMPROVEMENT_BY_SKILL[label] ?? 'Enfócate en sostener consistencia en todas las fases y convertir cada conversación en un siguiente paso concreto.'
}

/** Construye el radar a partir de los 5 valores que devuelve la IA (o null si son inválidos). */
export function buildSkillRadar(values: unknown, improvementMessage?: unknown): SkillRadarMetrics | null {
  if (!Array.isArray(values) || values.length !== 5) return null
  const numeric = values.map((v) => Number(v))
  if (numeric.some((v) => !Number.isFinite(v))) return null

  const clamped = numeric.map(clampPercent) as SkillValues
  const maxIndex = clamped.indexOf(Math.max(...clamped))
  const minIndex = clamped.indexOf(Math.min(...clamped))
  const message = typeof improvementMessage === 'string' && improvementMessage.trim() ? improvementMessage.trim() : improvementForSkill(SKILL_LABELS[minIndex])

  return {
    labels: SKILL_LABELS,
    values: clamped,
    strongest: { label: SKILL_LABELS[maxIndex], value: clamped[maxIndex] },
    weakest: { label: SKILL_LABELS[minIndex], value: clamped[minIndex] },
    averageSuccessRate: clampPercent(clamped.reduce((sum, v) => sum + v, 0) / clamped.length),
    improvementMessage: message,
  }
}

export function scoreConversation(conversation: ConversationTurn[]) {
  if (conversation.length === 0) return 0
  return Math.round(conversation.reduce((acc, turn) => acc + EVALUATION_POINTS[turn.evaluation], 0) / conversation.length)
}

export function scoreVoice(voice: VoiceMetrics) {
  const rateDelta = Math.min(1, Math.abs(voice.speechRate.value - 145) / 70)
  const balanceDelta = Math.min(1, Math.abs(voice.talkListenRatio.talk - 48) / 35)
  const fillerScore = Math.max(0, 100 - voice.fillers.count * 12)
  const monologueScore = Math.max(0, 100 - Math.round(durationToSeconds(voice.longestMonologue.value) / 10) * 5)
  return Math.round(
    (100 - rateDelta * 40) * 0.35 + (100 - balanceDelta * 45) * 0.35 + fillerScore * 0.15 + monologueScore * 0.15,
  )
}

/** Puntaje global 0-100 y conteos por tipo de turno. Lo calcula siempre el servidor. */
export function computeMetrics(conversation: ConversationTurn[], analysis: SimulationAnalysis, durationSeconds: number): SessionMetrics {
  const count = (type: EvaluationType) => conversation.filter((turn) => turn.evaluation === type).length
  const score = clampPercent(
    scoreConversation(conversation) * SCORE_WEIGHTS.conversation +
      analysis.skills.averageSuccessRate * SCORE_WEIGHTS.skills +
      scoreVoice(analysis.voice) * SCORE_WEIGHTS.voice,
  )
  return {
    score,
    duration: formatDuration(durationSeconds),
    turns: conversation.length,
    errors: count('critical'),
    mejorables: count('warning'),
    brillantes: count('good'),
    neutros: count('neutral'),
  }
}
