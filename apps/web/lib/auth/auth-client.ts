/**
 * Cliente de autenticación con dos implementaciones intercambiables:
 *  - `supabase`: Supabase Auth real (enlace mágico por correo, flujo PKCE).
 *  - `dev`: login local contra POST /auth/dev-token del backend (desarrollo y pruebas E2E);
 *    pedir el enlace equivale a abrirlo: inicia sesión y redirige a `emailRedirectTo`.
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
    signInWithOtp(params: {
      email: string
      options?: { shouldCreateUser?: boolean; emailRedirectTo?: string }
    }): Result<unknown>
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

async function devSignIn(email: string) {
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
    user: { id: data.userId, email, app_metadata: { provider: 'email' }, user_metadata: {} },
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
    async signInWithOtp({ email, options }) {
      const error = await devSignIn(email)
      if (!error) window.location.assign(options?.emailRedirectTo || '/auth/callback')
      return { data: null, error }
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
