import type { ConversationTurn, PracticeScenario } from './types'

const GENERIC_PATTERNS = [/^simulaci[oó]n\b/, /^llamada\b/, /^evaluaci[oó]n\b/, /^resultado\b/, /^sesi[oó]n\b/, /^chat\b/, /^nuevo\b/]

export function sanitizeTitle(title: string | null | undefined): string {
  const compact = (title ?? '').replace(/["'`*_#[\]]/g, ' ').replace(/\s+/g, ' ').trim()
  if (!compact) return ''
  return compact.length > 58 ? `${compact.slice(0, 58).trimEnd()}...` : compact
}

export function isGenericTitle(title: string): boolean {
  const normalized = title.toLowerCase().trim()
  if (normalized.length < 10) return true
  if (GENERIC_PATTERNS.some((pattern) => pattern.test(normalized))) return true
  if (!/[a-záéíóúñ]/i.test(normalized)) return true
  return normalized.split(' ').filter(Boolean).length < 3
}

function prospectReference(scenario: PracticeScenario) {
  const firstName = scenario.prospectName.trim().split(/\s+/)[0]
  return firstName || scenario.prospectRole.trim() || scenario.prospectCompany.trim() || 'Prospecto'
}

function detectTheme(scenario: PracticeScenario, conversation: ConversationTurn[]) {
  const corpus = `${scenario.context} ${scenario.prospect} ${conversation.map((t) => `${t.ia} ${t.tu}`).join(' ')}`.toLowerCase()
  if (/(precio|cost[eo]|descuento|caro|presupuesto)/.test(corpus)) return 'Objeción de precio'
  if (/(no\s+ahora|luego|despu[eé]s|prioridad)/.test(corpus)) return 'Objeción por timing'
  if (/(decisor|gerencia|director|aprobaci[oó]n)/.test(corpus)) return 'Acceso a decisor'
  if (/(demo|presentaci[oó]n|funcionalidad)/.test(corpus)) return 'Demo orientada a valor'
  if (/(seguimiento|pr[oó]ximo\s+paso|agenda|reuni[oó]n|cierre)/.test(corpus)) return 'Cierre y siguiente paso'
  return 'Conversación comercial'
}

/** Título identificativo "Prospecto: tema". Usa el de la IA solo si no es genérico. */
export function buildSessionTitle(aiTitle: string | undefined, scenario: PracticeScenario, conversation: ConversationTurn[]) {
  const candidate = sanitizeTitle(aiTitle)
  if (candidate && !isGenericTitle(candidate)) return candidate
  return sanitizeTitle(`${prospectReference(scenario)}: ${detectTheme(scenario, conversation)}`)
}
