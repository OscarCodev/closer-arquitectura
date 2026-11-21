const EMPTY_VALUES = new Set([
  'unknown',
  'desconocido',
  'no especificado',
  'sin especificar',
  'n/a',
  'na',
  '-',
  '--',
])

export function normalizeStructuredValue(value: string | undefined | null): string {
  const raw = (value || '').trim()
  if (!raw) return ''
  if (EMPTY_VALUES.has(raw.toLowerCase())) return ''
  return raw
}
