import { appConfig } from '@/lib/config'
import type { LiveAccess } from '@/lib/api/closer-api'
import { GeminiLiveSession } from './gemini-live-session'
import { ScriptedVoiceSession } from './scripted-voice-session'

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected'

export interface VoiceCallbacks {
  onStatusChange: (status: ConnectionStatus) => void
  onAudioLevel: (level: number) => void
  onModelAudioLevel: (level: number) => void
  onTranscript: (role: 'user' | 'model', text: string, finished?: boolean) => void
  onError: (error: string) => void
  onInterrupted: () => void
}

/** Contrato común de una llamada de voz (Gemini Live real o guion simulado). */
export interface VoiceSession {
  connect(): Promise<void>
  startConversation(): void
  hasConversationStarted(): boolean
  toggleMute(): boolean
  disconnect(): void
}

/**
 * Elige la implementación: si el backend devolvió un token simulado o el frontend está en modo `mock`,
 * se usa el guion; si no, la conexión real con Gemini Live.
 */
export function createVoiceSession(live: LiveAccess, callbacks: VoiceCallbacks): VoiceSession {
  if (live.provider === 'fake' || appConfig.voiceMode === 'mock') return new ScriptedVoiceSession(callbacks)
  return new GeminiLiveSession(callbacks, live)
}
