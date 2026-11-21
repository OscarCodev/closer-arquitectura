'use client'

import { useEffect, useRef, useState } from 'react'
import type { RecentSession } from '../types/setup-types'
import { useActiveSessionStore } from '@/stores/use-active-session-store'
import { loadSessionsFromCloud, saveSessionsToCloud } from './setup-cloud-sync'

type UseSessionManagerOptions = {
  userId: string | null | undefined
  authReady: boolean
}

const RECENT_SESSIONS_STORAGE_KEY_BASE = 'closer.recent-sessions.v1'
const SELECTED_SESSION_STORAGE_KEY_BASE = 'closer.recent-sessions.selected-id.v1'
const LEGACY_SELECTED_SESSION_STORAGE_KEY_BASE = 'closer.recent-sessions.selected.v1'

function getRecentSessionsStorageKey(userId: string | null | undefined): string {
  if (!userId) return RECENT_SESSIONS_STORAGE_KEY_BASE
  return `${RECENT_SESSIONS_STORAGE_KEY_BASE}.${userId}`
}

function getSelectedSessionStorageKey(userId: string | null | undefined): string {
  if (!userId) return SELECTED_SESSION_STORAGE_KEY_BASE
  return `${SELECTED_SESSION_STORAGE_KEY_BASE}.${userId}`
}

function loadRecentSessions(userId: string | null | undefined): RecentSession[] {
  if (typeof window === 'undefined' || !userId) return []
  try {
    const raw = window.localStorage.getItem(getRecentSessionsStorageKey(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as RecentSession[]) : []
  } catch {
    return []
  }
}

function getSessionStamp(session: RecentSession): number {
  const simulationCreatedAt = session.simulations[session.simulations.length - 1]?.createdAt
  const sessionCreatedAt = session.createdAt
  const date = new Date(simulationCreatedAt || sessionCreatedAt || '')
  return Number.isNaN(date.getTime()) ? 0 : date.getTime()
}

function mergeRecentSessions(...groups: RecentSession[][]): RecentSession[] {
  const byId = new Map<string, RecentSession>()

  for (const group of groups) {
    for (const session of group) {
      const existing = byId.get(session.id)
      if (!existing) {
        byId.set(session.id, session)
        continue
      }

      const existingStamp = getSessionStamp(existing)
      const incomingStamp = getSessionStamp(session)

      if (incomingStamp > existingStamp) {
        byId.set(session.id, session)
        continue
      }

      if (incomingStamp === existingStamp && (session.simulations?.length || 0) >= (existing.simulations?.length || 0)) {
        byId.set(session.id, session)
      }
    }
  }

  return [...byId.values()].sort((left, right) => {
    const stampDelta = getSessionStamp(right) - getSessionStamp(left)
    if (stampDelta !== 0) return stampDelta
    const simulationDelta = (right.simulations?.length || 0) - (left.simulations?.length || 0)
    if (simulationDelta !== 0) return simulationDelta
    return right.id.localeCompare(left.id)
  })
}

function loadSelectedSessionId(userId: string | null | undefined, sessions: RecentSession[]): string | null {
  if (typeof window === 'undefined' || !userId) return null
  try {
    const raw = window.localStorage.getItem(getSelectedSessionStorageKey(userId))
    if (raw && sessions.some((session) => session.id === raw)) {
      return raw
    }

    const legacyRaw = window.localStorage.getItem(`${LEGACY_SELECTED_SESSION_STORAGE_KEY_BASE}.${userId}`)
    const legacyIndex = legacyRaw ? Number.parseInt(legacyRaw, 10) : 0
    if (Number.isFinite(legacyIndex) && legacyIndex >= 0 && sessions[legacyIndex]) {
      return sessions[legacyIndex].id
    }

    return sessions[0]?.id || null
  } catch {
    return sessions[0]?.id || null
  }
}

export function useSessionManager({ userId, authReady }: UseSessionManagerOptions) {
  const activeSession = useActiveSessionStore((state) => state.activeSession)
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([])
  const [selectedRecentSessionId, setSelectedRecentSessionId] = useState<string | null>(null)
  const [sessionsHydrating, setSessionsHydrating] = useState(true)
  const [visibleRecentSessionCount, setVisibleRecentSessionCount] = useState(10)
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editingSessionName, setEditingSessionName] = useState('')
  const [openSessionMenuId, setOpenSessionMenuId] = useState<string | null>(null)
  const [sessionToDeleteId, setSessionToDeleteId] = useState<string | null>(null)
  const latestSessionsRef = useRef(recentSessions)

  useEffect(() => {
    latestSessionsRef.current = recentSessions
  }, [recentSessions])

  useEffect(() => {
    if (!authReady) return

    let isCancelled = false

    const hydrateFromCloud = async () => {
      setSessionsHydrating(true)
      setVisibleRecentSessionCount(10)

      if (!userId) {
        setRecentSessions([])
        setSelectedRecentSessionId(null)
        setSessionsHydrating(false)
        return
      }

      const localSessions = loadRecentSessions(userId)
      const cloudSessions = await loadSessionsFromCloud()
      if (isCancelled) return

      const activeSession = useActiveSessionStore.getState().activeSession
      const mergedSessions = mergeRecentSessions(
        localSessions,
        Array.isArray(cloudSessions) ? cloudSessions : [],
        activeSession && activeSession.simulations.length > 0 ? [activeSession] : [],
      )

      setRecentSessions(mergedSessions)
      setSelectedRecentSessionId(loadSelectedSessionId(userId, mergedSessions))
      setSessionsHydrating(false)
    }

    void hydrateFromCloud()

    return () => {
      isCancelled = true
    }
  }, [authReady, userId])

  useEffect(() => {
    if (!userId) return

    try {
      window.localStorage.setItem(getRecentSessionsStorageKey(userId), JSON.stringify(recentSessions))
    } catch {
      // ignore localStorage write errors
    }
  }, [recentSessions, userId])

  useEffect(() => {
    if (!authReady || !userId || sessionsHydrating) return

    const timeoutId = window.setTimeout(() => {
      void saveSessionsToCloud(recentSessions)
    }, 700)

    return () => window.clearTimeout(timeoutId)
  }, [authReady, recentSessions, sessionsHydrating, userId])

  useEffect(() => {
    if (!userId) return

    try {
      if (selectedRecentSessionId) {
        window.localStorage.setItem(getSelectedSessionStorageKey(userId), selectedRecentSessionId)
      }
    } catch {
      // ignore localStorage write errors
    }
  }, [selectedRecentSessionId, userId])

  useEffect(() => {
    if (sessionsHydrating || !activeSession || activeSession.simulations.length === 0) return

    setRecentSessions((prev) => mergeRecentSessions([activeSession], prev))
    setSelectedRecentSessionId(activeSession.id)
  }, [activeSession, sessionsHydrating])

  useEffect(() => {
    const handleClickOutside = () => {
      if (openSessionMenuId !== null) setOpenSessionMenuId(null)
    }

    if (openSessionMenuId !== null) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => document.removeEventListener('click', handleClickOutside)
  }, [openSessionMenuId])

  const onStartEditingSession = (sessionId: string, name: string) => {
    setEditingSessionId(sessionId)
    setEditingSessionName(name)
  }

  const onSaveEditingSessionName = (sessionId: string, value: string) => {
    const trimmed = value.trim()

    if (trimmed) {
      setRecentSessions((prev) =>
        prev.map((item) => (item.id === sessionId ? { ...item, name: trimmed } : item)),
      )
    }

    setEditingSessionId(null)
  }

  const onToggleSessionMenu = (sessionId: string) => {
    setOpenSessionMenuId((prev) => (prev === sessionId ? null : sessionId))
  }

  const onConfirmDeleteSession = () => {
    if (sessionToDeleteId === null) return

    const deletingSessionId = sessionToDeleteId
    const deletingIdx = recentSessions.findIndex((session) => session.id === deletingSessionId)

    setRecentSessions((prev) => prev.filter((session) => session.id !== deletingSessionId))
    setSelectedRecentSessionId((prev) => {
      if (prev !== deletingSessionId) return prev
      return recentSessions[deletingIdx + 1]?.id || recentSessions[deletingIdx - 1]?.id || recentSessions[0]?.id || null
    })

    setSessionToDeleteId(null)
  }

  useEffect(() => {
    if (recentSessions.length === 0) {
      setSelectedRecentSessionId(null)
      return
    }

    if (!selectedRecentSessionId || !recentSessions.some((session) => session.id === selectedRecentSessionId)) {
      setSelectedRecentSessionId(recentSessions[0]?.id || null)
    }
  }, [recentSessions, selectedRecentSessionId])

  const selectedRecentSessionIdx = recentSessions.findIndex((session) => session.id === selectedRecentSessionId)

  const setSelectedRecentSessionIdx = (idx: number) => {
    const nextSession = recentSessions[idx]
    if (!nextSession) return
    setSelectedRecentSessionId(nextSession.id)
  }

  return {
    recentSessions,
    visibleRecentSessions: recentSessions.slice(0, visibleRecentSessionCount),
    hasMoreRecentSessions: visibleRecentSessionCount < recentSessions.length,
    loadMoreRecentSessions: () => {
      setVisibleRecentSessionCount((prev) => Math.min(prev + 10, recentSessions.length))
    },
    selectedRecentSessionIdx,
    setSelectedRecentSessionIdx,
    sessionsHydrating,
    editingSessionId,
    editingSessionName,
    openSessionMenuId,
    sessionToDeleteId,
    setSessionToDeleteId,
    onStartEditingSession,
    onChangeEditingSessionName: setEditingSessionName,
    onSaveEditingSessionName,
    onCancelEditingSession: () => setEditingSessionId(null),
    onToggleSessionMenu,
    onRequestDeleteSession: setSessionToDeleteId,
    onConfirmDeleteSession,
  }
}
