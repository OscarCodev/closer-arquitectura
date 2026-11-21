'use client'

import { useEffect, useRef, useState } from 'react'
import { getInitialSavedProfiles, getProfileStorageKey } from './setup-initializers'
import type { SavedProfile } from '../types/setup-types'
import { loadProfilesFromCloud, saveProfilesToCloud } from './setup-cloud-sync'

type UseProfileManagerOptions = {
  userId: string | null | undefined
  authReady: boolean
}

export function useProfileManager({ userId, authReady }: UseProfileManagerOptions) {
  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([])
  const [profileSelectorOpen, setProfileSelectorOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState<SavedProfile | null>(null)
  const [cloudHydrated, setCloudHydrated] = useState(false)
  const profileSelectorRef = useRef<HTMLDivElement>(null)
  const latestProfilesRef = useRef(savedProfiles)

  useEffect(() => {
    latestProfilesRef.current = savedProfiles
  }, [savedProfiles])

  useEffect(() => {
    if (!authReady) return

    const timeoutId = window.setTimeout(() => {
      if (!userId) {
        setSavedProfiles([])
        setCloudHydrated(false)
        return
      }

      setSavedProfiles(getInitialSavedProfiles(userId))
      setCloudHydrated(false)
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [authReady, userId])

  useEffect(() => {
    if (!authReady || !userId) return

    let isCancelled = false

    const hydrateFromCloud = async () => {
      const cloudProfiles = await loadProfilesFromCloud()
      if (isCancelled) return

      if (Array.isArray(cloudProfiles) && cloudProfiles.length > 0) {
        setSavedProfiles(cloudProfiles)
      } else if (Array.isArray(cloudProfiles) && latestProfilesRef.current.length > 0) {
        // Safe migration: local cache is now user-scoped, so syncing it cannot leak cross-account data.
        void saveProfilesToCloud(latestProfilesRef.current)
      }

      setCloudHydrated(true)
    }

    void hydrateFromCloud()

    return () => {
      isCancelled = true
    }
  }, [authReady, userId])

  useEffect(() => {
    if (!userId) return

    window.localStorage.setItem(getProfileStorageKey(userId), JSON.stringify(savedProfiles))
  }, [savedProfiles, userId])

  useEffect(() => {
    if (!authReady || !userId || !cloudHydrated) return

    const timeoutId = window.setTimeout(() => {
      void saveProfilesToCloud(savedProfiles)
    }, 500)

    return () => window.clearTimeout(timeoutId)
  }, [authReady, cloudHydrated, savedProfiles, userId])

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!profileSelectorRef.current) return
      if (!profileSelectorRef.current.contains(event.target as Node)) setProfileSelectorOpen(false)
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  return {
    savedProfiles,
    setSavedProfiles,
    profileSelectorOpen,
    profileSelectorRef,
    editingProfile,
    setEditingProfile,
    onToggleProfileSelector: () => setProfileSelectorOpen((prev) => !prev),
    onCloseProfileSelector: () => setProfileSelectorOpen(false),
  }
}
