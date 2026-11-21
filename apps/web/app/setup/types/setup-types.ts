export type TabType = 'setup' | 'prospectos' | 'rendimiento' | 'resultado'

export type AdvancedTab = 'modo' | 'tono'

export type AdvancedOptionCopy = {
  description: string
  impact: string
}

export type SavedProfile = {
  id: string
  name: string
  prospect: string
  context: string
  createdAt: string
  personName?: string
  roleCompany?: string
}

export type OnboardingProfile = {
  firstName: string
  role: string
  roleOtherDetail: string
  industry: string
  industryOtherDetail: string
  sellsTo: string
  sellsToOtherDetail: string
  experienceLevel: string
  mainChallenge: string
  mainChallengeOtherDetail: string
  weeklyCalls: string
  goalWithCloser: string
  companyName: string
  phone: string
}

//items del historial del sidebar - recientes 
export type RecentSession = {
  id: string
  name: string
  voiceName?: string
  prospect: string
  context: string
  createdAt: string
  advancedSelections?: Record<AdvancedTab, string>
  simulations: SimulationSession[]
}

/* ── Simulation Session Entities ──────────────────────────────────── */

export type EvaluationType = 'critical' | 'warning' | 'good' | 'neutral'

export type ConversationTurn = {
  turn: number
  ia: string
  tu: string
  evaluation: EvaluationType
  title: string
  diagnostic: string
  improvement: string | null
}

export type TurnEvaluation = {
  type: EvaluationType
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

export type ProspectProfile = {
  name: string
  role: string
  company: string
  description: string
}

export type SimulationContext = {
  prospectName: string
  prospectRole: string
  prospectCompany: string
  prospectDescription: string
  salesContext: string
}

export type VoiceMetrics = {
  speechRate: {
    value: number
    unit: string
    insight: string
  }
  talkListenRatio: {
    talk: number
    listen: number
    insight: string
  }
  longestMonologue: {
    value: string
    insight: string
  }
  fillers: {
    count: number
    examples: Array<{
      text: string
      count: number
    }>
    insight: string
  }
}

export type SkillRadarMetrics = {
  labels: [string, string, string, string, string]
  values: [number, number, number, number, number]
  strongest: {
    label: string
    value: number
  }
  weakest: {
    label: string
    value: number
  }
  averageSuccessRate: number
  improvementMessage?: string
}

export type SimulationAnalysis = {
  voice: VoiceMetrics
  skills: SkillRadarMetrics
}

export type SimulationSession = {
  id: string
  createdAt: string
  metrics: SessionMetrics
  context: SimulationContext
  conversation: ConversationTurn[]
  transcript: string
  analysis: SimulationAnalysis
}
