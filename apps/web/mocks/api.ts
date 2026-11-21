/**
 * MOCK — sustituye a las rutas /api/* del backend.
 *
 * `mockFetch` tiene la misma firma que `fetch` y devuelve un `Response`,
 * así el código de las pantallas sigue igual que en la app real.
 * Perfiles y sesiones se guardan en localStorage; el resto devuelve datos de ejemplo.
 */

import {
  MOCK_RECENT_SESSIONS,
  MOCK_SIMULATION_SESSION_ATTEMPT_1,
  MOCK_SIMULATION_SESSION_ATTEMPT_2,
  MOCK_SIMULATION_SESSION_ATTEMPT_3,
} from '@/app/setup/config/mock-simulation-data'
import type { RecentSession, SavedProfile, SimulationSession } from '@/app/setup/types/setup-types'

const PROFILES_KEY = 'closer.mock.profiles'
const SESSIONS_KEY = 'closer.mock.sessions'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)]

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function readStore<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeStore(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore storage failures
  }
}

function parseBody<T>(init?: RequestInit): T {
  try {
    return JSON.parse(String(init?.body ?? '{}')) as T
  } catch {
    return {} as T
  }
}

/* ── Datos de ejemplo ─────────────────────────────────────────────── */

const AUTOGEN_SCENARIOS = [
  {
    prospectName: 'Lucía Fernández',
    productName: 'FlowCRM',
    scenarioTheme: 'Discovery',
    context:
      'Vendo FlowCRM, un CRM para equipos comerciales de 10 a 50 personas. Objetivo: conseguir una demo con la responsable de ventas.',
    prospect:
      'Lucía Fernández, Head of Sales en Nubia Retail. Lleva 6 meses en el puesto, su equipo trabaja con hojas de cálculo y tiene presión por subir la conversión este trimestre.',
  },
  {
    prospectName: 'Martín Rojas',
    productName: 'PayLite',
    scenarioTheme: 'Objeciones de precio',
    context:
      'Vendo PayLite, una pasarela de pagos con comisiones bajas para e-commerce. Objetivo: cerrar una prueba piloto de 30 días.',
    prospect:
      'Martín Rojas, CFO en Andes Market. Muy analítico, desconfía de cambiar de proveedor y siempre pregunta por costes ocultos.',
  },
  {
    prospectName: 'Sofía Herrera',
    productName: 'TalentHub',
    scenarioTheme: 'Cierre',
    context:
      'Vendo TalentHub, software de reclutamiento con IA. Ya hubo dos reuniones; objetivo: cerrar el contrato anual.',
    prospect:
      'Sofía Herrera, Directora de RRHH en Grupo Ladera. Le gusta el producto pero su CEO pide justificar el retorno antes de firmar.',
  },
]

const COACH_TIPS = [
  'Haz una pregunta abierta sobre el impacto: "¿Cuánto les cuesta hoy ese problema al mes?"',
  'Resume lo que dijo el prospecto antes de avanzar; demuestra que escuchaste.',
  'No presentes funcionalidades todavía. Pregunta quién más participa en la decisión.',
  'Valida la objeción ("Tiene sentido que te preocupe…") y pregunta qué necesitaría ver para estar tranquilo.',
  'Propón un siguiente paso concreto con fecha: "¿Te viene bien el jueves a las 10 para la demo?"',
]

function extractProfile(prospect: string) {
  const nameMatch = prospect.match(/^([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?)/)
  const roleMatch = prospect.match(/,\s*([^,.]+?)\s+en\s+([^,.]+)/)
  return {
    name: nameMatch?.[1] ?? '',
    role: roleMatch?.[1]?.trim() ?? '',
    company: roleMatch?.[2]?.trim() ?? '',
    gender: 'unknown' as const,
  }
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.floor(totalSeconds % 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

/* ── Router ───────────────────────────────────────────────────────── */

export async function mockFetch(input: string, init?: RequestInit): Promise<Response> {
  const method = (init?.method ?? 'GET').toUpperCase()
  const path = input.split('?')[0]

  switch (`${method} ${path}`) {
    case 'GET /api/setup/profiles':
      await delay(150)
      return json({ profiles: readStore<SavedProfile[]>(PROFILES_KEY, []) })

    case 'PUT /api/setup/profiles': {
      const { profiles } = parseBody<{ profiles?: SavedProfile[] }>(init)
      writeStore(PROFILES_KEY, profiles ?? [])
      return json({ ok: true })
    }

    case 'GET /api/setup/sessions':
      await delay(150)
      return json({ sessions: readStore<RecentSession[]>(SESSIONS_KEY, MOCK_RECENT_SESSIONS) })

    case 'PUT /api/setup/sessions': {
      const { sessions } = parseBody<{ sessions?: RecentSession[] }>(init)
      writeStore(SESSIONS_KEY, sessions ?? [])
      return json({ ok: true })
    }

    case 'POST /api/simulation/autogenerate':
      await delay(900)
      return json(pick(AUTOGEN_SCENARIOS))

    case 'POST /api/simulation/extract-profile': {
      await delay(300)
      const { prospect } = parseBody<{ prospect?: string }>(init)
      return json(extractProfile(prospect ?? ''))
    }

    case 'POST /api/simulation/token':
      return json({ token: 'mock-token' })

    case 'POST /api/simulation/coach':
      await delay(800)
      return json({ tip: pick(COACH_TIPS) })

    case 'POST /api/simulation/result': {
      await delay(1200)
      const { durationSeconds } = parseBody<{ durationSeconds?: number }>(init)
      const template = pick([
        MOCK_SIMULATION_SESSION_ATTEMPT_1,
        MOCK_SIMULATION_SESSION_ATTEMPT_2,
        MOCK_SIMULATION_SESSION_ATTEMPT_3,
      ])
      const simulation: SimulationSession = {
        ...template,
        id: `sim-${Date.now()}`,
        createdAt: new Date().toISOString(),
        metrics: { ...template.metrics, duration: formatDuration(durationSeconds ?? 0) },
      }
      return json({ simulation, suggestedTitle: 'Simulación de práctica' })
    }

    case 'POST /api/support/contact':
      await delay(600)
      return json({ ok: true })

    default:
      return json({ error: `Ruta mock no definida: ${method} ${path}` }, 404)
  }
}
