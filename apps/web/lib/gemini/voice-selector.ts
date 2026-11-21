/**
 * Selects a Gemini voice that matches the prospect's gender.
 * Gender is inferred from the first name using explicit male + female name
 * lists, then the 'a' ending heuristic as a last resort.
 *
 * Priority order:
 *  1. If the word is not a proper noun (no capital letter) → default male
 *  2. Explicit FEMALE_NAMES list
 *  3. Explicit MALE_NAMES list  ← prevents 'a'-ending male names (Luca, etc.)
 *     from being mis-classified as female
 *  4. 'a' ending heuristic for unlisted names
 *  5. Other feminine endings
 *  6. Default → male
 *
 * Available Gemini voices:
 *  Female: Aoede (smooth, sophisticated), Kore (firm, clear)
 *  Male:   Charon (deep, professional), Fenrir (authoritative), Puck (energetic)
 *
 * Multiple voices per gender → each session sounds different.
 */

const FEMALE_VOICES = ['Aoede', 'Kore'] as const
const MALE_VOICES = ['Charon', 'Fenrir', 'Puck'] as const

type ProspectGender = 'female' | 'male' | 'unknown'

const FEMALE_TEXT_HINTS = [
  /\bella\b/i,
  /\bdirectora\b/i,
  /\bgerenta\b/i,
  /\bfundadora\b/i,
  /\bceo\b/i,
]

const MALE_TEXT_HINTS = [
  /\bel\b/i,
  /\bdirector\b/i,
  /\bgerente\b/i,
  /\bfundador\b/i,
]

// Common Spanish/Latin American female first names
const FEMALE_NAMES = new Set([
  'ana', 'maria', 'andrea', 'valentina', 'camila', 'sofia', 'isabella',
  'lucia', 'daniela', 'mariana', 'carolina', 'natalia', 'paola', 'laura',
  'gabriela', 'renata', 'catalina', 'diana', 'paula', 'monica', 'adriana',
  'silvana', 'fernanda', 'jimena', 'lorena', 'patricia', 'claudia',
  'alejandra', 'rosa', 'marcela', 'veronica', 'isabel', 'carmen', 'beatriz',
  'luz', 'paz', 'rachel', 'ines', 'teresa', 'elena', 'sara', 'julia',
  'clara', 'emma', 'victoria', 'leticia', 'rebeca', 'ruth', 'eva', 'pilar',
  'dolores', 'mercedes', 'alicia', 'silvia', 'raquel', 'nuria', 'cristina',
  'irene', 'miriam', 'esther', 'yolanda', 'susana', 'ximena', 'lourdes',
  'magda', 'viviana', 'fabiola', 'liliana', 'vanessa', 'rocio', 'pamela',
  'vanesa', 'katia', 'karina', 'sandra', 'sabrina', 'gisela', 'noelia',
  'cynthia', 'wendy', 'priscila', 'brenda', 'stefania', 'luisa', 'cecilia',
  'elisa', 'norma', 'graciela', 'amparo', 'consuelo', 'soledad',
  'florencia', 'agustina', 'belen', 'micaela', 'julieta', 'antonella',
  'candela', 'melanie', 'daiana', 'irina', 'nadia', 'tatiana',
])

// Common Spanish/Latin American male first names
// Listed explicitly so names ending in 'a' (Luca, Joshua, etc.) aren't
// mis-classified by the 'a' heuristic.
const MALE_NAMES = new Set([
  'alejandro', 'carlos', 'jorge', 'jose', 'juan', 'luis', 'miguel', 'pedro',
  'rafael', 'roberto', 'sergio', 'manuel', 'francisco', 'antonio', 'eduardo',
  'fernando', 'ricardo', 'andres', 'diego', 'felipe', 'gonzalo', 'hector',
  'ignacio', 'javier', 'nicolas', 'pablo', 'rodrigo', 'santiago', 'tomas',
  'victor', 'xavier', 'abel', 'adolfo', 'agustin', 'alberto', 'alfredo',
  'benjamin', 'bernardo', 'camilo', 'cesar', 'christian', 'christopher',
  'claudio', 'cristian', 'damian', 'daniel', 'david', 'edgar', 'emilio',
  'enrique', 'ernesto', 'esteban', 'fabian', 'facundo', 'franco', 'freddy',
  'gabriel', 'gerardo', 'gilberto', 'guillermo', 'gustavo', 'hernando',
  'horacio', 'hugo', 'ivan', 'jairo', 'joaquin', 'jonathan', 'julian',
  'julio', 'kevin', 'leonardo', 'leopoldo', 'lorenzo', 'luciano', 'luca',
  'marcos', 'mario', 'martin', 'mateo', 'mauricio', 'maximo', 'nelson',
  'nicolas', 'omar', 'oscar', 'oswaldo', 'raul', 'rene', 'richard',
  'ronald', 'ruben', 'samuel', 'sebastian', 'simon', 'stefan', 'tim',
  'tobias', 'ulises', 'valentin', 'walter', 'wilmer', 'wilson', 'yeison',
  // Names ending in 'a' that are male in Latin American context:
  'josua', 'joshua', 'nicola', 'andrea', // 'andrea' can be male
])

// Female name endings common in Spanish (covers Sofía, Valentina, etc.)
// Only applied when the name isn't in either explicit list above.
const FEMALE_ENDINGS = ['ela', 'ila', 'ina', 'ena', 'ita', 'isa', 'ida', 'ona', 'ada']

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickVariedVoice(pool: readonly string[], key: string): string {
  const fallback = pickRandom(pool)
  if (typeof window === 'undefined') return fallback

  try {
    const storageKey = `closer.voice.last.${key}`
    const lastVoice = window.sessionStorage.getItem(storageKey)
    const candidates = pool.filter((voice) => voice !== lastVoice)
    const selected = candidates.length > 0 ? pickRandom(candidates) : fallback
    window.sessionStorage.setItem(storageKey, selected)
    return selected
  } catch {
    return fallback
  }
}

function isFemale(originalFirstName: string): boolean {
  // Require a proper noun (starts with a capital letter).
  // Words like "una", "la", "empresa" start lowercase → not a name → default male.
  if (!originalFirstName[0] || originalFirstName[0] !== originalFirstName[0].toUpperCase()) {
    return false
  }

  const lower = originalFirstName.toLowerCase()

  // 1. Explicit female list
  if (FEMALE_NAMES.has(lower)) return true

  // 2. Explicit male list — takes priority over the 'a' heuristic below,
  //    so names like "Luca" and "Andrea" (male) aren't mis-classified.
  if (MALE_NAMES.has(lower)) return false

  // 3. Most Spanish female names end in 'a'
  if (lower.endsWith('a')) return true

  // 4. Other feminine endings
  if (FEMALE_ENDINGS.some((e) => lower.endsWith(e))) return true

  return false
}

function inferGenderFromProfileText(text: string): ProspectGender {
  if (!text || text.trim().length === 0) return 'unknown'
  if (FEMALE_TEXT_HINTS.some((pattern) => pattern.test(text))) return 'female'
  if (MALE_TEXT_HINTS.some((pattern) => pattern.test(text))) return 'male'
  return 'unknown'
}

/**
 * Given a prospect's full name (or first name), returns a Gemini voice name
 * that matches the inferred gender. Randomized within the gender pool so
 * each simulation session sounds different.
 */
export function selectVoiceForProspect(
  prospectName: string,
  options?: { prospectGender?: ProspectGender; prospectText?: string },
): string {
  const genderHint = options?.prospectGender || 'unknown'

  if (genderHint === 'female') return pickVariedVoice(FEMALE_VOICES, 'female')
  if (genderHint === 'male') return pickVariedVoice(MALE_VOICES, 'male')

  const textGender = inferGenderFromProfileText(options?.prospectText || '')
  if (textGender === 'female') return pickVariedVoice(FEMALE_VOICES, 'female')
  if (textGender === 'male') return pickVariedVoice(MALE_VOICES, 'male')

  if (!prospectName?.trim()) return pickVariedVoice(MALE_VOICES, 'male')

  const firstName = prospectName.trim().split(/\s+/)[0]

  return isFemale(firstName)
    ? pickVariedVoice(FEMALE_VOICES, 'female')
    : pickVariedVoice(MALE_VOICES, 'male')
}
