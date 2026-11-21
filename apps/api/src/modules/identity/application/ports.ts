import type { AuthenticatedUser } from '../domain/authenticated-user'
import type { OnboardingAnswers } from '../domain/onboarding'

/** Verifica un access token y devuelve la identidad (Supabase JWT). */
export interface TokenVerifierPort {
  verify(token: string): Promise<AuthenticatedUser>
}
export const TOKEN_VERIFIER = Symbol('TOKEN_VERIFIER')

export interface UserRepositoryPort {
  /** Crea el usuario si no existe y actualiza su última actividad. */
  upsert(user: AuthenticatedUser): Promise<void>
  findOnboarding(userId: string): Promise<{ answers: OnboardingAnswers; completedAt: Date } | null>
  saveOnboarding(userId: string, answers: OnboardingAnswers): Promise<{ answers: OnboardingAnswers; completedAt: Date }>
}
export const USER_REPOSITORY = Symbol('USER_REPOSITORY')
