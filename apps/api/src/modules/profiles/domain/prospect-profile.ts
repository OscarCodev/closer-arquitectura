import { ValidationError } from '../../../shared/domain/errors'
import { MAX_PRACTICE_FIELD_CHARS, normalizeStructuredValue } from '../../../shared/domain/text'

/** Prospecto guardado en la biblioteca del vendedor. */
export type ProspectProfile = {
  id: string
  name: string
  prospect: string
  context: string
  personName: string | null
  roleCompany: string | null
  createdAt: Date
  updatedAt: Date
}

export type ProspectProfileInput = {
  name: string
  prospect: string
  context: string
  personName: string | null
  roleCompany: string | null
}

/** Reglas de negocio de un prospecto: nombre y descripción obligatorios, longitudes acotadas. */
export function buildProfileInput(raw: Partial<Record<keyof ProspectProfileInput, string | null>>): ProspectProfileInput {
  const prospect = (raw.prospect ?? '').trim()
  const context = (raw.context ?? '').trim()
  if (!prospect) throw new ValidationError('La descripción del prospecto es obligatoria.')
  if (prospect.length > MAX_PRACTICE_FIELD_CHARS || context.length > MAX_PRACTICE_FIELD_CHARS) {
    throw new ValidationError(`Contexto y perfil deben tener como máximo ${MAX_PRACTICE_FIELD_CHARS} caracteres.`)
  }

  const personName = normalizeStructuredValue(raw.personName).slice(0, 120) || null
  const name = (raw.name ?? '').trim().slice(0, 120) || personName || prospect.slice(0, 40)

  return {
    name,
    prospect,
    context,
    personName,
    roleCompany: normalizeStructuredValue(raw.roleCompany).slice(0, 200) || null,
  }
}
