import {
  DEFAULT_SAVED_PROFILES,
  PROFILE_STORAGE_KEY,
} from '../config/setup-config'
import type { SavedProfile, TabType } from '../types/setup-types'

export function getProfileStorageKey(userId: string | null | undefined): string {
  if (!userId) return PROFILE_STORAGE_KEY
  return `${PROFILE_STORAGE_KEY}.${userId}`
}

export function getInitialTabFromQuery(): TabType {
  if (typeof window === 'undefined') {
    return 'setup'
  }

  const searchParams = new URLSearchParams(window.location.search)
  const tab = searchParams.get('tab')

  if (tab === 'resultado' || tab === 'rendimiento') {
    return tab
  }

  return 'setup'
}

export function getInitialSavedProfiles(userId?: string | null): SavedProfile[] {
  if (typeof window === 'undefined') {
    return DEFAULT_SAVED_PROFILES
  }

  const rawProfiles = window.localStorage.getItem(getProfileStorageKey(userId))

  if (!rawProfiles || rawProfiles === '[]') {
    // Only show default profiles if user is not authenticated (userId is null/undefined)
    // Authenticated users with no saved profiles should see an empty library
    if (!userId) {
      return DEFAULT_SAVED_PROFILES
    }
    return []
  }

  try {
    const parsed = JSON.parse(rawProfiles) as SavedProfile[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}
