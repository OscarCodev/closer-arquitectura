import { Injectable } from '@nestjs/common'
import { GoogleGenAI } from '@google/genai'
import { ExternalServiceError } from '../../../../shared/domain/errors'
import { AppConfig } from '../../../../shared/infrastructure/config/app-config.service'
import type { ConversationAiPort, ExtractedProfile, GeneratedScenario } from '../../application/ports'
import type { AiEvaluation } from '../../domain/evaluation'
import type { TurnPair } from '../../domain/transcript'
import type { PracticeScenario, TranscriptItem } from '../../domain/types'
import {
  COACH_SCHEMA,
  coachPrompt,
  EVALUATION_SCHEMA,
  evaluationPrompt,
  EXTRACT_PROFILE_SCHEMA,
  extractProfilePrompt,
  SCENARIO_SCHEMA,
  scenarioPrompt,
} from './prompts'

const RETRY_DELAYS_MS = [600, 1800]

/**
 * Adaptador de Gemini (texto). Usa salida estructurada (JSON Schema) y temperatura baja
 * para que la evaluación sea estable entre ejecuciones. La API key viaja en header, no en la URL.
 */
@Injectable()
export class GeminiConversationAiAdapter implements ConversationAiPort {
  private readonly client: GoogleGenAI
  private readonly model: string

  constructor(config: AppConfig) {
    this.client = new GoogleGenAI({ apiKey: config.get('GEMINI_API_KEY') })
    this.model = config.get('GEMINI_TEXT_MODEL')
  }

  async extractProfile(prospectText: string): Promise<ExtractedProfile> {
    const data = await this.generate<ExtractedProfile>(extractProfilePrompt(prospectText), EXTRACT_PROFILE_SCHEMA, 0.2, false)
    const gender = data.gender === 'female' || data.gender === 'male' ? data.gender : 'unknown'
    return { name: data.name ?? '', role: data.role ?? '', company: data.company ?? '', gender }
  }

  async coachTip(params: { scenario: PracticeScenario; transcript: TranscriptItem[] }): Promise<string> {
    const data = await this.generate<{ tip: string }>(coachPrompt(params.scenario, params.transcript), COACH_SCHEMA, 0.5, false)
    return data.tip ?? ''
  }

  generateScenario(): Promise<GeneratedScenario> {
    return this.generate<GeneratedScenario>(scenarioPrompt(Date.now() % 997), SCENARIO_SCHEMA, 0.9, false)
  }

  evaluate(params: { scenario: PracticeScenario; turns: TurnPair[]; durationSeconds: number }): Promise<AiEvaluation> {
    return this.generate<AiEvaluation>(
      evaluationPrompt(params.scenario, params.turns, params.durationSeconds),
      EVALUATION_SCHEMA,
      0.1,
      true,
    )
  }

  /** Llama al modelo con reintentos y backoff (solo para la evaluación, que es la que importa). */
  private async generate<T>(prompt: string, schema: object, temperature: number, retry: boolean): Promise<T> {
    const attempts = retry ? RETRY_DELAYS_MS.length + 1 : 1
    let lastError: unknown
    for (let attempt = 0; attempt < attempts; attempt++) {
      if (attempt > 0) await sleep(RETRY_DELAYS_MS[attempt - 1])
      try {
        const response = await this.client.models.generateContent({
          model: this.model,
          contents: prompt,
          config: { responseMimeType: 'application/json', responseJsonSchema: schema, temperature },
        })
        return JSON.parse(response.text ?? '{}') as T
      } catch (error) {
        lastError = error
      }
    }
    throw new ExternalServiceError(`Gemini no respondió: ${(lastError as Error)?.message ?? 'error desconocido'}`)
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
