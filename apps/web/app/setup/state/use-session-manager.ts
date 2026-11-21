'use client'

import { useCallback, useEffect, useState } from 'react'
import { closerApi } from '@/lib/api/closer-api'
import { useActiveSessionStore } from '@/stores/use-active-session-store'
import type { RecentSession } from '../types/setup-types'

type UseSessionManagerOptions = {
  userId: string | null | undefined
  authReady: boolean
}

const PAGE_SIZE = 10
const selectedKey = (userId: string) => `closer.selected-session.v2.${userId}`

/**
 * Historial de sesiones. La fuente de verdad es el servidor:
 * se lee con GET /sessions y cada cambio (renombrar, borrar) es una petición por entidad.
 * Se eliminó la sincronización de "estado completo" desde localStorage del MVP, que podía borrar datos entre pestañas.
 */
export function useSessionManager({ userId, authReady }: UseSessionManagerOptions) {
  const activeSession = useActiveSessionStore((state) => state.activeSession)
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([])
  const [selectedRecentSessionId, setSelectedRecentSessionId] = useState<string | null>(null)
  const [sessionsHydrating, setSessionsHydrating] = useState(true)
  const [visibleRecentSessionCount, setVisibleRecentSessionCount] = useState(PAGE_SIZE)
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editingSessionName, setEditingSessionName] = useState('')
  const [openSessionMenuId, setOpenSessionMenuId] = useState<string | null>(null)
  const [sessionToDeleteId, setSessionToDeleteId] = useState<string | null>(null)
  const [sessionsError, setSessionsError] = useState<string | null>(null)

  useEffect(() => {
    if (!authReady) return
    let cancelled = false

    const load = async () => {
      if (!userId) {
        setRecentSessions([])
        setSelectedRecentSessionId(null)
        setSessionsHydrating(false)
        return
      }
      try {
        const sessions = await closerApi.listSessions()
        if (cancelled) return
        setRecentSessions(sessions)
        const remembered = readSelected(userId)
        setSelectedRecentSessionId(sessions.some((s) => s.id === remembered) ? remembered : (sessions[0]?.id ?? null))
        setSessionsError(null)
      } catch {
        if (!cancelled) setSessionsError('No se pudo cargar tu historial.')
      } finally {
        if (!cancelled) setSessionsHydrating(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [authReady, userId])

  // Una sesión recién evaluada (vuelve de /simulation) se coloca al inicio sin recargar todo.
  // Se ajusta durante el render (patrón "estado derivado de una prop") en vez de en un efecto.
  const activeStamp = activeSession && activeSession.simulations.length > 0 ? `${activeSession.id}:${activeSession.simulations.length}` : null
  const [mergedStamp, setMergedStamp] = useState<string | null>(null)
  if (!sessionsHydrating && activeSession && activeStamp && activeStamp !== mergedStamp) {
    setMergedStamp(activeStamp)
    setRecentSessions((prev) => [activeSession, ...prev.filter((session) => session.id !== activeSession.id)])
    setSelectedRecentSessionId(activeSession.id)
  }

  useEffect(() => {
    if (!userId || !selectedRecentSessionId) return
    try {
      window.localStorage.setItem(selectedKey(userId), selectedRecentSessionId)
    } catch {
      // preferencia de interfaz, no es crítico
    }
  }, [selectedRecentSessionId, userId])

  useEffect(() => {
    if (openSessionMenuId === null) return
    const close = () => setOpenSessionMenuId(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [openSessionMenuId])

  const onSaveEditingSessionName = useCallback(async (sessionId: string, value: string) => {
    const name = value.trim()
    setEditingSessionId(null)
    if (!name) return

    let previous: RecentSession[] = []
    setRecentSessions((prev) => {
      previous = prev
      return prev.map((item) => (item.id === sessionId ? { ...item, name } : item))
    })
    try {
      await closerApi.renameSession(sessionId, name)
    } catch {
      setRecentSessions(previous)
      setSessionsError('No se pudo renombrar la sesión.')
    }
  }, [])

  const onConfirmDeleteSession = useCallback(async () => {
    if (sessionToDeleteId === null) return
    const deletingId = sessionToDeleteId
    setSessionToDeleteId(null)

    let previous: RecentSession[] = []
    setRecentSessions((prev) => {
      previous = prev
      return prev.filter((session) => session.id !== deletingId)
    })
    try {
      await closerApi.deleteSession(deletingId)
      const { activeSession: current, clearActiveSession } = useActiveSessionStore.getState()
      if (current?.id === deletingId) clearActiveSession()
    } catch {
      setRecentSessions(previous)
      setSessionsError('No se pudo eliminar la sesión.')
    }
  }, [sessionToDeleteId])

  const effectiveSelectedId =
    selectedRecentSessionId && recentSessions.some((s) => s.id === selectedRecentSessionId)
      ? selectedRecentSessionId
      : (recentSessions[0]?.id ?? null)
  const selectedRecentSessionIdx = recentSessions.findIndex((session) => session.id === effectiveSelectedId)

  return {
    recentSessions,
    visibleRecentSessions: recentSessions.slice(0, visibleRecentSessionCount),
    hasMoreRecentSessions: visibleRecentSessionCount < recentSessions.length,
    loadMoreRecentSessions: () => setVisibleRecentSessionCount((prev) => Math.min(prev + PAGE_SIZE, recentSessions.length)),
    selectedRecentSessionIdx,
    setSelectedRecentSessionIdx: (idx: number) => {
      const next = recentSessions[idx]
      if (next) setSelectedRecentSessionId(next.id)
    },
    sessionsHydrating,
    sessionsError,
    editingSessionId,
    editingSessionName,
    openSessionMenuId,
    sessionToDeleteId,
    setSessionToDeleteId,
    onStartEditingSession: (sessionId: string, name: string) => {
      setEditingSessionId(sessionId)
      setEditingSessionName(name)
    },
    onChangeEditingSessionName: setEditingSessionName,
    onSaveEditingSessionName,
    onCancelEditingSession: () => setEditingSessionId(null),
    onToggleSessionMenu: (sessionId: string) => setOpenSessionMenuId((prev) => (prev === sessionId ? null : sessionId)),
    onRequestDeleteSession: setSessionToDeleteId,
    onConfirmDeleteSession,
  }
}

function readSelected(userId: string) {
  try {
    return window.localStorage.getItem(selectedKey(userId))
  } catch {
    return null
  }
}
