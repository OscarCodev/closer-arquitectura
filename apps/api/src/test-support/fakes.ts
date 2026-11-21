/**
 * Dobles de prueba en memoria para los puertos de la capa de aplicación.
 * Permiten probar los casos de uso sin base de datos, Redis ni IA (Clean Architecture).
 */
import { randomUUID } from 'node:crypto'
import type { CachePort } from '../shared/application/ports/cache.port'
import type { ConversationAiPort, LiveVoicePort, PracticeRepositoryPort } from '../modules/practice/application/ports'
import type { AiEvaluation } from '../modules/practice/domain/evaluation'
import type { PracticeSessionRecord, SessionWithSimulations, SimulationRecord } from '../modules/practice/domain/practice-session'
import type { EvaluationResult, PracticeScenario } from '../modules/practice/domain/types'

export class InMemoryCache implements CachePort {
  readonly store = new Map<string, string>()
  readonly deleted: string[] = []

  async get<T>(key: string) {
    const raw = this.store.get(key)
    return raw === undefined ? null : (JSON.parse(raw) as T)
  }
  async set<T>(key: string, value: T, _ttlSeconds?: number) {
    this.store.set(key, JSON.stringify(value))
  }
  async delete(...keys: string[]) {
    keys.forEach((key) => {
      this.deleted.push(key)
      this.store.delete(key)
    })
  }
  async getOrSet<T>(key: string, _ttl: number, loader: () => Promise<T>) {
    const cached = await this.get<T>(key)
    if (cached !== null) return cached
    const value = await loader()
    await this.set(key, value)
    return value
  }
}

export const scenario = (overrides: Partial<PracticeScenario> = {}): PracticeScenario => ({
  context: 'Vendo FlowCRM, un CRM para equipos comerciales',
  prospect: 'Lucía Fernández, Head of Sales en Nubia Retail',
  prospectName: 'Lucía Fernández',
  prospectRole: 'Head of Sales',
  prospectCompany: 'Nubia Retail',
  advancedSelections: { modo: 'Descubrimiento', tono: 'Analítico' },
  ...overrides,
})

export class InMemoryPracticeRepository implements PracticeRepositoryPort {
  sessions = new Map<string, PracticeSessionRecord>()
  simulations = new Map<string, SimulationRecord>()
  /** Si es true, `claimForEvaluation` simula que otra petición ganó la carrera. */
  loseNextClaim = false

  async listSessions(userId: string, limit: number) {
    return [...this.sessions.values()]
      .filter((s) => s.userId === userId)
      .map((s) => this.withSimulations(s))
      .filter((s) => s.simulations.length > 0)
      .slice(0, limit)
  }
  async findSession(userId: string, sessionId: string) {
    const session = this.sessions.get(sessionId)
    return session && session.userId === userId ? this.withSimulations(session) : null
  }
  async createSession(userId: string, data: { name: string; voiceName: string; scenario: PracticeScenario }) {
    const now = new Date()
    const session: PracticeSessionRecord = { id: randomUUID(), userId, name: data.name, nameIsAuto: true, voiceName: data.voiceName, scenario: data.scenario, createdAt: now, updatedAt: now }
    this.sessions.set(session.id, session)
    return session
  }
  async renameSession(userId: string, sessionId: string, name: string) {
    const session = this.sessions.get(sessionId)
    if (!session || session.userId !== userId) return false
    this.sessions.set(sessionId, { ...session, name, nameIsAuto: false })
    return true
  }
  async deleteSession(userId: string, sessionId: string) {
    const session = this.sessions.get(sessionId)
    if (!session || session.userId !== userId) return false
    this.sessions.delete(sessionId)
    return true
  }
  async createSimulation(userId: string, sessionId: string) {
    const now = new Date()
    const sim: SimulationRecord = { id: randomUUID(), sessionId, userId, status: 'IN_CALL', durationSeconds: null, result: null, failureReason: null, statusChangedAt: now, createdAt: now }
    this.simulations.set(sim.id, sim)
    return sim
  }
  async findSimulation(userId: string, simulationId: string) {
    const sim = this.simulations.get(simulationId)
    if (!sim || sim.userId !== userId) return null
    return { ...sim, session: this.sessions.get(sim.sessionId)! }
  }
  async claimForEvaluation(simulationId: string, expectedStatus: SimulationRecord['status'], expectedChangedAt: Date) {
    const sim = this.simulations.get(simulationId)
    if (this.loseNextClaim) {
      this.loseNextClaim = false
      return false
    }
    if (!sim || sim.status !== expectedStatus || sim.statusChangedAt.getTime() !== expectedChangedAt.getTime()) return false
    this.simulations.set(simulationId, { ...sim, status: 'EVALUATING', statusChangedAt: new Date() })
    return true
  }
  async completeSimulation(simulationId: string, durationSeconds: number, result: EvaluationResult) {
    const sim = this.simulations.get(simulationId)!
    const { suggestedTitle, ...stored } = result
    this.simulations.set(simulationId, { ...sim, status: 'COMPLETED', durationSeconds, result: stored, statusChangedAt: new Date() })
    const session = this.sessions.get(sim.sessionId)!
    if (session.nameIsAuto) this.sessions.set(session.id, { ...session, name: suggestedTitle, nameIsAuto: false })
  }
  async failSimulation(simulationId: string, durationSeconds: number, reason: string) {
    const sim = this.simulations.get(simulationId)!
    this.simulations.set(simulationId, { ...sim, status: 'FAILED', durationSeconds, failureReason: reason, statusChangedAt: new Date() })
  }

  private withSimulations(session: PracticeSessionRecord): SessionWithSimulations {
    const simulations = [...this.simulations.values()].filter((s) => s.sessionId === session.id && s.status === 'COMPLETED')
    return { ...session, simulations }
  }
}

/** IA programable: cada método se puede reemplazar por prueba. */
export class StubConversationAi implements ConversationAiPort {
  calls = { extractProfile: 0, coachTip: 0, evaluate: 0, generateScenario: 0 }
  extractResult: Awaited<ReturnType<ConversationAiPort['extractProfile']>> = { name: 'Lucía Fernández', role: 'Head of Sales', company: 'Nubia Retail', gender: 'female' }
  evaluateResult: AiEvaluation | Error = {
    suggestedTitle: 'Lucía: Descubrimiento del pipeline',
    turns: [
      { turn: 1, evaluation: 'good', title: 'Buena pregunta', diagnostic: 'Preguntaste por el proceso', improvement: null },
      { turn: 2, evaluation: 'critical', title: 'Precio antes de valor', diagnostic: 'Ofreciste descuento', improvement: 'Cuantifica el problema' },
    ],
    skills: { values: [60, 70, 40, 35, 55], improvementMessage: 'Valida y reencuadra' },
  }
  coachResult: string | Error = 'Pregunta por el impacto'
  extractError: Error | null = null

  async extractProfile() {
    this.calls.extractProfile++
    if (this.extractError) throw this.extractError
    return this.extractResult
  }
  async coachTip() {
    this.calls.coachTip++
    if (this.coachResult instanceof Error) throw this.coachResult
    return this.coachResult
  }
  async generateScenario() {
    this.calls.generateScenario++
    return { prospectName: 'Ana', productName: 'X', scenarioTheme: 'Cierre', context: 'c', prospect: 'p' }
  }
  async evaluate() {
    this.calls.evaluate++
    if (this.evaluateResult instanceof Error) throw this.evaluateResult
    return this.evaluateResult
  }
}

export class StubLiveVoice implements LiveVoicePort {
  lastPrompt = ''
  lastVoice = ''
  async createSessionAccess(params: { systemPrompt: string; voiceName: string }) {
    this.lastPrompt = params.systemPrompt
    this.lastVoice = params.voiceName
    return { provider: 'fake' as const, token: 'tok', model: 'm', voiceName: params.voiceName, expiresAt: new Date().toISOString() }
  }
}

export const sampleTranscript = [
  { role: 'model', text: '¿Aló?' },
  { role: 'user', text: 'Hola Lucía, ¿cómo gestionan su pipeline?' },
  { role: 'model', text: 'Con hojas de cálculo.' },
  { role: 'user', text: 'Te doy descuento si firmas hoy.' },
]
