/**
 * MOCK — sustituye al cliente de Supabase.
 *
 * Implementa solo la parte de la API que usa el frontend (auth + un query
 * builder mínimo). El "usuario" vive en localStorage, así que el flujo
 * login → onboarding → setup funciona igual que en la app real, sin backend.
 *
 * Cualquier email / código OTP es válido.
 */

export type User = {
  id: string
  email?: string
  app_metadata: Record<string, unknown> & { provider?: string }
  user_metadata: Record<string, unknown>
}

type Session = { user: User }
type AuthListener = (event: string, session: Session | null) => void
type MockResult<T = null> = Promise<{ data: T; error: { message: string; code?: string } | null }>

const USER_KEY = 'closer.mock.user'
const listeners = new Set<AuthListener>()

function readUser(): User | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

function writeUser(user: User | null) {
  try {
    if (user) window.localStorage.setItem(USER_KEY, JSON.stringify(user))
    else window.localStorage.removeItem(USER_KEY)
  } catch {
    // ignore storage failures
  }
  const event = user ? 'SIGNED_IN' : 'SIGNED_OUT'
  listeners.forEach((listener) => listener(event, user ? { user } : null))
}

function signInAs(email: string, provider: 'email' | 'google') {
  const existing = readUser()
  if (existing && existing.email === email) {
    writeUser(existing)
    return existing
  }
  const user: User = {
    id: 'demo-user',
    email,
    app_metadata: { provider },
    user_metadata: provider === 'google' ? { full_name: 'Usuario Demo' } : {},
  }
  writeUser(user)
  return user
}

const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms))

type QueryResult = { data: Record<string, unknown> | null; error: { message: string; code?: string } | null }

interface QueryBuilder extends PromiseLike<QueryResult> {
  select: (...args: unknown[]) => QueryBuilder
  eq: (...args: unknown[]) => QueryBuilder
  insert: (...args: unknown[]) => QueryBuilder
  update: (...args: unknown[]) => QueryBuilder
  upsert: (...args: unknown[]) => QueryBuilder
  delete: (...args: unknown[]) => QueryBuilder
  single: () => Promise<QueryResult>
  maybeSingle: () => Promise<QueryResult>
}

/**
 * Query builder que acepta cualquier encadenado y no devuelve datos.
 * El perfil de onboarding se lee de user_metadata (ver use-auth-store).
 */
function createQueryBuilder(): QueryBuilder {
  const result: QueryResult = { data: null, error: null }
  const builder: QueryBuilder = {
    select: () => builder,
    eq: () => builder,
    insert: () => builder,
    update: () => builder,
    upsert: () => builder,
    delete: () => builder,
    single: async () => result,
    maybeSingle: async () => result,
    then: (onFulfilled, onRejected) => Promise.resolve(result).then(onFulfilled, onRejected),
  }
  return builder
}

const auth = {
  async getUser(): MockResult<{ user: User | null }> {
    return { data: { user: readUser() }, error: null }
  },

  onAuthStateChange(callback: AuthListener) {
    listeners.add(callback)
    return { data: { subscription: { unsubscribe: () => listeners.delete(callback) } } }
  },

  /** "Google": inicia sesión al instante y navega al redirectTo (callback). */
  async signInWithOAuth({ options }: { provider: string; options?: { redirectTo?: string } }): MockResult {
    await delay(300)
    signInAs('demo@closer.app', 'google')
    window.location.assign(options?.redirectTo || '/auth/callback')
    return { data: null, error: null }
  },

  /** Simula el envío del código; no se envía nada. */
  async signInWithOtp(_args: { email: string; options?: unknown }): MockResult {
    await delay()
    return { data: null, error: null }
  },

  /** Cualquier código es válido. */
  async verifyOtp({ email }: { email: string; token: string; type: string }): MockResult {
    await delay()
    signInAs(email, 'email')
    return { data: null, error: null }
  },

  async updateUser({ data }: { data: Record<string, unknown> }): MockResult<{ user: User | null }> {
    await delay(300)
    const user = readUser()
    if (!user) return { data: { user: null }, error: { message: 'No autenticado' } }
    const updated: User = { ...user, user_metadata: { ...user.user_metadata, ...data } }
    writeUser(updated)
    return { data: { user: updated }, error: null }
  },

  async signOut(): MockResult {
    writeUser(null)
    return { data: null, error: null }
  },
}

const client = {
  auth,
  from: (_table: string) => createQueryBuilder(),
}

export type SupabaseClient = typeof client

export function createClient(): SupabaseClient {
  return client
}
