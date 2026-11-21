import { Inject, Injectable, Logger } from '@nestjs/common'
import { CACHE, type CachePort } from '../../../shared/application/ports/cache.port'
import { ConflictError, ExternalServiceError, NotFoundError, ValidationError } from '../../../shared/domain/errors'
import { assembleEvaluation, InvalidEvaluationError } from '../domain/evaluation'
import { decideEvaluation, type SessionWithSimulations } from '../domain/practice-session'
import { buildTurns, mergeTranscript, sanitizeTranscript } from '../domain/transcript'
import { CONVERSATION_AI, PRACTICE_REPOSITORY, type ConversationAiPort, type PracticeRepositoryPort } from './ports'
import { sessionsCacheKey } from './sessions.use-cases'
import { MAX_CALL_MINUTES } from './start-simulation.use-case'

export type EvaluateSimulationInput = {
  transcript: unknown
  durationSeconds: number
}

/**
 * Evalúa una llamada terminada y guarda el resultado en el servidor (ADR-006):
 *  - Idempotente: si ya está COMPLETED devuelve lo guardado; si otra petición la está evaluando, 409.
 *  - El puntaje lo calcula el servidor; el cliente solo envía la transcripción.
 *  - Si la IA falla, la simulación queda FAILED (sin feedback inventado) y puede reintentarse.
 */
@Injectable()
export class EvaluateSimulationUseCase {
  private readonly logger = new Logger(EvaluateSimulationUseCase.name)

  constructor(
    @Inject(PRACTICE_REPOSITORY) private readonly repo: PracticeRepositoryPort,
    @Inject(CONVERSATION_AI) private readonly ai: ConversationAiPort,
    @Inject(CACHE) private readonly cache: CachePort,
  ) {}

  async execute(userId: string, simulationId: string, input: EvaluateSimulationInput): Promise<SessionWithSimulations> {
    const simulation = await this.repo.findSimulation(userId, simulationId)
    if (!simulation) throw new NotFoundError('Simulación no encontrada')

    const decision = decideEvaluation(simulation, new Date())
    if (decision === 'already-completed') return this.loadSession(userId, simulation.sessionId)
    if (decision === 'in-progress') throw new ConflictError('Esta llamada ya se está evaluando.')

    const claimed = await this.repo.claimForEvaluation(simulation.id, simulation.status, simulation.statusChangedAt)
    if (!claimed) throw new ConflictError('Esta llamada ya se está evaluando.')

    const durationSeconds = Math.max(0, Math.min(MAX_CALL_MINUTES * 60 + 60, Math.round(input.durationSeconds || 0)))
    const merged = mergeTranscript(sanitizeTranscript(input.transcript))
    const turns = buildTurns(merged)

    if (turns.length === 0) {
      await this.repo.failSimulation(simulation.id, durationSeconds, 'La llamada no tuvo intercambios.')
      throw new ValidationError('La llamada no tuvo intercambios para evaluar.')
    }

    try {
      const aiEvaluation = await this.ai.evaluate({ scenario: simulation.session.scenario, turns, durationSeconds })
      const result = assembleEvaluation({ merged, durationSeconds, scenario: simulation.session.scenario, ai: aiEvaluation })
      await this.repo.completeSimulation(simulation.id, durationSeconds, result)
    } catch (error) {
      const reason = error instanceof InvalidEvaluationError ? error.message : 'El evaluador de IA no respondió.'
      this.logger.warn(`Evaluación ${simulation.id} falló: ${(error as Error).message}`)
      await this.repo.failSimulation(simulation.id, durationSeconds, reason)
      throw new ExternalServiceError(`${reason} Puedes reintentar la evaluación.`)
    } finally {
      await this.cache.delete(sessionsCacheKey(userId))
    }

    return this.loadSession(userId, simulation.sessionId)
  }

  private async loadSession(userId: string, sessionId: string) {
    const session = await this.repo.findSession(userId, sessionId)
    if (!session) throw new NotFoundError('Sesión no encontrada')
    return session
  }
}
