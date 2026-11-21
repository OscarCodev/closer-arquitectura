import { ConflictError, ExternalServiceError, NotFoundError, ValidationError } from '../../../shared/domain/errors'
import { InMemoryCache, InMemoryPracticeRepository, sampleTranscript, scenario, StubConversationAi } from '../../../test-support/fakes'
import { EvaluateSimulationUseCase } from './evaluate-simulation.use-case'
import { sessionsCacheKey } from './sessions.use-cases'

const USER = 'user-a'

async function setup() {
  const repo = new InMemoryPracticeRepository()
  const ai = new StubConversationAi()
  const cache = new InMemoryCache()
  const useCase = new EvaluateSimulationUseCase(repo, ai, cache)
  const session = await repo.createSession(USER, { name: 'Práctica con Lucía', voiceName: 'Kore', scenario: scenario() })
  const simulation = await repo.createSimulation(USER, session.id)
  return { repo, ai, cache, useCase, session, simulation }
}

describe('EvaluateSimulationUseCase (SPEC-05)', () => {
  it('evalúa, guarda COMPLETED con puntaje del servidor y renombra la sesión (CA-05.1, CA-05.8)', async () => {
    const { repo, useCase, simulation } = await setup()
    const result = await useCase.execute(USER, simulation.id, { transcript: sampleTranscript, durationSeconds: 80 })

    const stored = repo.simulations.get(simulation.id)!
    expect(stored.status).toBe('COMPLETED')
    expect(stored.result!.metrics).toMatchObject({ turns: 2, errors: 1, brillantes: 1, duration: '01:20' })
    expect(result.name).toBe('Lucía: Descubrimiento del pipeline')
    expect(result.simulations).toHaveLength(1)
  })

  it('invalida la caché del historial del usuario', async () => {
    const { cache, useCase, simulation } = await setup()
    await cache.set(sessionsCacheKey(USER), ['viejo'], 60)
    await useCase.execute(USER, simulation.id, { transcript: sampleTranscript, durationSeconds: 30 })
    expect(cache.deleted).toContain(sessionsCacheKey(USER))
  })

  it('es idempotente: reevaluar un COMPLETED devuelve lo guardado sin llamar a la IA (CA-05.3)', async () => {
    const { ai, repo, useCase, simulation } = await setup()
    await useCase.execute(USER, simulation.id, { transcript: sampleTranscript, durationSeconds: 30 })
    const firstScore = repo.simulations.get(simulation.id)!.result!.metrics.score

    const again = await useCase.execute(USER, simulation.id, { transcript: [], durationSeconds: 1 })
    expect(ai.calls.evaluate).toBe(1)
    expect(again.simulations[0].result!.metrics.score).toBe(firstScore)
  })

  it('responde 409 si otra petición ya la está evaluando (CA-05.4)', async () => {
    const { repo, useCase, simulation } = await setup()
    repo.simulations.set(simulation.id, { ...simulation, status: 'EVALUATING', statusChangedAt: new Date() })
    await expect(useCase.execute(USER, simulation.id, { transcript: sampleTranscript, durationSeconds: 30 })).rejects.toThrow(ConflictError)
  })

  it('responde 409 si pierde la reserva atómica contra otra petición simultánea (CA-05.4)', async () => {
    const { repo, ai, useCase, simulation } = await setup()
    repo.loseNextClaim = true
    await expect(useCase.execute(USER, simulation.id, { transcript: sampleTranscript, durationSeconds: 30 })).rejects.toThrow(ConflictError)
    expect(ai.calls.evaluate).toBe(0)
  })

  it('si la IA falla, queda FAILED sin feedback inventado y se puede reintentar (CA-05.5)', async () => {
    const { ai, repo, useCase, simulation } = await setup()
    ai.evaluateResult = new Error('timeout')
    await expect(useCase.execute(USER, simulation.id, { transcript: sampleTranscript, durationSeconds: 30 })).rejects.toThrow(
      ExternalServiceError,
    )
    expect(repo.simulations.get(simulation.id)).toMatchObject({ status: 'FAILED', result: null })

    ai.evaluateResult = new StubConversationAi().evaluateResult
    await useCase.execute(USER, simulation.id, { transcript: sampleTranscript, durationSeconds: 30 })
    expect(repo.simulations.get(simulation.id)!.status).toBe('COMPLETED')
  })

  it('si la salida de la IA es inválida, queda FAILED con el motivo (CA-05.5)', async () => {
    const { ai, repo, useCase, simulation } = await setup()
    ai.evaluateResult = { turns: [], skills: { values: [] } }
    await expect(useCase.execute(USER, simulation.id, { transcript: sampleTranscript, durationSeconds: 30 })).rejects.toThrow(
      ExternalServiceError,
    )
    expect(repo.simulations.get(simulation.id)!.failureReason).toMatch(/no cubre suficientes turnos/)
  })

  it('una llamada sin intercambios es 400 y queda FAILED sin llamar a la IA (CA-05.6)', async () => {
    const { ai, repo, useCase, simulation } = await setup()
    await expect(useCase.execute(USER, simulation.id, { transcript: [], durationSeconds: 3 })).rejects.toThrow(ValidationError)
    expect(repo.simulations.get(simulation.id)!.status).toBe('FAILED')
    expect(ai.calls.evaluate).toBe(0)
  })

  it('acota la duración a 0-660 segundos', async () => {
    const { repo, useCase, simulation } = await setup()
    await useCase.execute(USER, simulation.id, { transcript: sampleTranscript, durationSeconds: 99_999 })
    expect(repo.simulations.get(simulation.id)!.durationSeconds).toBe(660)
  })

  it('otro usuario no puede evaluar la simulación (404)', async () => {
    const { useCase, simulation } = await setup()
    await expect(useCase.execute('user-b', simulation.id, { transcript: sampleTranscript, durationSeconds: 30 })).rejects.toThrow(
      NotFoundError,
    )
  })
})
