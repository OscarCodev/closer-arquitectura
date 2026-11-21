import { ValidationError } from '../../../shared/domain/errors'

/** Respuestas del onboarding del vendedor (mismos campos que la pantalla /setup/onboarding). */
export type OnboardingAnswers = {
  firstName: string
  role: string
  roleOtherDetail: string
  industry: string
  industryOtherDetail: string
  sellsTo: string
  sellsToOtherDetail: string
  experienceLevel: string
  mainChallenge: string
  mainChallengeOtherDetail: string
  weeklyCalls: string
  goalWithCloser: string
  companyName: string
  phone: string
}

export const ONBOARDING_FIELDS: Array<keyof OnboardingAnswers> = [
  'firstName',
  'role',
  'roleOtherDetail',
  'industry',
  'industryOtherDetail',
  'sellsTo',
  'sellsToOtherDetail',
  'experienceLevel',
  'mainChallenge',
  'mainChallengeOtherDetail',
  'weeklyCalls',
  'goalWithCloser',
  'companyName',
  'phone',
]

const MAX_FIELD_CHARS = 200

/** Normaliza (recorta, limita longitud) y valida las respuestas. */
export function normalizeOnboarding(input: Partial<Record<string, unknown>>): OnboardingAnswers {
  const answers = {} as OnboardingAnswers
  for (const field of ONBOARDING_FIELDS) {
    const raw = input[field]
    answers[field] = typeof raw === 'string' ? raw.trim().slice(0, MAX_FIELD_CHARS) : ''
  }
  if (!answers.firstName) {
    throw new ValidationError('El nombre es obligatorio para completar el onboarding.')
  }
  return answers
}
