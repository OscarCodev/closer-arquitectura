import type { TranscriptItem, VoiceMetrics } from './types'

/**
 * Muletillas detectadas. Se quitaron "este" y "pues" (observación del MVP):
 * en español son palabras normales ("este producto") y generaban falsos positivos.
 */
export const FILLER_WORDS = ['eh', 'em', 'mmm', 'o sea', 'digamos', 'tipo']

/** Promedio aproximado de palabras por segundo al hablar, para estimar monólogos. */
const WORDS_PER_SECOND = 2.2

export function wordsIn(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export function formatDuration(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function durationToSeconds(value: string) {
  const [m = '0', s = '0'] = value.split(':')
  return (Number.parseInt(m, 10) || 0) * 60 + (Number.parseInt(s, 10) || 0)
}

/**
 * Métricas de voz estimadas a partir de la transcripción (no del audio).
 * Se presentan como estimaciones en la interfaz.
 */
export function buildVoiceMetrics(merged: TranscriptItem[], durationSeconds: number): VoiceMetrics {
  const userItems = merged.filter((item) => item.role === 'user')
  const userWords = userItems.reduce((sum, item) => sum + wordsIn(item.text), 0)
  const modelWords = merged.filter((item) => item.role === 'model').reduce((sum, item) => sum + wordsIn(item.text), 0)
  const totalWords = Math.max(userWords + modelWords, 1)

  const userSpeakingSeconds = userItems.reduce((sum, item) => {
    if (typeof item.startedAt !== 'number' || typeof item.endedAt !== 'number') return sum
    const delta = (item.endedAt - item.startedAt) / 1000
    return delta > 0 && delta <= 180 ? sum + delta : sum
  }, 0)

  const minutes = Math.max((userSpeakingSeconds > 2 ? userSpeakingSeconds : durationSeconds) / 60, 0.5)
  const speechRate = userWords === 0 ? 0 : Math.max(1, Math.round(userWords / minutes))
  const talk = Math.round((userWords / totalWords) * 100)
  const listen = Math.max(0, 100 - talk)

  const fillerExamples = FILLER_WORDS.map((word) => {
    const regex = new RegExp(`(?<![\\p{L}])${word.replace(/\s+/g, '\\s+')}(?![\\p{L}])`, 'giu')
    const count = userItems.reduce((sum, item) => sum + (item.text.match(regex)?.length ?? 0), 0)
    return { text: word, count }
  }).filter((example) => example.count > 0)
  const fillerCount = fillerExamples.reduce((sum, item) => sum + item.count, 0)

  const longestMonologueSeconds = Math.round(Math.max(0, ...userItems.map((item) => wordsIn(item.text) / WORDS_PER_SECOND)))

  return {
    speechRate: {
      value: speechRate,
      unit: 'ppm',
      insight:
        speechRate > 165
          ? 'Ritmo alto. Conviene bajar un poco la velocidad para sonar más consultivo.'
          : speechRate < 125
            ? 'Ritmo algo lento. Sube un poco la energía sin perder claridad.'
            : 'Buen ritmo general para una conversación comercial.',
    },
    talkListenRatio: {
      talk,
      listen,
      insight: talk > 60 ? 'Hablaste bastante. Busca dejar más espacio para diagnosticar.' : 'Buen balance entre hablar y escuchar.',
    },
    longestMonologue: {
      value: formatDuration(longestMonologueSeconds),
      insight:
        longestMonologueSeconds > 90
          ? 'Hubo un bloque largo de explicación. Intenta segmentar con preguntas.'
          : 'Los bloques de habla se mantuvieron razonables.',
    },
    fillers: {
      count: fillerCount,
      examples: fillerExamples.length > 0 ? fillerExamples : [{ text: 'sin muletillas relevantes', count: 0 }],
      insight: fillerCount > 4 ? 'Aparecieron varias muletillas. Respira antes de responder.' : 'Buen control verbal; pocas muletillas detectadas.',
    },
  }
}
