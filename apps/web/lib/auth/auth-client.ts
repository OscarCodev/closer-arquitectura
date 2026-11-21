/**
 * Cliente de autenticación con dos implementaciones intercambiables:
 *  - `supabase`: Supabase Auth real (Google OAuth y código por email).
 *  - `dev`: login local contra POST /auth/dev-token del backend (desarrollo y pruebas E2E).
 * Ambas exponen el mismo subconjunto de la API de Supabase que usan las pantallas.
 */
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import { appConfig } from '@/lib/config'

export type User = {
  id: string
  email?: string
  app_metadata: Record<string, unknown> & { provider?: string }
  user_metadata: Record<string, unknown>
}

type Session = { user: User; access_token: string }
type AuthListener = (event: string, session: Session | null) => void
type Result<T = null> = Promise<{ data: T; error: { message: string } | null }>

export type AuthClient = {
  auth: {
    getUser(): Result<{ user: User | null }>
    getSession(): Result<{ session: Session | null }>
    onAuthStateChange(callback: AuthListener): { data: { subscription: { unsubscribe: () => void } } }
    signInWithOAuth(params: { provider: 'google'; options?: { redirectTo?: string } }): Result<unknown>
    signInWithOtp(params: { email: string; options?: { shouldCreateUser?: boolean } }): Result<unknown>
    verifyOtp(params: { email: string; token: string; type: 'email' }): Result<unknown>
    signOut(): Result<unknown>
  }
}

/* ── Supabase ─────────────────────────────────────────────────────── */

let supabaseSingleton: SupabaseClient | null = null

function supabaseClient(): AuthClient {
  if (!supabaseSingleton) {
    supabaseSingleton = createSupabaseClient(appConfig.supabaseUrl, appConfig.supabaseAnonKey, {
      auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  }
  return supabaseSingleton as unknown as AuthClient
}

/* ── Desarrollo (sin Supabase) ────────────────────────────────────── */

const DEV_SESSION_KEY = 'closer.dev-session.v1'
const devListeners = new Set<AuthListener>()

function readDevSession(): Session | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(DEV_SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as Session & { expiresAt: number }
    if (session.expiresAt < Date.now()) {
      window.localStorage.removeItem(DEV_SESSION_KEY)
      return null
    }
    return session
  } catch {
    return null
  }
}

function writeDevSession(session: (Session & { expiresAt: number }) | null) {
  try {
    if (session) window.localStorage.setItem(DEV_SESSION_KEY, JSON.stringify(session))
    else window.localStorage.removeItem(DEV_SESSION_KEY)
  } catch {
    // ignorar fallos de almacenamiento
  }
  devListeners.forEach((listener) => listener(session ? 'SIGNED_IN' : 'SIGNED_OUT', session))
}

async function devSignIn(email: string, provider: 'email' | 'google') {
  const response = await fetch(`${appConfig.apiUrl}/auth/dev-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  if (!response.ok) return { message: 'No se pudo iniciar sesión en modo desarrollo. ¿Está corriendo la API?' }
  const data = (await response.json()) as { accessToken: string; userId: string; expiresIn: number }
  writeDevSession({
    access_token: data.accessToken,
    expiresAt: Date.now() + data.expiresIn * 1000 - 30_000,
    user: { id: data.userId, email, app_metadata: { provider }, user_metadata: provider === 'google' ? { full_name: 'Usuario Demo' } : {} },
  })
  return null
}

const devClient: AuthClient = {
  auth: {
    async getUser() {
      return { data: { user: readDevSession()?.user ?? null }, error: null }
    },
    async getSession() {
      return { data: { session: readDevSession() }, error: null }
    },
    onAuthStateChange(callback) {
      devListeners.add(callback)
      return { data: { subscription: { unsubscribe: () => devListeners.delete(callback) } } }
    },
    async signInWithOAuth({ options }) {
      const error = await devSignIn('demo@closer.test', 'google')
      if (!error) window.location.assign(options?.redirectTo || '/auth/callback')
      return { data: null, error }
    },
    async signInWithOtp() {
      return { data: null, error: null }
    },
    async verifyOtp({ email }) {
      return { data: null, error: await devSignIn(email, 'email') }
    },
    async signOut() {
      writeDevSession(null)
      return { data: null, error: null }
    },
  },
}

export function createClient(): AuthClient {
  return appConfig.authMode === 'supabase' ? supabaseClient() : devClient
}

/** Access token actual para llamar a la API (se renueva solo con Supabase). */
export async function getAccessToken(): Promise<string | null> {
  const { data } = await createClient().auth.getSession()
  return data.session?.access_token ?? null
}
