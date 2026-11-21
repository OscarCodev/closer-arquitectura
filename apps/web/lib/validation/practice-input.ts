export const MAX_PRACTICE_FIELD_CHARS = 1400

export function clampPracticeText(value: string): string {
  return value.slice(0, MAX_PRACTICE_FIELD_CHARS)
}

export function isPracticeTextTooLong(value: string): boolean {
  return value.length > MAX_PRACTICE_FIELD_CHARS
}