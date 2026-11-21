/**
 * Llamada de voz activa (singleton de módulo). Se crea durante la pantalla de carga de /setup,
 * así cuando /simulation se monta el prospecto ya está conectado (preconexión).
 */
import type { VoiceSession } from '@/lib/voice/voice-session'

let instance: VoiceSession | null = null

export function setActiveGeminiSession(session: VoiceSession | null) {
  instance = session
}

export function getActiveGeminiSession(): VoiceSession | null {
  return instance
}

export function clearActiveGeminiSession() {
  if (!instance) return
  try {
    instance.disconnect()
  } catch {
    // ignorar
  }
  instance = null
}
