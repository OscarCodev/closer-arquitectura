import { Inject, Injectable, Logger } from '@nestjs/common'
import { NotFoundError, ValidationError } from '../../../shared/domain/errors'
import { MAX_PRACTICE_FIELD_CHARS, normalizeStructuredValue } from '../../../shared/domain/text'
import { provisionalSessionName, type PracticeSessionRecord } from '../domain/practice-session'
import { buildProspectSystemPrompt, normalizeSelections, selectVoice } from '../domain/prospect-persona'
import type { AdvancedSelections, PracticeScenario, ProspectGender } from '../domain/types'
import {
  CONVERSATION_AI,
  LIVE_VOICE,
  PRACTICE_REPOSITORY,
  type ConversationAiPort,
  type LiveSessionAccess,
  type LiveVoicePort,
  type PracticeRepositoryPort,
} from './ports'

/** Duración máxima de una llamada; el token efímero vence a los pocos minutos de este límite. */
export const MAX_CALL_MINUTES = 10

type NewScenarioInput = {
  context: string
  prospect: string
  prospectName?: string
  prospectRole?: string
  prospectCompany?: string
  advancedSelections?: Partial<AdvancedSelections>
}

/** Reintento (`sessionId`) o escenario nuevo. */
export type StartSimulationInput = { sessionId: string } | NewScenarioInput

export type StartSimulationOutput = {
  simulationId: string
  session: PracticeSessionRecord
  live: LiveSessionAccess
}

/**
 * Inicia un intento de práctica:
 *  1. Crea la sesión (escenario nuevo) o reutiliza la existente (reintento).
 *  2. Registra la simulación en estado IN_CALL: la evaluación posterior queda atada a ella.
 *  3. Pide al proveedor de voz un token efímero con el prompt armado en el servidor.
 */
@Injectable()
export class StartSimulationUseCase {
  private readonly logger = new Logger(StartSimulationUseCase.name)

  constructor(
    @Inject(PRACTICE_REPOSITORY) private readonly repo: PracticeRepositoryPort,
    @Inject(CONVERSATION_AI) private readonly ai: ConversationAiPort,
    @Inject(LIVE_VOICE) private readonly voice: LiveVoicePort,
  ) {}

  async execute(userId: string, input: StartSimulationInput): Promise<StartSimulationOutput> {
    const session =
      'sessionId' in input && input.sessionId
        ? await this.loadSession(userId, input.sessionId)
        : await this.createSession(userId, input as NewScenarioInput)

    const simulation = await this.repo.createSimulation(userId, session.id)
    const live = await this.voice.createSessionAccess({
      systemPrompt: buildProspectSystemPrompt(session.scenario),
      voiceName: session.voiceName ?? selectVoice('unknown', session.id),
      maxSessionMinutes: MAX_CALL_MINUTES,
    })

    return { simulationId: simulation.id, session, live }
  }

  private async loadSession(userId: string, sessionId: string) {
    const session = await this.repo.findSession(userId, sessionId)
    if (!session) throw new NotFoundError('Sesión no encontrada')
    return session
  }

  private async createSession(userId: string, input: NewScenarioInput) {
    const prospect = (input.prospect ?? '').trim()
    const context = (input.context ?? '').trim()
    if (prospect.length < 5) throw new ValidationError('Describe al prospecto (al menos 5 caracteres).')
    if (prospect.length > MAX_PRACTICE_FIELD_CHARS || context.length > MAX_PRACTICE_FIELD_CHARS) {
      throw new ValidationError(`Contexto y perfil deben tener como máximo ${MAX_PRACTICE_FIELD_CHARS} caracteres.`)
    }

    let prospectName = normalizeStructuredValue(input.prospectName)
    let prospectRole = normalizeStructuredValue(input.prospectRole)
    let prospectCompany = normalizeStructuredValue(input.prospectCompany)
    let gender: ProspectGender = 'unknown'

    // Una sola extracción por inicio (el MVP la hacía dos veces). Si falla, se sigue con lo que hay.
    try {
      const extracted = await this.ai.extractProfile(prospect)
      prospectName ||= normalizeStructuredValue(extracted.name)
      prospectRole ||= normalizeStructuredValue(extracted.role)
      prospectCompany ||= normalizeStructuredValue(extracted.company)
      gender = extracted.gender
    } catch (error) {
      this.logger.warn(`Extracción de perfil falló: ${(error as Error).message}`)
    }

    const scenario: PracticeScenario = {
      context,
      prospect,
      prospectName: prospectName.slice(0, 120),
      prospectRole: prospectRole.slice(0, 120),
      prospectCompany: prospectCompany.slice(0, 120),
      advancedSelections: normalizeSelections(input.advancedSelections),
    }

    return this.repo.createSession(userId, {
      name: provisionalSessionName(scenario),
      voiceName: selectVoice(gender, `${prospectName}|${prospect}`),
      scenario,
    })
  }
}
