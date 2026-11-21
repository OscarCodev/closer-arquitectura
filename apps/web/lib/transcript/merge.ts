type TranscriptRole = 'user' | 'model'

function hasWordBoundaryGap(left: string, right: string) {
  if (!left || !right) return false
  if (/\s$/.test(left) || /^\s/.test(right)) return false
  if (/[[({"'¿¡-]$/.test(left)) return false
  if (/^[,.;:!?)]/.test(right)) return false

  const leftIsWord = /[\p{L}\p{N}]$/u.test(left)
  const rightIsWord = /^[\p{L}\p{N}]/u.test(right)
  return leftIsWord && rightIsWord
}

function findMaxPrefixSuffixOverlap(left: string, right: string) {
  const max = Math.min(left.length, right.length)
  const minOverlap = Math.min(6, max)

  for (let size = max; size >= minOverlap; size -= 1) {
    if (left.slice(-size) === right.slice(0, size)) return size
  }

  return 0
}

export function normalizeReadableText(text: string) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/([,.;:!?])(?!\s|$)/g, '$1 ')
}

/**
 * Merge a chunk from audio transcription (inputTranscription / outputTranscription).
 *
 * Identical to mergeStreamingChunk EXCEPT it never inserts a word-boundary space.
 * Audio transcription chunks can cut mid-word ("Ó" + "scar" → "Óscar"), so adding
 * a space would corrupt the text. The transcription engine already places spaces
 * inside each chunk where they belong.
 */
export function mergeAudioChunk(existingText: string, incomingChunk: string): string {
  const existing = normalizeReadableText(existingText)
  const incoming = normalizeReadableText(incomingChunk)

  if (!existing) return incoming
  if (!incoming) return existing
  if (existing === incoming) return existing

  if (incoming.startsWith(existing)) return incoming
  if (existing.startsWith(incoming)) return existing

  const overlap = findMaxPrefixSuffixOverlap(existing, incoming)
  if (overlap > 0) return `${existing}${incoming.slice(overlap)}`

  // Direct concatenation — no space added.
  // Mid-word cuts ("Ó" + "scar") must join without a space.
  return `${existing}${incoming}`
}

export function mergeStreamingChunk(existingText: string, incomingChunk: string) {
  const existing = normalizeReadableText(existingText)
  const incoming = normalizeReadableText(incomingChunk)

  if (!existing) return incoming
  if (!incoming) return existing
  if (existing === incoming) return existing

  if (incoming.startsWith(existing)) return incoming
  if (existing.startsWith(incoming)) return existing

  const overlap = findMaxPrefixSuffixOverlap(existing, incoming)
  if (overlap > 0) return `${existing}${incoming.slice(overlap)}`

  return hasWordBoundaryGap(existing, incoming) ? `${existing} ${incoming}` : `${existing}${incoming}`
}

export function normalizeTranscriptByRole(role: TranscriptRole, text: string) {
  if (role === 'user') return normalizeReadableText(text)
  return text.trim()
}
