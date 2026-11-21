import { Injectable } from '@nestjs/common'
import { GoogleGenAI, Modality } from '@google/genai'
import { ExternalServiceError } from '../../../../shared/domain/errors'
import { AppConfig } from '../../../../shared/infrastructure/config/app-config.service'
import type { LiveSessionAccess, LiveVoicePort } from '../../application/ports'

/** Margen para abrir la conexión después de recibir el token. */
const NEW_SESSION_WINDOW_MS = 2 * 60 * 1000

/**
 * Token efímero de Gemini Live con `liveConnectConstraints`: modelo, voz, transcripción y prompt
 * quedan fijados en el servidor. El navegador solo puede abrir esa sesión, una vez, por tiempo limitado.
 */
@Injectable()
export class GeminiLiveVoiceAdapter implements LiveVoicePort {
  private readonly client: GoogleGenAI
  private readonly model: string

  constructor(config: AppConfig) {
    this.client = new GoogleGenAI({ apiKey: config.get('GEMINI_API_KEY'), httpOptions: { apiVersion: 'v1alpha' } })
    this.model = config.get('GEMINI_LIVE_MODEL')
  }

  async createSessionAccess(params: { systemPrompt: string; voiceName: string; maxSessionMinutes: number }): Promise<LiveSessionAccess> {
    const now = Date.now()
    const expireTime = new Date(now + (params.maxSessionMinutes + 2) * 60 * 1000).toISOString()
    try {
      const token = await this.client.authTokens.create({
        config: {
          uses: 1,
          expireTime,
          newSessionExpireTime: new Date(now + NEW_SESSION_WINDOW_MS).toISOString(),
          liveConnectConstraints: {
            model: this.model,
            config: {
              responseModalities: [Modality.AUDIO],
              systemInstruction: params.systemPrompt,
              speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: params.voiceName } } },
              inputAudioTranscription: {},
              outputAudioTranscription: {},
            },
          },
          httpOptions: { apiVersion: 'v1alpha' },
        },
      })
      if (!token.name) throw new Error('respuesta sin token')
      return { provider: 'gemini', token: token.name, model: this.model, voiceName: params.voiceName, expiresAt: expireTime }
    } catch (error) {
      throw new ExternalServiceError(`No se pudo preparar la llamada de voz: ${(error as Error).message}`)
    }
  }
}
