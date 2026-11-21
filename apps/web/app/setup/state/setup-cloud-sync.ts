import { mockFetch } from '@/mocks/api'
import type { RecentSession, SavedProfile } from '../types/setup-types'

async function safeParseJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T
  } catch {
    return null
  }
}

export async function loadProfilesFromCloud(): Promise<SavedProfile[] | null> {
  try {
    const response = await mockFetch('/api/setup/profiles', { method: 'GET' })
    if (!response.ok) return null

    const data = await safeParseJson<{ profiles?: SavedProfile[] }>(response)
    if (!data || !Array.isArray(data.profiles)) return []

    return data.profiles
  } catch {
    return null
  }
}

export async function saveProfilesToCloud(profiles: SavedProfile[]): Promise<void> {
  try {
    await mockFetch('/api/setup/profiles', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profiles }),
    })
  } catch {
    // fail silently and keep local state
  }
}

export async function loadSessionsFromCloud(): Promise<RecentSession[] | null> {
  try {
    const response = await mockFetch('/api/setup/sessions', { method: 'GET' })
    if (!response.ok) return null

    const data = await safeParseJson<{ sessions?: RecentSession[] }>(response)
    if (!data || !Array.isArray(data.sessions)) return []

    return data.sessions
  } catch {
    return null
  }
}

export async function saveSessionsToCloud(sessions: RecentSession[]): Promise<void> {
  try {
    await mockFetch('/api/setup/sessions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessions }),
    })
  } catch {
    // fail silently and keep local state
  }
}
