import { appConfig } from '@/lib/config'
import { getAccessToken } from '@/lib/auth/auth-client'

/** Error de la API con el formato único del backend: `{ error, code, retryAfterSeconds? }`. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code: string,
    readonly retryAfterSeconds?: number,
  ) {
    super(message)
  }

  get isRateLimited() {
    return this.status === 429
  }
}

type RequestOptions = { method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'; body?: unknown; signal?: AbortSignal }

/** fetch hacia la API con el token de Supabase en `Authorization: Bearer`. */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = await getAccessToken()
  let response: Response
  try {
    response = await fetch(`${appConfig.apiUrl}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    })
  } catch {
    throw new ApiError(0, 'No hay conexión con el servidor. Revisa tu red e inténtalo de nuevo.', 'network_error')
  }

  if (response.status === 204) return undefined as T
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>
  if (!response.ok) {
    throw new ApiError(
      response.status,
      typeof data.error === 'string' ? data.error : 'Ocurrió un error inesperado.',
      typeof data.code === 'string' ? data.code : `http_${response.status}`,
      typeof data.retryAfterSeconds === 'number' ? data.retryAfterSeconds : undefined,
    )
  }
  return data as T
}

/** Mensaje listo para mostrar a partir de cualquier error. */
export function errorMessage(error: unknown, fallback = 'Ocurrió un error inesperado.') {
  return error instanceof ApiError ? error.message : fallback
}
