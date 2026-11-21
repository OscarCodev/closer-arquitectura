/** Límite de caracteres de los campos libres de práctica (contexto y prospecto). */
export const MAX_PRACTICE_FIELD_CHARS = 1400

const EMPTY_VALUES = new Set(['unknown', 'desconocido', 'no especificado', 'sin especificar', 'n/a', 'na', '-', '--'])

/** Devuelve '' para valores vacíos o marcadores como "unknown"; si no, el texto recortado. */
export function normalizeStructuredValue(value: string | undefined | null): string {
  const raw = (value ?? '').trim()
  if (!raw || EMPTY_VALUES.has(raw.toLowerCase())) return ''
  return raw
}

/** Recorta espacios y limita longitud. */
export function clampText(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}
