import { Inject, Injectable } from '@nestjs/common'
import { ConflictError, NotFoundError, ValidationError } from '../../../shared/domain/errors'
import { MAX_PRACTICE_FIELD_CHARS } from '../../../shared/domain/text'
import { mergeTranscript, sanitizeTranscript } from '../domain/transcript'
import { CONVERSATION_AI, PRACTICE_REPOSITORY, type ConversationAiPort, type PracticeRepositoryPort } from './ports'

const FALLBACK_TIP = 'Haz una pregunta de descubrimiento y valida lo que te responda antes de argumentar.'

/** Consejo en vivo. El contexto sale de la sesión guardada, no del cliente. */
@Injectable()
export class CoachTipUseCase {
  constructor(
    @Inject(PRACTICE_REPOSITORY) private readonly repo: PracticeRepositoryPort,
    @Inject(CONVERSATION_AI) private readonly ai: ConversationAiPort,
  ) {}

  async execute(userId: string, simulationId: string, rawTranscript: unknown): Promise<string> {
    const simulation = await this.repo.findSimulation(userId, simulationId)
    if (!simulation) throw new NotFoundError('Simulación no encontrada')
    if (simulation.status !== 'IN_CALL') throw new ConflictError('La llamada ya terminó.')

    const transcript = mergeTranscript(sanitizeTranscript(rawTranscript)).slice(-12)
    if (transcript.length < 2) return FALLBACK_TIP

    try {
      const tip = await this.ai.coachTip({ scenario: simulation.session.scenario, transcript })
      return tip.trim() || FALLBACK_TIP
    } catch {
      return FALLBACK_TIP
    }
  }
}

@Injectable()
export class ExtractProfileUseCase {
  constructor(@Inject(CONVERSATION_AI) private readonly ai: ConversationAiPort) {}

  async execute(prospect: string) {
    const text = prospect.trim()
    if (text.length < 5) return { name: '', role: '', company: '', gender: 'unknown' as const }
    if (text.length > MAX_PRACTICE_FIELD_CHARS) throw new ValidationError('Descripción demasiado larga.')
    try {
      return await this.ai.extractProfile(text)
    } catch {
      return { name: '', role: '', company: '', gender: 'unknown' as const }
    }
  }
}

@Injectable()
export class GenerateScenarioUseCase {
  constructor(@Inject(CONVERSATION_AI) private readonly ai: ConversationAiPort) {}

  execute() {
    return this.ai.generateScenario()
  }
}
