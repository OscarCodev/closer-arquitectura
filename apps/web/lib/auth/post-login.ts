import { closerApi } from '@/lib/api/closer-api'
import { routes } from '@/lib/routes'

/** Después de iniciar sesión: al onboarding si el servidor no lo tiene completado; si no, a /setup. */
export async function resolvePostLoginRoute(): Promise<string> {
  try {
    const me = await closerApi.me()
    return me.onboardingCompleted ? routes.setup : routes.onboarding
  } catch {
    return routes.onboarding
  }
}
