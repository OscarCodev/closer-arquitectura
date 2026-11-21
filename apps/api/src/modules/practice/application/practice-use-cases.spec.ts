import { ConflictError, NotFoundError, ValidationError } from '../../../shared/domain/errors'
import { InMemoryCache, InMemoryPracticeRepository, sampleTranscript, scenario, StubConversationAi, StubLiveVoice } from '../../../test-support/fakes'
import { CoachTipUseCase, ExtractProfileUseCase } from './ai-assist.use-cases'
import { DeleteSessionUseCase, ListSessionsUseCase, RenameSessionUseCase, sessionsCacheKey } from './sessions.use-cases'
import { StartSimulationUseCase } from './start-simulation.use-case'

const USER = 'user-a'
const newScenario = { context: 'Vendo FlowCRM', prospect: 'Lucía Fernández, Head of Sales en Nubia Retail' }

describe('StartSimulationUseCase (SPEC-03)', () => {
  const build = () => {
    const repo = new InMemoryPracticeRepository()
    const ai = new StubConversationAi()
    const voice = new StubLiveVoice()
    return { repo, ai, voice, useCase: new StartSimulationUseCase(repo, ai, voice) }
  }

  it('crea sesión e intento IN_CALL y entrega el token con el prompt del servidor (CA-03.1)', async () => {
    const { repo, voice, useCase } = build()
    const out = await useCase.execute(USER, { ...newScenario, advancedSelections: { modo: 'Cierre Venta', tono: 'Hostil' } })

    expect(repo.simulations.get(out.simulationId)).toMatchObject({ status: 'IN_CALL', sessionId: out.session.id })
    expect(out.session.name).toBe('Práctica con Lucía Fernández')
    expect(voice.lastPrompt).toContain('Eres Lucía Fernández, Head of Sales en Nubia Retail.')
    expect(voice.lastPrompt).toContain('TONO: Hostil')
    expect(out.live.token).toBe('tok')
  })

  it('extrae el perfil una sola vez y elige voz femenina (CA-03.2)', async () => {
    const { ai, voice, useCase } = build()
    await useCase.execute(USER, newScenario)
    expect(ai.calls.extractProfile).toBe(1)
    expect(['Aoede', 'Kore']).toContain(voice.lastVoice)
  })

  it('respeta los datos que ya trae el prospecto elegido de la biblioteca', async () => {
    const { useCase } = build()
    const out = await useCase.execute(USER, { ...newScenario, prospectName: 'Ana Torres' })
    expect(out.session.scenario.prospectName).toBe('Ana Torres')
  })

  it('si la extracción falla, la práctica igual arranca', async () => {
    const { ai, useCase } = build()
    ai.extractError = new Error('IA caída')
    const out = await useCase.execute(USER, newScenario)
    expect(out.session.scenario.prospectName).toBe('')
  })

  it('usa modo y tono por defecto si llegan valores desconocidos (CA-03.3)', async () => {
    const { useCase } = build()
    const out = await useCase.execute(USER, { ...newScenario, advancedSelections: { modo: '???', tono: '???' } })
    expect(out.session.scenario.advancedSelections).toEqual({ modo: 'Ciclo Completo', tono: 'Perfil Real' })
  })

  it('reintento: reutiliza escenario y voz sin volver a extraer (CA-03.4)', async () => {
    const { ai, repo, voice, useCase } = build()
    const first = await useCase.execute(USER, newScenario)
    const firstVoice = voice.lastVoice
    const retry = await useCase.execute(USER, { sessionId: first.session.id })
    expect(retry.session.id).toBe(first.session.id)
    expect(voice.lastVoice).toBe(firstVoice)
    expect(ai.calls.extractProfile).toBe(1)
    expect([...repo.simulations.values()].filter((s) => s.sessionId === first.session.id)).toHaveLength(2)
  })

  it('no permite reintentar la sesión de otro usuario (CA-03.5)', async () => {
    const { useCase } = build()
    const first = await useCase.execute(USER, newScenario)
    await expect(useCase.execute('user-b', { sessionId: first.session.id })).rejects.toThrow(NotFoundError)
  })

  it.each([
    [{ context: 'x', prospect: 'abc' }, /al menos 5/],
    [{ context: 'x'.repeat(1401), prospect: 'Prospecto válido' }, /1400/],
  ])('valida la entrada %#', async (input, message) => {
    const { useCase } = build()
    await expect(useCase.execute(USER, input)).rejects.toThrow(message)
  })
})

describe('CoachTipUseCase (SPEC-04)', () => {
  const build = async () => {
    const repo = new InMemoryPracticeRepository()
    const ai = new StubConversationAi()
    const session = await repo.createSession(USER, { name: 's', voiceName: 'Kore', scenario: scenario() })
    const sim = await repo.createSimulation(USER, session.id)
    return { repo, ai, sim, useCase: new CoachTipUseCase(repo, ai) }
  }

  it('devuelve el consejo de la IA durante la llamada (CA-04.6)', async () => {
    const { useCase, sim } = await build()
    await expect(useCase.execute(USER, sim.id, sampleTranscript)).resolves.toBe('Pregunta por el impacto')
  })

  it('con menos de 2 intervenciones no llama a la IA', async () => {
    const { ai, useCase, sim } = await build()
    await useCase.execute(USER, sim.id, [{ role: 'model', text: '¿Aló?' }])
    expect(ai.calls.coachTip).toBe(0)
  })

  it('si la IA falla devuelve un consejo genérico', async () => {
    const { ai, useCase, sim } = await build()
    ai.coachResult = new Error('caída')
    await expect(useCase.execute(USER, sim.id, sampleTranscript)).resolves.toMatch(/pregunta de descubrimiento/)
  })

  it('409 si la llamada ya terminó (CA-04.7)', async () => {
    const { repo, useCase, sim } = await build()
    repo.simulations.set(sim.id, { ...sim, status: 'COMPLETED' })
    await expect(useCase.execute(USER, sim.id, sampleTranscript)).rejects.toThrow(ConflictError)
  })
})

describe('Sesiones (SPEC-06)', () => {
  const build = async () => {
    const repo = new InMemoryPracticeRepository()
    const cache = new InMemoryCache()
    const session = await repo.createSession(USER, { name: 'Original', voiceName: 'Kore', scenario: scenario() })
    const sim = await repo.createSimulation(USER, session.id)
    repo.simulations.set(sim.id, { ...sim, status: 'COMPLETED', result: { metrics: {} as never, conversation: [], analysis: {} as never, transcript: '' } })
    return { repo, cache, session }
  }

  it('el listado se cachea: la segunda lectura no consulta el repositorio', async () => {
    const { repo, cache } = await build()
    const spy = jest.spyOn(repo, 'listSessions')
    const useCase = new ListSessionsUseCase(repo, cache)
    const first = await useCase.execute(USER)
    const second = await useCase.execute(USER)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(second[0].createdAt).toBeInstanceOf(Date)
    expect(second[0].id).toBe(first[0].id)
  })

  it('renombrar persiste, desactiva el nombre automático e invalida la caché (CA-06.4)', async () => {
    const { repo, cache, session } = await build()
    await new RenameSessionUseCase(repo, cache).execute(USER, session.id, '  Lucía: pipeline  ')
    expect(repo.sessions.get(session.id)).toMatchObject({ name: 'Lucía: pipeline', nameIsAuto: false })
    expect(cache.deleted).toContain(sessionsCacheKey(USER))
  })

  it('no acepta un nombre vacío', async () => {
    const { repo, cache, session } = await build()
    await expect(new RenameSessionUseCase(repo, cache).execute(USER, session.id, '   ')).rejects.toThrow(ValidationError)
  })

  it('otro usuario no puede borrar la sesión (CA-06.6)', async () => {
    const { repo, cache, session } = await build()
    await expect(new DeleteSessionUseCase(repo, cache).execute('user-b', session.id)).rejects.toThrow(NotFoundError)
    expect(repo.sessions.has(session.id)).toBe(true)
  })
})

describe('ExtractProfileUseCase', () => {
  it('un texto muy corto no llama a la IA', async () => {
    const ai = new StubConversationAi()
    await expect(new ExtractProfileUseCase(ai).execute('abc')).resolves.toMatchObject({ name: '', gender: 'unknown' })
    expect(ai.calls.extractProfile).toBe(0)
  })

  it('si la IA falla devuelve campos vacíos', async () => {
    const ai = new StubConversationAi()
    ai.extractError = new Error('caída')
    await expect(new ExtractProfileUseCase(ai).execute('Martín Rojas, CFO')).resolves.toMatchObject({ name: '' })
  })
})
