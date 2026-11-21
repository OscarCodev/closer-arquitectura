'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { closerApi } from '@/lib/api/closer-api'
import { errorMessage } from '@/lib/api/http'
import type { SavedProfile } from '../types/setup-types'

type UseProfileManagerOptions = {
  userId: string | null | undefined
  authReady: boolean
}

type ProfileFields = Pick<SavedProfile, 'prospect' | 'context'> & Partial<Pick<SavedProfile, 'name' | 'personName' | 'roleCompany'>>

/**
 * Biblioteca de prospectos. Cada acción es una petición por entidad (POST, PATCH, DELETE)
 * con actualización optimista; si el servidor falla, se revierte y se muestra el error.
 */
export function useProfileManager({ userId, authReady }: UseProfileManagerOptions) {
  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([])
  const [profileSelectorOpen, setProfileSelectorOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState<SavedProfile | null>(null)
  const [profilesError, setProfilesError] = useState<string | null>(null)
  const profileSelectorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!authReady) return
    let cancelled = false
    const load = async () => {
      if (!userId) {
        setSavedProfiles([])
        return
      }
      try {
        const profiles = await closerApi.listProfiles()
        if (!cancelled) setSavedProfiles(profiles)
      } catch {
        if (!cancelled) setProfilesError('No se pudo cargar tu biblioteca de prospectos.')
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [authReady, userId])

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (profileSelectorRef.current && !profileSelectorRef.current.contains(event.target as Node)) {
        setProfileSelectorOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  /** Guarda un prospecto nuevo y completa nombre/cargo con la extracción de IA en segundo plano. */
  const createProfile = useCallback(async (fields: ProfileFields) => {
    try {
      const created = await closerApi.createProfile(fields)
      setSavedProfiles((prev) => [created, ...prev])
      void closerApi
        .extractProfile(fields.prospect)
        .then(async (extracted) => {
          const roleCompany = [extracted.role, extracted.company].filter(Boolean).join(' en ')
          if (!extracted.name && !roleCompany) return
          const updated = await closerApi.updateProfile(created.id, {
            name: extracted.name || created.name,
            personName: extracted.name || undefined,
            roleCompany: roleCompany || undefined,
          })
          setSavedProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
        })
        .catch(() => {
          // la extracción es opcional
        })
      return created
    } catch (error) {
      setProfilesError(errorMessage(error, 'No se pudo guardar el prospecto.'))
      return null
    }
  }, [])

  const updateProfile = useCallback(async (profile: SavedProfile) => {
    let previous: SavedProfile[] = []
    setSavedProfiles((prev) => {
      previous = prev
      return prev.map((p) => (p.id === profile.id ? profile : p))
    })
    try {
      const updated = await closerApi.updateProfile(profile.id, {
        name: profile.name,
        prospect: profile.prospect,
        context: profile.context,
        personName: profile.personName,
        roleCompany: profile.roleCompany,
      })
      setSavedProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    } catch (error) {
      setSavedProfiles(previous)
      setProfilesError(errorMessage(error, 'No se pudo actualizar el prospecto.'))
    }
  }, [])

  const deleteProfile = useCallback(async (profileId: string) => {
    let previous: SavedProfile[] = []
    setSavedProfiles((prev) => {
      previous = prev
      return prev.filter((p) => p.id !== profileId)
    })
    setEditingProfile((prev) => (prev?.id === profileId ? null : prev))
    try {
      await closerApi.deleteProfile(profileId)
    } catch (error) {
      setSavedProfiles(previous)
      setProfilesError(errorMessage(error, 'No se pudo eliminar el prospecto.'))
    }
  }, [])

  return {
    savedProfiles,
    profilesError,
    createProfile,
    updateProfile,
    deleteProfile,
    profileSelectorOpen,
    profileSelectorRef,
    editingProfile,
    setEditingProfile,
    onToggleProfileSelector: () => setProfileSelectorOpen((prev) => !prev),
    onCloseProfileSelector: () => setProfileSelectorOpen(false),
  }
}
