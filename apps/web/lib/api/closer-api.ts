/**
 * Cliente tipado de la API de Closer. Cada función corresponde a un endpoint documentado en Swagger
 * (http://localhost:4000/api/docs). Las pantallas usan solo este módulo para hablar con el backend.
 */
import type { AdvancedTab, OnboardingProfile, RecentSession, SavedProfile, SimulationSession } from '@/app/setup/types/setup-types'
import { apiRequest } from './http'

export type TranscriptEntry = { role: 'user' | 'model'; text: string; startedAt?: number; endedAt?: number }

export type LiveAccess = {
  provider: 'gemini' | 'fake'
  token: string
  model: string
  voiceName: string
  expiresAt: string
}

export type StartSimulationResponse = {
  simulationId: string
  session: RecentSession
  prospect: { name: string; role: string; company: string; description: string }
  live: LiveAccess
  maxCallMinutes: number
}

export type NewScenario = {
  context: string
  prospect: string
  prospectName?: string
  prospectRole?: string
  prospectCompany?: string
  advancedSelections: Record<AdvancedTab, string>
}

export type GeneratedScenario = {
  prospectName: string
  productName: string
  scenarioTheme: string
  context: string
  prospect: string
}

type ProfileFields = Pick<SavedProfile, 'name' | 'prospect' | 'context' | 'personName' | 'roleCompany'>
type ApiProfile = Omit<SavedProfile, 'createdAt'> & { createdAt: string; updatedAt: string }

/** La API devuelve fechas ISO; la biblioteca muestra una fecha corta legible. */
function toSavedProfile(profile: ApiProfile): SavedProfile {
  return {
    ...profile,
    createdAt: new Date(profile.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
  }
}

const json = (body: unknown) => ({ method: 'POST' as const, body })

export const closerApi = {
  /* Identidad */
  me: () => apiRequest<{ id: string; email: string | null; onboardingCompleted: boolean }>('/me'),
  getOnboarding: () =>
    apiRequest<{ onboarding: (OnboardingProfile & { completedAt: string }) | null }>('/me/onboarding').then((r) => r.onboarding),
  saveOnboarding: (profile: OnboardingProfile) =>
    apiRequest<{ onboarding: OnboardingProfile }>('/me/onboarding', { method: 'PUT', body: profile }).then((r) => r.onboarding),

  /* Prospectos */
  listProfiles: () => apiRequest<{ profiles: ApiProfile[] }>('/profiles').then((r) => r.profiles.map(toSavedProfile)),
  createProfile: (fields: Partial<ProfileFields> & Pick<ProfileFields, 'prospect' | 'context'>) =>
    apiRequest<ApiProfile>('/profiles', json(fields)).then(toSavedProfile),
  updateProfile: (id: string, fields: Partial<ProfileFields>) =>
    apiRequest<ApiProfile>(`/profiles/${id}`, { method: 'PATCH', body: fields }).then(toSavedProfile),
  deleteProfile: (id: string) => apiRequest<void>(`/profiles/${id}`, { method: 'DELETE' }),

  /* Sesiones (historial) */
  listSessions: () => apiRequest<{ sessions: RecentSession[] }>('/sessions').then((r) => r.sessions),
  renameSession: (id: string, name: string) => apiRequest<void>(`/sessions/${id}`, { method: 'PATCH', body: { name } }),
  deleteSession: (id: string) => apiRequest<void>(`/sessions/${id}`, { method: 'DELETE' }),

  /* Simulaciones */
  startSimulation: (input: NewScenario | { sessionId: string }) => apiRequest<StartSimulationResponse>('/simulations', json(input)),
  evaluateSimulation: (simulationId: string, transcript: TranscriptEntry[], durationSeconds: number) =>
    apiRequest<{ session: RecentSession; simulation: SimulationSession }>(
      `/simulations/${simulationId}/evaluate`,
      json({ transcript, durationSeconds: Math.round(durationSeconds) }),
    ),
  coachTip: (simulationId: string, transcript: TranscriptEntry[]) =>
    apiRequest<{ tip: string }>(`/simulations/${simulationId}/coach`, json({ transcript })).then((r) => r.tip),

  /* Asistente */
  extractProfile: (prospect: string) =>
    apiRequest<{ name: string; role: string; company: string; gender: 'female' | 'male' | 'unknown' }>(
      '/assist/extract-profile',
      json({ prospect }),
    ),
  generateScenario: () => apiRequest<GeneratedScenario>('/assist/scenario', { method: 'POST' }),

  /* Soporte */
  sendSupportMessage: (subject: string, message: string, pagePath?: string) =>
    apiRequest<{ ok: boolean; delivered: boolean }>('/support/contacts', json({ subject, message, pagePath })),
}
