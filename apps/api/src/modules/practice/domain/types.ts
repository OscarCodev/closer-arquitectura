/** Tipos del dominio de práctica. Coinciden con los que consume el frontend (setup-types.ts). */

export type EvaluationType = 'critical' | 'warning' | 'good' | 'neutral'

export const EVALUATION_TYPES: EvaluationType[] = ['critical', 'warning', 'good', 'neutral']

export type TranscriptRole = 'user' | 'model'

export type TranscriptItem = {
  role: TranscriptRole
  text: string
  startedAt?: number
  endedAt?: number
}

export type ConversationTurn = {
  turn: number
  ia: string
  tu: string
  evaluation: EvaluationType
  title: string
  diagnostic: string
  improvement: string | null
}

export type SessionMetrics = {
  score: number
  duration: string
  turns: number
  errors: number
  mejorables: number
  brillantes: number
  neutros: number
}

export type VoiceMetrics = {
  speechRate: { value: number; unit: string; insight: string }
  talkListenRatio: { talk: number; listen: number; insight: string }
  longestMonologue: { value: string; insight: string }
  fillers: { count: number; examples: Array<{ text: string; count: number }>; insight: string }
}

export type SkillLabels = [string, string, string, string, string]
export type SkillValues = [number, number, number, number, number]

export type SkillRadarMetrics = {
  labels: SkillLabels
  values: SkillValues
  strongest: { label: string; value: number }
  weakest: { label: string; value: number }
  averageSuccessRate: number
  improvementMessage?: string
}

export type SimulationAnalysis = {
  voice: VoiceMetrics
  skills: SkillRadarMetrics
}

export type ProspectGender = 'female' | 'male' | 'unknown'

export type AdvancedSelections = { modo: string; tono: string }

/** Escenario de práctica: lo que el vendedor configura antes de la llamada. */
export type PracticeScenario = {
  context: string
  prospect: string
  prospectName: string
  prospectRole: string
  prospectCompany: string
  advancedSelections: AdvancedSelections
}

/** Resultado de una evaluación, calculado y guardado en el servidor. */
export type EvaluationResult = {
  metrics: SessionMetrics
  conversation: ConversationTurn[]
  analysis: SimulationAnalysis
  transcript: string
  suggestedTitle: string
}
