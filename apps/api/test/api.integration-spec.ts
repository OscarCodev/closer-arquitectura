import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AppModule } from '../src/app.module'
import { configureApp } from '../src/bootstrap'

const TRANSCRIPT = [
  { role: 'model', text: '¿Aló? Sí, dígame.' },
  { role: 'user', text: 'Hola Lucía, ¿cómo gestionan hoy su pipeline?' },
  { role: 'model', text: 'Con hojas de cálculo, y se nos pierden oportunidades.' },
  { role: 'user', text: 'Te puedo dar un descuento si firmas hoy.' },
]

describe('API de Closer (integración: HTTP + PostgreSQL + Redis)', () => {
  let app: INestApplication
  let http: ReturnType<typeof request>
  let tokenA: string
  let tokenB: string

  const login = async (email: string) => (await http.post('/api/v1/auth/dev-token').send({ email }).expect(200)).body.accessToken as string
  const as = (token: string) => ({ Authorization: `Bearer ${token}` })

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
    app = moduleRef.createNestApplication()
    configureApp(app)
    await app.init()
    http = request(app.getHttpServer())
    tokenA = await login(`a-${Date.now()}@closer.test`)
    tokenB = await login(`b-${Date.now()}@closer.test`)
  })

  afterAll(async () => {
    await app.close()
  })

  describe('salud y documentación', () => {
    it('GET /health/ready informa PostgreSQL y Redis disponibles', async () => {
      const res = await http.get('/api/v1/health/ready').expect(200)
      expect(res.body.info).toMatchObject({ database: { status: 'up' }, redis: { status: 'up' } })
    })

    it('publica el documento OpenAPI con los endpoints principales', async () => {
      const res = await http.get('/api/docs/openapi.json').expect(200)
      expect(Object.keys(res.body.paths)).toEqual(
        expect.arrayContaining(['/api/v1/profiles', '/api/v1/simulations', '/api/v1/simulations/{id}/evaluate', '/api/v1/sessions']),
      )
    })
  })

  describe('autenticación (SPEC-01)', () => {
    it('sin token responde 401 con el formato de error estándar (CA-01.6)', async () => {
      const res = await http.get('/api/v1/me').expect(401)
      expect(res.body).toEqual({ error: 'Falta el token de acceso', code: 'unauthenticated' })
    })

    it('un token con firma inválida es 401 (CA-01.6)', async () => {
      await http.get('/api/v1/me').set(as(`${tokenA.slice(0, -4)}AAAA`)).expect(401)
    })

    it('onboarding: guardar y leer; campos extra son 400 (CA-01.4, CA-01.5, CA-01.7)', async () => {
      await http.get('/api/v1/me').set(as(tokenA)).expect(200, /"onboardingCompleted":false/)
      await http.put('/api/v1/me/onboarding').set(as(tokenA)).send({ firstName: '' }).expect(400)
      await http.put('/api/v1/me/onboarding').set(as(tokenA)).send({ firstName: 'Lucía', hack: true }).expect(400)
      await http.put('/api/v1/me/onboarding').set(as(tokenA)).send({ firstName: 'Lucía', industry: 'SaaS' }).expect(200)
      const res = await http.get('/api/v1/me/onboarding').set(as(tokenA)).expect(200)
      expect(res.body.onboarding).toMatchObject({ firstName: 'Lucía', industry: 'SaaS' })
      await http.get('/api/v1/me').set(as(tokenA)).expect(200, /"onboardingCompleted":true/)
    })
  })

  describe('prospectos (SPEC-02)', () => {
    it('CRUD por entidad y aislamiento entre usuarios (CA-02.3 a CA-02.6)', async () => {
      const created = await http
        .post('/api/v1/profiles')
        .set(as(tokenA))
        .send({ prospect: 'Martín Rojas, CFO en Andes Market', context: 'Vendo PayLite' })
        .expect(201)
      const id = created.body.id

      await http.patch(`/api/v1/profiles/${id}`).set(as(tokenA)).send({ roleCompany: 'CFO en Andes Market' }).expect(200)
      await http.patch(`/api/v1/profiles/${id}`).set(as(tokenB)).send({ name: 'robado' }).expect(404)
      await http.delete(`/api/v1/profiles/${id}`).set(as(tokenB)).expect(404)
      await http.post('/api/v1/profiles').set(as(tokenA)).send({ prospect: 'x'.repeat(1401), context: '' }).expect(400)

      const list = await http.get('/api/v1/profiles').set(as(tokenA)).expect(200)
      expect(list.body.profiles).toHaveLength(1)
      expect(list.body.profiles[0].roleCompany).toBe('CFO en Andes Market')
      expect((await http.get('/api/v1/profiles').set(as(tokenB)).expect(200)).body.profiles).toHaveLength(0)

      await http.delete(`/api/v1/profiles/${id}`).set(as(tokenA)).expect(204)
      expect((await http.get('/api/v1/profiles').set(as(tokenA))).body.profiles).toHaveLength(0)
    })
  })

  describe('práctica completa (SPEC-03, SPEC-05, SPEC-06)', () => {
    let simulationId: string
    let sessionId: string

    it('inicia la práctica: sesión, intento IN_CALL y token de voz (CA-03.1, CA-03.8)', async () => {
      const res = await http
        .post('/api/v1/simulations')
        .set(as(tokenA))
        .send({
          context: 'Vendo FlowCRM, un CRM para equipos comerciales',
          prospect: 'Lucía Fernández, Head of Sales en Nubia Retail',
          advancedSelections: { modo: 'Descubrimiento', tono: 'Analítico' },
        })
        .expect(201)
      expect(res.body).toMatchObject({
        prospect: { name: 'Lucía Fernández', role: 'Head of Sales', company: 'Nubia Retail' },
        live: { provider: 'fake' },
        maxCallMinutes: 10,
      })
      simulationId = res.body.simulationId
      sessionId = res.body.session.id
    })

    it('una sesión sin intentos evaluados no aparece en el historial (CA-06.2)', async () => {
      const res = await http.get('/api/v1/sessions').set(as(tokenA)).expect(200)
      expect(res.body.sessions).toHaveLength(0)
    })

    it('el coach responde durante la llamada (CA-04.6)', async () => {
      const res = await http.post(`/api/v1/simulations/${simulationId}/coach`).set(as(tokenA)).send({ transcript: TRANSCRIPT }).expect(200)
      expect(res.body.tip).toEqual(expect.any(String))
    })

    it('otro usuario no puede evaluar la llamada (404)', async () => {
      await http
        .post(`/api/v1/simulations/${simulationId}/evaluate`)
        .set(as(tokenB))
        .send({ transcript: TRANSCRIPT, durationSeconds: 60 })
        .expect(404)
    })

    it('evalúa en el servidor y guarda el resultado (CA-05.1, CA-05.8)', async () => {
      const res = await http
        .post(`/api/v1/simulations/${simulationId}/evaluate`)
        .set(as(tokenA))
        .send({ transcript: TRANSCRIPT, durationSeconds: 95 })
        .expect(200)
      expect(res.body.simulation.metrics).toMatchObject({ turns: 2, duration: '01:35' })
      expect(res.body.simulation.conversation.map((t: { evaluation: string }) => t.evaluation)).toEqual(['good', 'critical'])
      expect(res.body.session.name).toMatch(/^Lucía: /)
    })

    it('es idempotente: reenviar devuelve el mismo resultado (CA-05.3)', async () => {
      const first = await http.get(`/api/v1/sessions/${sessionId}`).set(as(tokenA)).expect(200)
      const again = await http
        .post(`/api/v1/simulations/${simulationId}/evaluate`)
        .set(as(tokenA))
        .send({ transcript: [{ role: 'user', text: 'otra cosa' }], durationSeconds: 1 })
        .expect(200)
      expect(again.body.simulation.metrics).toEqual(first.body.simulations[0].metrics)
    })

    it('el coach ya no responde después de evaluada (CA-04.7)', async () => {
      await http.post(`/api/v1/simulations/${simulationId}/coach`).set(as(tokenA)).send({ transcript: TRANSCRIPT }).expect(409)
    })

    it('reintento en la misma sesión: el historial muestra 2 intentos (CA-03.4, CA-06.3)', async () => {
      const retry = await http.post('/api/v1/simulations').set(as(tokenA)).send({ sessionId }).expect(201)
      expect(retry.body.session.id).toBe(sessionId)
      await http
        .post(`/api/v1/simulations/${retry.body.simulationId}/evaluate`)
        .set(as(tokenA))
        .send({ transcript: TRANSCRIPT, durationSeconds: 60 })
        .expect(200)

      const list = await http.get('/api/v1/sessions').set(as(tokenA)).expect(200)
      expect(list.body.sessions).toHaveLength(1)
      expect(list.body.sessions[0].simulations).toHaveLength(2)
    })

    it('una llamada sin intercambios es 400 (CA-05.6)', async () => {
      const start = await http.post('/api/v1/simulations').set(as(tokenA)).send({ sessionId }).expect(201)
      await http
        .post(`/api/v1/simulations/${start.body.simulationId}/evaluate`)
        .set(as(tokenA))
        .send({ transcript: [], durationSeconds: 2 })
        .expect(400)
    })

    it('dos evaluaciones simultáneas: una evalúa y la otra recibe 409 o el mismo resultado (CA-05.4)', async () => {
      const start = await http.post('/api/v1/simulations').set(as(tokenB)).send({ context: 'c', prospect: 'Ana Torres, CFO en X' }).expect(201)
      const url = `/api/v1/simulations/${start.body.simulationId}/evaluate`
      const body = { transcript: TRANSCRIPT, durationSeconds: 40 }
      const [r1, r2] = await Promise.all([http.post(url).set(as(tokenB)).send(body), http.post(url).set(as(tokenB)).send(body)])
      const statuses = [r1.status, r2.status].sort()
      expect([[200, 200], [200, 409]]).toContainEqual(statuses)
      const history = await http.get('/api/v1/sessions').set(as(tokenB)).expect(200)
      expect(history.body.sessions[0].simulations).toHaveLength(1)
    })

    it('renombrar y borrar la sesión; otro usuario no puede (CA-06.4 a CA-06.6)', async () => {
      await http.patch(`/api/v1/sessions/${sessionId}`).set(as(tokenB)).send({ name: 'x' }).expect(404)
      await http.patch(`/api/v1/sessions/${sessionId}`).set(as(tokenA)).send({ name: 'Lucía: pipeline' }).expect(204)
      expect((await http.get('/api/v1/sessions').set(as(tokenA))).body.sessions[0].name).toBe('Lucía: pipeline')
      await http.delete(`/api/v1/sessions/${sessionId}`).set(as(tokenA)).expect(204)
      expect((await http.get('/api/v1/sessions').set(as(tokenA))).body.sessions).toHaveLength(0)
    })
  })

  describe('caché y límites (SPEC-08)', () => {
    it('la segunda lectura sale de la caché (CA-08.1)', async () => {
      const before = (await http.get('/api/v1/health/metrics')).body.cache
      await http.get('/api/v1/profiles').set(as(tokenB)).expect(200)
      await http.get('/api/v1/profiles').set(as(tokenB)).expect(200)
      const after = (await http.get('/api/v1/health/metrics')).body.cache
      expect(after.hits - before.hits).toBeGreaterThanOrEqual(1)
    })

    it('al superar un límite responde 429 con Retry-After (CA-07.4)', async () => {
      const send = () => http.post('/api/v1/support/contacts').set(as(tokenB)).send({ subject: 'Ayuda', message: 'No escucho el audio' })
      await send().expect(201)
      await send().expect(201)
      const third = await send().expect(429)
      expect(third.headers['retry-after']).toBeDefined()
      expect(third.body).toMatchObject({ code: 'rate_limited', retryAfterSeconds: expect.any(Number) })
    })
  })
})
