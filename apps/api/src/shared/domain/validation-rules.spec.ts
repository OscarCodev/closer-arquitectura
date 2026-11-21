import { normalizeOnboarding } from '../../modules/identity/domain/onboarding'
import { buildProfileInput } from '../../modules/profiles/domain/prospect-profile'
import { buildSupportContact } from '../../modules/support/domain/support-contact'
import { ValidationError } from './errors'
import { clampText, MAX_PRACTICE_FIELD_CHARS, normalizeStructuredValue } from './text'

describe('reglas de validación del dominio', () => {
  describe('texto', () => {
    it.each(['unknown', 'N/A', ' - ', 'desconocido', ''])('"%s" se trata como vacío', (value) => {
      expect(normalizeStructuredValue(value)).toBe('')
    })

    it('clampText recorta y limita; ignora lo que no es texto', () => {
      expect(clampText('  hola  ', 3)).toBe('hol')
      expect(clampText(42, 10)).toBe('')
    })
  })

  describe('onboarding (CA-01.4)', () => {
    it('exige el nombre', () => {
      expect(() => normalizeOnboarding({ firstName: '  ' })).toThrow(ValidationError)
    })

    it('completa los 14 campos y recorta a 200 caracteres', () => {
      const answers = normalizeOnboarding({ firstName: 'Lucía', companyName: 'x'.repeat(300), hacker: 'ignorado' })
      expect(Object.keys(answers)).toHaveLength(14)
      expect(answers.companyName).toHaveLength(200)
      expect(answers).not.toHaveProperty('hacker')
    })
  })

  describe('prospecto (CA-02.6)', () => {
    it('exige la descripción', () => {
      expect(() => buildProfileInput({ prospect: '', context: 'x' })).toThrow(ValidationError)
    })

    it(`rechaza más de ${MAX_PRACTICE_FIELD_CHARS} caracteres`, () => {
      expect(() => buildProfileInput({ prospect: 'x'.repeat(MAX_PRACTICE_FIELD_CHARS + 1), context: '' })).toThrow(ValidationError)
    })

    it('usa el nombre de la persona o el inicio de la descripción si falta el nombre', () => {
      expect(buildProfileInput({ prospect: 'Ana Torres, Head of Sales', context: '', personName: 'Ana Torres' }).name).toBe('Ana Torres')
      expect(buildProfileInput({ prospect: 'Gerente de compras de una cadena retail grande', context: '' }).name).toHaveLength(40)
    })

    it('trata "unknown" como vacío en los campos estructurados', () => {
      expect(buildProfileInput({ prospect: 'Ana', context: '', roleCompany: 'unknown' }).roleCompany).toBeNull()
    })
  })

  describe('soporte (SPEC-07)', () => {
    it('exige asunto y al menos 10 caracteres de mensaje', () => {
      expect(() => buildSupportContact({ subject: '', message: 'mensaje largo' })).toThrow(ValidationError)
      expect(() => buildSupportContact({ subject: 'Hola', message: 'corto' })).toThrow(ValidationError)
    })

    it('normaliza la ruta vacía a null', () => {
      expect(buildSupportContact({ subject: 'Hola', message: 'mensaje largo', pagePath: '' }).pagePath).toBeNull()
    })
  })
})
