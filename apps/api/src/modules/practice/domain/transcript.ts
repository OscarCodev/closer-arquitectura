import type { TranscriptItem, TranscriptRole } from './types'

/** Límites contra abuso de costo y prompt injection: la transcripción entra acotada al evaluador. */
export const MAX_TRANSCRIPT_ITEMS = 400
export const MAX_TRANSCRIPT_CHARS = 24_000

export function normalizeReadableText(text: string) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/([,.;:!?])(?!\s|$)/g, '$1 ')
    .trim()
}

function hasWordBoundaryGap(left: string, right: string) {
  if (!left || !right) return false
  if (/\s$/.test(left) || /^\s/.test(right)) return false
  if (/[[({"'¿¡-]$/.test(left)) return false
  if (/^[,.;:!?)]/.test(right)) return false
  return /[\p{L}\p{N}]$/u.test(left) && /^[\p{L}\p{N}]/u.test(right)
}

function findMaxPrefixSuffixOverlap(left: string, right: string) {
  const max = Math.min(left.length, right.length)
  const minOverlap = Math.min(6, max)
  for (let size = max; size >= minOverlap; size -= 1) {
    if (left.slice(-size) === right.slice(0, size)) return size
  }
  return 0
}

/** Une fragmentos de transcripción en streaming sin duplicar texto acumulado. */
export function mergeStreamingChunk(existingText: string, incomingChunk: string) {
  const existing = normalizeReadableText(existingText)
  const incoming = normalizeReadableText(incomingChunk)
  if (!existing) return incoming
  if (!incoming || existing === incoming) return existing
  if (incoming.startsWith(existing)) return incoming
  if (existing.startsWith(incoming)) return existing
  const overlap = findMaxPrefixSuffixOverlap(existing, incoming)
  if (overlap > 0) return `${existing}${incoming.slice(overlap)}`
  return hasWordBoundaryGap(existing, incoming) ? `${existing} ${incoming}` : `${existing}${incoming}`
}

/** Sanea la entrada del cliente: roles válidos, texto acotado, número de items limitado. */
export function sanitizeTranscript(raw: unknown): TranscriptItem[] {
  if (!Array.isArray(raw)) return []
  let budget = MAX_TRANSCRIPT_CHARS
  const items: TranscriptItem[] = []
  for (const entry of raw.slice(0, MAX_TRANSCRIPT_ITEMS)) {
    if (!entry || typeof entry !== 'object') continue
    const { role, text, startedAt, endedAt } = entry as Record<string, unknown>
    if ((role !== 'user' && role !== 'model') || typeof text !== 'string') continue
    const clipped = text.slice(0, Math.max(0, budget))
    if (!clipped.trim()) continue
    budget -= clipped.length
    items.push({
      role: role as TranscriptRole,
      text: clipped,
      startedAt: typeof startedAt === 'number' ? startedAt : undefined,
      endedAt: typeof endedAt === 'number' ? endedAt : undefined,
    })
    if (budget <= 0) break
  }
  return items
}

/** Fusiona entradas consecutivas del mismo rol (un turno puede llegar en varios fragmentos). */
export function mergeTranscript(transcript: TranscriptItem[]): TranscriptItem[] {
  const merged: TranscriptItem[] = []
  for (const item of transcript) {
    if (!item.text?.trim()) continue
    const last = merged[merged.length - 1]
    if (last && last.role === item.role) {
      last.text = mergeStreamingChunk(last.text, item.text)
      if (typeof item.startedAt === 'number') last.startedAt = Math.min(last.startedAt ?? item.startedAt, item.startedAt)
      if (typeof item.endedAt === 'number') last.endedAt = Math.max(last.endedAt ?? item.endedAt, item.endedAt)
    } else {
      merged.push({ ...item, text: item.role === 'user' ? normalizeReadableText(item.text) : item.text.trim() })
    }
  }
  return merged
}

export type TurnPair = { turn: number; ia: string; tu: string }

/** Agrupa la transcripción en turnos numerados (prospecto habla → vendedor responde). */
export function buildTurns(merged: TranscriptItem[]): TurnPair[] {
  const turns: TurnPair[] = []
  let i = 0
  while (i < merged.length) {
    let ia = ''
    let tu = ''
    if (merged[i].role === 'model') {
      ia = merged[i].text
      i++
      if (i < merged.length && merged[i].role === 'user') {
        tu = merged[i].text
        i++
      }
    } else {
      tu = merged[i].text
      i++
    }
    if (ia || tu) turns.push({ turn: turns.length + 1, ia, tu })
  }
  return turns
}

export function formatTranscriptForDisplay(merged: TranscriptItem[]) {
  return merged.map((item) => `${item.role === 'user' ? 'TÚ' : 'IA'}: ${item.text}`).join('\n\n')
}
