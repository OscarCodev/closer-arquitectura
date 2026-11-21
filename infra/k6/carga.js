// Prueba de carga progresiva hasta MAX_VUS usuarios virtuales concurrentes (Sprint 2: hasta 2,000).
//   k6 run -e MAX_VUS=2000 -e BASE_URL=http://127.0.0.1:8080 infra/k6/carga.js
//
// Cada usuario virtual es un vendedor con su propia cuenta que, en bucle:
//   - abre el panel (/me, onboarding, historial, biblioteca)       → tráfico de "gestión" (EQ-03)
//   - en ~25 % de las vueltas hace una práctica completa            → iniciar, coach y evaluar
// con pausas realistas entre acciones. La IA está simulada (AI_PROVIDER=fake): se mide nuestra
// arquitectura, no la latencia de Gemini (EQ-01 se mide aparte).
import { sleep } from 'k6'
import { abrirPanel, createUsers, practicar } from './lib/closer.js'
import { buildReport } from './lib/report.js'

const MAX_VUS = Number(__ENV.MAX_VUS || 2000)
const scale = (fraction) => Math.max(1, Math.round(MAX_VUS * fraction))

export const options = {
  // Docker Desktop en Windows corta en silencio las conexiones keep-alive inactivas: WINDOWS_DOCKER=1 abre
  // una conexión nueva por iteración (dentro de la iteración se reutiliza). En Linux no hace falta.
  noVUConnectionReuse: __ENV.WINDOWS_DOCKER === "1",
  setupTimeout: '10m',
  discardResponseBodies: false,
  scenarios: {
    rampa: {
      executor: 'ramping-vus',
      startVUs: 0,
      gracefulRampDown: '30s',
      stages: [
        { duration: '1m', target: scale(0.05) }, // calentamiento
        { duration: '2m', target: scale(0.25) },
        { duration: '2m', target: scale(0.5) },
        { duration: '2m', target: MAX_VUS }, // pico
        { duration: '2m', target: MAX_VUS }, // sostenido en el pico
        { duration: '1m', target: 0 },
      ],
    },
  },
  thresholds: {
    // EQ-03: API de gestión p95 ≤ 1 s y errores técnicos < 1 %
    'http_req_duration{tipo:gestion}': ['p(95)<1000'],
    'http_req_failed{tipo:gestion}': ['rate<0.01'],
    // Práctica completa (incluye evaluación): informativo, con un margen mayor
    'http_req_duration{tipo:practica}': ['p(95)<3000'],
    'http_req_failed{tipo:practica}': ['rate<0.01'],
    checks: ['rate>0.99'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
}

export function setup() {
  return { users: createUsers(MAX_VUS, `carga-${Date.now()}`) }
}

export default function (data) {
  const token = data.users[(__VU - 1) % data.users.length]
  abrirPanel(token)
  sleep(3 + Math.random() * 4)
  if (Math.random() < 0.25) {
    practicar(token)
    sleep(2 + Math.random() * 3)
  }
}

export function handleSummary(data) {
  return buildReport(data, { maxVus: MAX_VUS, base: __ENV.BASE_URL || 'http://127.0.0.1:8080' })
}
