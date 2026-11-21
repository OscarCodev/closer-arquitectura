/**
 * Module-level singleton that holds the active GeminiLiveAudio instance.
 * Created in the setup loading screen so the session is already connected
 * (or connecting) by the time the simulation page mounts.
 */

import type { GeminiLiveAudio } from '@/mocks/live-audio'

let _instance: GeminiLiveAudio | null = null

export function setActiveGeminiSession(instance: GeminiLiveAudio | null) {
  _instance = instance
}

export function getActiveGeminiSession(): GeminiLiveAudio | null {
  return _instance
}

export function clearActiveGeminiSession() {
  if (_instance) {
    try { _instance.disconnect() } catch { /* ignore */ }
    _instance = null
  }
}
