import { ExternalServiceError } from '../../../../shared/domain/errors'
import type { AppConfig } from '../../../../shared/infrastructure/config/app-config.service'
import { scenario } from '../../../../test-support/fakes'
import { GeminiConversationAiAdapter } from './gemini-conversation-ai.adapter'
import { GeminiLiveVoiceAdapter } from './gemini-live-voice.adapter'

const generateContent = jest.fn()
const createToken = jest.fn()

jest.mock('@google/genai', () => ({
  Modality: { AUDIO: 'AUDIO' },
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: { generateContent },
    authTokens: { create: createToken },
  })),
}))

const config = {
  get: (key: string) =>
    ({ GEMINI_API_KEY: 'key', GEMINI_TEXT_MODEL: 'text-model', GEMINI_LIVE_MODEL: 'live-model' })[key],
} as unknown as AppConfig

const reply = (data: unknown) => ({ text: JSON.stringify(data) })

describe('GeminiConversationAiAdapter (ADR-004)', () => {
  beforeEach(() => {
    jest.useFakeTimers({ advanceTimers: true })
    generateContent.mockReset()
  })
  afterEach(() => jest.useRealTimers())

  it('pide salida JSON con esquema y temperatura baja al evaluar', async () => {
    generateContent.mockResolvedValue(reply({ turns: [], skills: { values: [1, 2, 3, 4, 5] } }))
    const adapter = new GeminiConversationAiAdapter(config)
    await adapter.evaluate({ scenario: scenario(), turns: [{ turn: 1, ia: '¿Aló?', tu: 'Hola' }], durationSeconds: 30 })

    const call = generateContent.mock.calls[0][0]
    expect(call.model).toBe('text-model')
    expect(call.config).toMatchObject({ responseMimeType: 'application/json', temperature: 0.1 })
    expect(call.config.responseJsonSchema.required).toEqual(['suggestedTitle', 'turns', 'skills'])
    expect(call.contents).toContain('[TURNO 1]')
    expect(call.contents).toContain('<datos>')
  })

  it('reintenta la evaluación con backoff y luego responde (CA-05.5)', async () => {
    generateContent
      .mockRejectedValueOnce(new Error('503'))
      .mockRejectedValueOnce(new Error('503'))
      .mockResolvedValueOnce(reply({ turns: [], skills: { values: [] } }))
    const adapter = new GeminiConversationAiAdapter(config)
    await expect(adapter.evaluate({ scenario: scenario(), turns: [], durationSeconds: 1 })).resolves.toBeDefined()
    expect(generateContent).toHaveBeenCalledTimes(3)
  })

  it('tras 3 fallos lanza ExternalServiceError (CA-05.5)', async () => {
    generateContent.mockRejectedValue(new Error('timeout'))
    const adapter = new GeminiConversationAiAdapter(config)
    await expect(adapter.evaluate({ scenario: scenario(), turns: [], durationSeconds: 1 })).rejects.toThrow(ExternalServiceError)
    expect(generateContent).toHaveBeenCalledTimes(3)
  })

  it('las operaciones rápidas (extracción, coach) no reintentan', async () => {
    generateContent.mockRejectedValue(new Error('timeout'))
    const adapter = new GeminiConversationAiAdapter(config)
    await expect(adapter.coachTip({ scenario: scenario(), transcript: [] })).rejects.toThrow(ExternalServiceError)
    expect(generateContent).toHaveBeenCalledTimes(1)
  })

  it('normaliza el género desconocido a "unknown"', async () => {
    generateContent.mockResolvedValue(reply({ name: 'Ana', role: 'CFO', company: 'X', gender: 'otro' }))
    await expect(new GeminiConversationAiAdapter(config).extractProfile('Ana, CFO en X')).resolves.toEqual({
      name: 'Ana',
      role: 'CFO',
      company: 'X',
      gender: 'unknown',
    })
  })

  it('genera escenarios y consejos', async () => {
    const adapter = new GeminiConversationAiAdapter(config)
    generateContent.mockResolvedValueOnce(reply({ prospectName: 'Ana', productName: 'P', scenarioTheme: 'Cierre', context: 'c', prospect: 'p' }))
    await expect(adapter.generateScenario()).resolves.toMatchObject({ prospectName: 'Ana' })
    generateContent.mockResolvedValueOnce(reply({ tip: 'Pregunta por el impacto' }))
    await expect(adapter.coachTip({ scenario: scenario(), transcript: [{ role: 'user', text: 'hola' }] })).resolves.toBe('Pregunta por el impacto')
  })
})

describe('GeminiLiveVoiceAdapter (ADR-007)', () => {
  beforeEach(() => createToken.mockReset())

  it('emite un token de un solo uso con prompt, voz y modelo bloqueados (CA-03.1)', async () => {
    createToken.mockResolvedValue({ name: 'auth_tokens/abc' })
    const access = await new GeminiLiveVoiceAdapter(config).createSessionAccess({ systemPrompt: 'Eres Lucía', voiceName: 'Kore', maxSessionMinutes: 10 })

    expect(access).toMatchObject({ provider: 'gemini', token: 'auth_tokens/abc', model: 'live-model', voiceName: 'Kore' })
    const tokenConfig = createToken.mock.calls[0][0].config
    expect(tokenConfig.uses).toBe(1)
    expect(tokenConfig.liveConnectConstraints).toMatchObject({
      model: 'live-model',
      config: { systemInstruction: 'Eres Lucía', speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } },
    })
  })

  it('si Google no devuelve token lanza ExternalServiceError', async () => {
    createToken.mockResolvedValue({})
    await expect(
      new GeminiLiveVoiceAdapter(config).createSessionAccess({ systemPrompt: 'x', voiceName: 'Kore', maxSessionMinutes: 10 }),
    ).rejects.toThrow(ExternalServiceError)
  })
})
