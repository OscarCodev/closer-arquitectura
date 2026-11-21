import type { AiEvaluation } from '../domain/evaluation'
import type { PracticeSessionRecord, SessionWithSimulations, SimulationRecord } from '../domain/practice-session'
import type { TurnPair } from '../domain/transcript'
import type { EvaluationResult, PracticeScenario, ProspectGender, TranscriptItem } from '../domain/types'

/* ── Persistencia ─────────────────────────────────────────────────── */

export interface PracticeRepositoryPort {
  listSessions(userId: string, limit: number): Promise<SessionWithSimulations[]>
  findSession(userId: string, sessionId: string): Promise<SessionWithSimulations | null>
  createSession(userId: string, data: { name: string; voiceName: string; scenario: PracticeScenario }): Promise<PracticeSessionRecord>
  renameSession(userId: string, sessionId: string, name: string): Promise<boolean>
  deleteSession(userId: string, sessionId: string): Promise<boolean>

  createSimulation(userId: string, sessionId: string): Promise<SimulationRecord>
  findSimulation(userId: string, simulationId: string): Promise<(SimulationRecord & { session: PracticeSessionRecord }) | null>
  /** Pasa a EVALUATING de forma atómica solo si el estado sigue siendo `expectedStatus`. */
  claimForEvaluation(simulationId: string, expectedStatus: SimulationRecord['status'], expectedChangedAt: Date): Promise<boolean>
  completeSimulation(simulationId: string, durationSeconds: number, result: EvaluationResult): Promise<void>
  failSimulation(simulationId: string, durationSeconds: number, reason: string): Promise<void>
}
export const PRACTICE_REPOSITORY = Symbol('PRACTICE_REPOSITORY')

/* ── IA de texto (extracción, coach, escenarios, evaluación) ──────── */

export type ExtractedProfile = { name: string; role: string; company: string; gender: ProspectGender }

export type GeneratedScenario = {
  prospectName: string
  productName: string
  scenarioTheme: string
  context: string
  prospect: string
}

export interface ConversationAiPort {
  extractProfile(prospectText: string): Promise<ExtractedProfile>
  coachTip(params: { scenario: PracticeScenario; transcript: TranscriptItem[] }): Promise<string>
  generateScenario(): Promise<GeneratedScenario>
  /** Evalúa turnos ya numerados. Lanza ExternalServiceError si el proveedor falla. */
  evaluate(params: { scenario: PracticeScenario; turns: TurnPair[]; durationSeconds: number }): Promise<AiEvaluation>
}
export const CONVERSATION_AI = Symbol('CONVERSATION_AI')

/* ── Voz en tiempo real ───────────────────────────────────────────── */

export type LiveSessionAccess = {
  /** `gemini` → el navegador conecta con Gemini Live · `fake` → guion simulado (pruebas, k6). */
  provider: 'gemini' | 'fake'
  token: string
  model: string
  voiceName: string
  expiresAt: string
}

export interface LiveVoicePort {
  /** Token efímero de un solo uso con el prompt, la voz y el modelo bloqueados (ADR-007). */
  createSessionAccess(params: { systemPrompt: string; voiceName: string; maxSessionMinutes: number }): Promise<LiveSessionAccess>
}
export const LIVE_VOICE = Symbol('LIVE_VOICE')
