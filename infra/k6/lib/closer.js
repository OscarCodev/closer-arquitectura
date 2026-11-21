// Funciones compartidas por los scripts de k6: autenticación de prueba y recorridos del usuario.
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Counter } from 'k6/metrics'

export const BASE = (__ENV.BASE_URL || 'http://127.0.0.1:8080').replace(/\/$/, '')
export const API = `${BASE}/api/v1`
const JSON_HEADERS = { 'Content-Type': 'application/json' }

export const rateLimited = new Counter('respuestas_429')
export const practicasCompletadas = new Counter('practicas_completadas')

const TRANSCRIPT = [
  { role: 'model', text: '¿Aló? Sí, dígame.' },
  { role: 'user', text: 'Hola Lucía, soy Oscar de FlowCRM. ¿Cómo gestionan hoy su pipeline comercial?' },
  { role: 'model', text: 'Con hojas de cálculo, y la verdad se nos pierden oportunidades.' },
  { role: 'user', text: '¿Cuántas oportunidades calculan que pierden al mes por eso?' },
  { role: 'model', text: 'No lo tenemos medido, pero bastantes. ¿Y esto cuánto cuesta?' },
  { role: 'user', text: 'Depende del equipo. Antes, ¿quién más participa en la decisión?' },
]

/**
 * Crea `count` usuarios de prueba (login de desarrollo + onboarding) en lotes paralelos.
 * Se usa en setup(): un usuario por VU, así los límites por usuario se comportan como en la realidad.
 */
export function createUsers(count, tag) {
  const users = []
  const batchSize = 50
  for (let start = 0; start < count; start += batchSize) {
    const end = Math.min(count, start + batchSize)
    const logins = []
    for (let i = start; i < end; i++) {
      logins.push(['POST', `${API}/auth/dev-token`, JSON.stringify({ email: `k6-${tag}-${i}@closer.test` }), { headers: JSON_HEADERS, tags: { tipo: 'setup' } }])
    }
    const tokens = http.batch(logins).map((res) => res.json('accessToken'))
    const onboardings = tokens.map((token) => [
      'PUT',
      `${API}/me/onboarding`,
      JSON.stringify({ firstName: 'Carga', role: 'Vendedor o closer', industry: 'Tecnología / Software' }),
      { headers: auth(token), tags: { tipo: 'setup' } },
    ])
    http.batch(onboardings)
    users.push(...tokens)
  }
  return users.filter(Boolean)
}

export function auth(token) {
  return { ...JSON_HEADERS, Authorization: `Bearer ${token}` }
}

function track(res) {
  if (res.status === 429) rateLimited.add(1)
  if (__ENV.DEBUG_ERRORS && (res.status === 0 || res.status >= 400)) {
    console.warn(`${res.request.method} ${res.url.replace(API, '')} → ${res.status} ${res.error || ''} (${Math.round(res.timings.duration)} ms)`)
  }
  return res
}

/** Lo que hace la app al abrir /setup: identidad, onboarding, historial y biblioteca (lecturas en caché). */
export function abrirPanel(token) {
  const params = { headers: auth(token), tags: { tipo: 'gestion' } }
  const responses = http.batch([
    ['GET', `${API}/me`, null, params],
    ['GET', `${API}/me/onboarding`, null, params],
    ['GET', `${API}/sessions`, null, params],
    ['GET', `${API}/profiles`, null, params],
  ])
  responses.forEach(track)
  check(responses, {
    'panel: 4 respuestas 200': (rs) => rs.every((r) => r.status === 200),
  })
}

/** Una práctica completa: guardar prospecto, iniciar llamada, pedir consejo y evaluar en el servidor. */
export function practicar(token) {
  const gestion = { headers: auth(token), tags: { tipo: 'gestion' } }
  const practica = { headers: auth(token), tags: { tipo: 'practica' } }

  track(http.post(`${API}/profiles`, JSON.stringify({ prospect: 'Lucía Fernández, Head of Sales en Nubia Retail', context: 'Vendo FlowCRM' }), gestion))

  const start = track(
    http.post(
      `${API}/simulations`,
      JSON.stringify({
        context: 'Vendo FlowCRM, un CRM para equipos comerciales de 10 a 50 personas.',
        prospect: 'Lucía Fernández, Head of Sales en Nubia Retail. Usa hojas de cálculo.',
        advancedSelections: { modo: 'Descubrimiento', tono: 'Analítico' },
      }),
      { ...practica, tags: { tipo: 'practica', endpoint: 'iniciar' } },
    ),
  )
  if (!check(start, { 'iniciar práctica: 201': (r) => r.status === 201 })) return
  const simulationId = start.json('simulationId')

  sleep(2 + Math.random() * 2) // "conversación"
  track(http.post(`${API}/simulations/${simulationId}/coach`, JSON.stringify({ transcript: TRANSCRIPT.slice(0, 3) }), { ...practica, tags: { tipo: 'practica', endpoint: 'coach' } }))
  sleep(1 + Math.random() * 2)

  const evaluation = track(
    http.post(`${API}/simulations/${simulationId}/evaluate`, JSON.stringify({ transcript: TRANSCRIPT, durationSeconds: 90 }), {
      ...practica,
      tags: { tipo: 'practica', endpoint: 'evaluar' },
    }),
  )
  if (check(evaluation, { 'evaluar: 200 con puntaje': (r) => r.status === 200 && r.json('simulation.metrics.score') !== undefined })) {
    practicasCompletadas.add(1)
  }
}
