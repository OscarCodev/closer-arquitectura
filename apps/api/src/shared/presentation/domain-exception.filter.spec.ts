import { ArgumentsHost, BadRequestException } from '@nestjs/common'
import { ConflictError, NotFoundError, RateLimitedError, UnauthenticatedError, ValidationError } from '../domain/errors'
import { DomainExceptionFilter } from './domain-exception.filter'

function capture() {
  const res = { statusCode: 0, body: undefined as unknown, headers: {} as Record<string, string> }
  const response = {
    status(code: number) {
      res.statusCode = code
      return this
    },
    json(body: unknown) {
      res.body = body
      return this
    },
    setHeader(name: string, value: string) {
      res.headers[name] = value
    },
  }
  const host = { switchToHttp: () => ({ getResponse: () => response }) } as unknown as ArgumentsHost
  return { res, host }
}

describe('DomainExceptionFilter: formato único de errores', () => {
  const filter = new DomainExceptionFilter()

  it.each([
    [new ValidationError('mal'), 400, 'validation_error'],
    [new UnauthenticatedError(), 401, 'unauthenticated'],
    [new NotFoundError('no'), 404, 'not_found'],
    [new ConflictError('ya'), 409, 'conflict'],
  ])('%p → %i', (error, status, code) => {
    const { res, host } = capture()
    filter.catch(error, host)
    expect(res.statusCode).toBe(status)
    expect(res.body).toMatchObject({ code })
  })

  it('429 incluye retryAfterSeconds', () => {
    const { res, host } = capture()
    filter.catch(new RateLimitedError('espera', 42), host)
    expect(res).toMatchObject({ statusCode: 429, body: { retryAfterSeconds: 42 } })
  })

  it('errores de validación de Nest se aplanan a un mensaje', () => {
    const { res, host } = capture()
    filter.catch(new BadRequestException(['a debe ser texto', 'b es obligatorio']), host)
    expect(res.body).toEqual({ error: 'a debe ser texto; b es obligatorio', code: 'http_400' })
  })

  it('base de datos inalcanzable → 503 con Retry-After (no "Error interno")', () => {
    const { res, host } = capture()
    filter.catch(Object.assign(new Error("Can't reach database server"), { code: 'P1001' }), host)
    expect(res).toMatchObject({ statusCode: 503, body: { code: 'service_unavailable' }, headers: { 'Retry-After': '5' } })
  })

  it('cualquier otro error es 500 sin filtrar detalles internos', () => {
    const { res, host } = capture()
    filter.catch(new Error('secreto interno'), host)
    expect(res).toMatchObject({ statusCode: 500, body: { error: 'Error interno', code: 'internal_error' } })
  })
})
