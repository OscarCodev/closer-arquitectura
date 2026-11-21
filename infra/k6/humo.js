// Prueba de humo: 5 usuarios durante 30 s. Valida que los scripts y el stack funcionan antes de la carga real.
//   k6 run infra/k6/humo.js
import { sleep } from 'k6'
import { abrirPanel, createUsers, practicar } from './lib/closer.js'

export const options = {
  // Docker Desktop en Windows corta en silencio las conexiones keep-alive inactivas: WINDOWS_DOCKER=1 abre
  // una conexión nueva por iteración (dentro de la iteración se reutiliza). En Linux no hace falta.
  noVUConnectionReuse: __ENV.WINDOWS_DOCKER === "1",
  vus: 5,
  duration: '30s',
  thresholds: {
    checks: ['rate==1'],
    http_req_failed: ['rate==0'],
  },
}

export function setup() {
  return { users: createUsers(5, `humo-${Date.now()}`) }
}

export default function (data) {
  const token = data.users[(__VU - 1) % data.users.length]
  abrirPanel(token)
  sleep(1)
  practicar(token)
  // El límite real es de 4 evaluaciones por minuto por usuario: se espera lo suficiente para no superarlo.
  sleep(16)
}
