'use client'

import { useEffect, useRef, useState } from 'react'
import { AppIcon } from '@/components/brand/app-icon'
import type { RecentSession, TabType } from '../types/setup-types'
import type { SubscriptionPlan } from '@/lib/billing/plan'

type SetupSidebarProps = {
  sidebarOpen: boolean
  activeTab: TabType
  visibleRecentSessions: RecentSession[]
  isRecentSessionsHydrating: boolean
  hasMoreRecentSessions: boolean
  selectedRecentSessionIdx: number
  editingSessionId: string | null
  editingSessionName: string
  openSessionMenuId: string | null
  onSelectTab: (tab: TabType) => void
  onSelectRecentSession: (idx: number) => void
  onStartEditingSession: (sessionId: string, name: string) => void
  onChangeEditingSessionName: (value: string) => void
  onSaveEditingSessionName: (sessionId: string, value: string) => void
  onCancelEditingSession: () => void
  onToggleSessionMenu: (sessionId: string) => void
  onRequestDeleteSession: (sessionId: string) => void
  onLoadMoreRecentSessions: () => void
  onOpenSettings: () => void
  onOpenUpgradePlan: () => void
  onOpenContact: () => void
  onSignOut: () => void
  userName: string
  userEmail: string
  billingPlan: SubscriptionPlan
}

export function SetupSidebar({
  sidebarOpen,
  activeTab,
  visibleRecentSessions,
  isRecentSessionsHydrating,
  hasMoreRecentSessions,
  selectedRecentSessionIdx,
  editingSessionId,
  editingSessionName,
  openSessionMenuId,
  onSelectTab,
  onSelectRecentSession,
  onStartEditingSession,
  onChangeEditingSessionName,
  onSaveEditingSessionName,
  onCancelEditingSession,
  onToggleSessionMenu,
  onRequestDeleteSession,
  onLoadMoreRecentSessions,
  onOpenSettings,
  onOpenUpgradePlan,
  onOpenContact,
  onSignOut,
  userName,
  userEmail,
  billingPlan,
}: SetupSidebarProps) {
  const renderedSessions = visibleRecentSessions
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const accountMenuRef = useRef<HTMLDivElement | null>(null)

  const getDisplaySessionName = (session: RecentSession) => {
    const name = (session.name || '').trim()
    const normalized = name.toLowerCase()

    const isGeneric =
      !name ||
      /^simulaci[oó]n\b/.test(normalized) ||
      /^llamada\b/.test(normalized) ||
      /^evaluaci[oó]n\b/.test(normalized) ||
      /^resultado\b/.test(normalized) ||
      /^sesi[oó]n\b/.test(normalized) ||
      normalized.length < 10

    if (!isGeneric) return name

    const prospectRef = (session.prospect || '').trim()
    if (prospectRef) {
      const firstChunk = prospectRef.split(/[\n,.]/)[0]?.trim() || prospectRef
      return `Llamada con ${firstChunk}`
    }

    const contextRef = (session.context || '').trim()
    if (contextRef) {
      const firstChunk = contextRef.split(/[\n,.]/)[0]?.trim() || contextRef
      return `Sesion comercial: ${firstChunk}`
    }

    return 'Sesion comercial reciente'
  }

  // Helper: Get time string from createdAt
  const getTimeString = (createdAt: string) => {
    const date = new Date(createdAt)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Hace unos segundos'
    if (diffMins < 60) return `Hace ${diffMins} min`
    if (diffHours < 24) return `Hace ${diffHours}h`
    if (diffDays === 1) return 'Ayer'
    if (diffDays < 7) return `Hace ${diffDays} días`
    return date.toLocaleDateString('es-ES')
  }

  // Helper: Get latest attempt score
  const getLatestScore = (session: RecentSession) => {
    if (!session.simulations || session.simulations.length === 0) return 0
    return session.simulations[session.simulations.length - 1].metrics.score
  }

  const navItemClass = (tab: TabType) =>
    `typo-body flex items-center gap-3 rounded-[10px] px-3 py-2.5 font-semibold transition-colors ${
      activeTab === tab
        ? 'bg-[var(--brand-mist-200)] text-[var(--brand-ink-900)]'
        : 'text-[var(--brand-gray-600)] hover:bg-[var(--brand-light-300)] hover:text-[var(--brand-ink-800)]'
    }`


  const displayName = userName.trim() || 'Tu cuenta'
  const emailLabel = userEmail.trim() || 'Cuenta conectada'
  const planLabel = billingPlan === 'pro' ? 'Plan Pro' : 'Plan Gratis'

  useEffect(() => {
    if (!accountMenuOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountMenuOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAccountMenuOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [accountMenuOpen])

  const closeAccountMenu = () => setAccountMenuOpen(false)
  return (
    <aside
      className={`fixed left-0 top-0 z-30 flex h-screen w-[270px] flex-col border-r border-[var(--color-border)] bg-[var(--brand-light-300)] p-3 transition-transform md:static md:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="mb-3 flex items-center justify-between px-1 py-1">
        <div className="flex items-center gap-2.5">
          <AppIcon size={30} />
          <span className="typo-body font-semibold">Closer</span>
        </div>
      </div>

      <nav className="grid gap-1">
        <button type="button" onClick={() => onSelectTab('setup')} className={navItemClass('setup')}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          Nueva práctica
        </button>
        <button type="button" onClick={() => onSelectTab('prospectos')} className={navItemClass('prospectos')}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Perfiles
        </button>
        <button type="button" onClick={() => onSelectTab('rendimiento')} className={navItemClass('rendimiento')}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          Tu progreso
        </button>
      </nav>

      <div
        className="sidebar-scrollbar mt-6 flex-1 overflow-x-hidden overflow-y-auto"
        onScroll={(event) => {
          if (!hasMoreRecentSessions || isRecentSessionsHydrating) return

          const element = event.currentTarget
          const distanceToBottom = element.scrollHeight - element.scrollTop - element.clientHeight
          if (distanceToBottom < 72) {
            onLoadMoreRecentSessions()
          }
        }}
      >
        <h3 className="typo-micro px-2 font-semibold uppercase tracking-[0.12em] text-[var(--brand-gray-500)]">
          Recientes
        </h3>
        <div className="mt-2 grid gap-1 px-1">
          {isRecentSessionsHydrating ? (
            <div className="space-y-1.5 px-1 py-1">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="animate-pulse rounded-[10px] px-2.5 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="h-4 w-4/5 rounded bg-[var(--brand-light-500)]" />
                      <div className="mt-2 h-3 w-1/3 rounded bg-[var(--brand-light-500)]" />
                    </div>
                    <div className="h-6 w-[56px] rounded-full bg-[var(--brand-light-500)]" />
                  </div>
                </div>
              ))}
            </div>
          ) : renderedSessions.length === 0 ? (
            <div className="mt-2 rounded-xl border border-dashed border-[var(--brand-gray-300)] bg-[var(--brand-light-200)] px-3 py-4">
              <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-mist-200)] text-[var(--brand-blue-700)]">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18" />
                  <path d="M3 12h18" />
                  <path d="M3 18h12" />
                  <circle cx="18" cy="18" r="3" />
                </svg>
              </div>
              <p className="typo-body font-semibold text-[var(--brand-gray-700)]">Tu historial aparecerá aquí</p>
              <p className="typo-micro mt-1 leading-relaxed text-[var(--brand-gray-500)]">
                Cada simulación que hagas en Closer se guardará en este espacio para que revises tu evolución.
              </p>
            </div>
          ) : (
            renderedSessions.map((session, idx) => {
              const displayName = getDisplaySessionName(session)
              const isEditing = editingSessionId === session.id
              const isOpenMenu = openSessionMenuId === session.id

              return (
              <div key={session.id} className="group relative">
                <div
                  onClick={() => {
                    if (!isEditing) {
                      onSelectRecentSession(idx)
                    }
                  }}
                  onDoubleClick={(event) => {
                    event.stopPropagation()
                    onStartEditingSession(session.id, session.name)
                  }}
                  className={`grid w-full min-w-0 cursor-pointer grid-cols-[minmax(0,1fr)_80px] items-center gap-2 rounded-[10px] px-2.5 py-2 text-left font-medium transition-all ${
                    activeTab === 'resultado' && selectedRecentSessionIdx === idx
                      ? 'bg-[var(--brand-light-400)]'
                      : 'hover:bg-[var(--brand-light-400)]'
                  }`}
                >
                  <div className="min-w-0">
                    {isEditing ? (
                      <input
                        autoFocus
                        value={editingSessionName}
                        onChange={(event) => onChangeEditingSessionName(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            onSaveEditingSessionName(session.id, editingSessionName)
                          }

                          if (event.key === 'Escape') {
                            onCancelEditingSession()
                          }
                        }}
                        onBlur={() => onSaveEditingSessionName(session.id, editingSessionName)}
                        onClick={(event) => event.stopPropagation()}
                        className="typo-body w-full rounded-md border border-[var(--brand-blue-400)] bg-white px-1.5 py-0.5 font-semibold text-[var(--brand-gray-700)] outline-none focus:ring-1 focus:ring-[var(--brand-blue-400)]"
                      />
                    ) : (
                      <p
                        className={`typo-body block max-w-full overflow-hidden text-ellipsis whitespace-nowrap font-semibold ${
                          activeTab === 'resultado' && selectedRecentSessionIdx === idx
                            ? 'text-[var(--brand-ink-900)]'
                            : 'text-[var(--brand-gray-700)]'
                        }`}
                        title={displayName}
                      >
                        {displayName}
                      </p>
                    )}
                    <p className="typo-micro truncate text-[var(--brand-gray-500)]" title={getTimeString(session.createdAt)}>
                      {getTimeString(session.createdAt)}
                    </p>
                  </div>
                  <div className="relative flex h-8 items-center justify-end">
                    <span
                      className={`typo-micro min-w-[56px] cursor-default rounded-full bg-[var(--brand-mist-200)] px-2.5 py-1 text-center font-semibold text-[var(--brand-blue-700)] transition-opacity ${
                        isOpenMenu
                          ? 'opacity-0'
                          : 'group-hover:pointer-events-none group-hover:opacity-0'
                      }`}
                    >
                      {getLatestScore(session)}/100
                    </span>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        onToggleSessionMenu(session.id)
                      }}
                      className={`absolute right-0 grid h-8 w-8 place-items-center rounded-lg text-[var(--brand-gray-400)] transition-all hover:bg-[var(--brand-light-500)] hover:text-[var(--brand-gray-700)] ${
                        isOpenMenu
                          ? 'bg-[var(--brand-light-500)] opacity-100'
                          : 'pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100'
                      }`}
                      aria-label={`Abrir acciones de ${displayName}`}
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="5" r="1" />
                        <circle cx="12" cy="12" r="1" />
                        <circle cx="12" cy="19" r="1" />
                      </svg>
                    </button>
                  </div>
                </div>

                {isOpenMenu && (
                  <div className="dropdown-animation-reveal absolute right-1 top-full z-20 mt-[-4px] w-[140px] rounded-xl border border-[var(--brand-gray-200)] bg-white p-1.5 shadow-xl">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        onStartEditingSession(session.id, session.name)
                        onToggleSessionMenu(session.id)
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-[var(--brand-gray-700)] transition-colors hover:bg-[var(--brand-light-200)]"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[var(--brand-gray-400)]" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                      </svg>
                      Editar
                    </button>
                    <div className="my-1 h-px bg-[var(--brand-gray-100)]" />
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        onRequestDeleteSession(session.id)
                        onToggleSessionMenu(session.id)
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-red-500 transition-colors hover:bg-red-50"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-red-400" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
              )
            })
          )}
          {!isRecentSessionsHydrating && hasMoreRecentSessions && renderedSessions.length > 0 && (
            <div className="px-2 py-2 text-center">
              <span className="typo-micro font-semibold uppercase tracking-[0.12em] text-[var(--brand-gray-400)]">
                Desplaza para cargar más
              </span>
            </div>
          )}
        </div>
      </div>

      <div ref={accountMenuRef} className="relative mt-4 border-t border-[var(--color-border)] pt-3">
        {accountMenuOpen && (
          <div className="dropdown-animation-reveal absolute bottom-full left-2 right-2 z-30 mb-3 overflow-hidden rounded-[20px] border border-[var(--brand-gray-200)] bg-white shadow-2xl shadow-[rgba(10,10,10,0.12)]">
            <div className="border-b border-[var(--brand-gray-100)] px-4 py-3">
              <p className="typo-micro font-semibold uppercase tracking-[0.16em] text-[var(--brand-gray-500)]">Cuenta</p>
              <div className="mt-1 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-ink-900)] text-sm font-bold text-white">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="typo-body truncate font-semibold text-[var(--brand-ink-900)]">{displayName}</p>
                  <p className="typo-micro truncate text-[var(--brand-gray-500)]">{emailLabel}</p>
                </div>
              </div>
            </div>

            <div className="p-2">
              <button
                type="button"
                onClick={() => {
                  closeAccountMenu()
                  onOpenSettings()
                }}
                className="flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left text-[14px] font-medium text-[var(--brand-gray-700)] transition-colors hover:bg-[var(--brand-light-200)]"
              >
                <div className="grid h-8 w-8 place-items-center rounded-full bg-[var(--brand-light-200)] text-[var(--brand-ink-900)]">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <span>Configuración</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  closeAccountMenu()
                  onOpenUpgradePlan()
                }}
                className="mt-1 flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left text-[14px] font-medium text-[var(--brand-gray-700)] transition-colors hover:bg-[var(--brand-light-200)]"
              >
                <div className="grid h-8 w-8 place-items-center rounded-full bg-[var(--brand-mist-200)] text-[var(--brand-blue-700)]">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                </div>
                <span>Mejorar plan</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  closeAccountMenu()
                  onOpenContact()
                }}
                className="mt-1 flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left text-[14px] font-medium text-[var(--brand-gray-700)] transition-colors hover:bg-[var(--brand-light-200)]"
              >
                <div className="grid h-8 w-8 place-items-center rounded-full bg-[var(--brand-light-200)] text-[var(--brand-gray-700)]">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <span>Contáctanos</span>
              </button>

              <div className="my-2 h-px bg-[var(--brand-gray-100)]" />

              <button
                type="button"
                onClick={() => {
                  closeAccountMenu()
                  onSignOut()
                }}
                className="flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left text-[14px] font-medium text-[var(--color-danger-text)] transition-colors hover:bg-[var(--color-danger-bg)]"
              >
                <div className="grid h-8 w-8 place-items-center rounded-full bg-[rgba(180,43,31,0.08)] text-[var(--color-danger-text)]">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </div>
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setAccountMenuOpen((prev) => !prev)}
          className="group flex w-full items-center gap-3 rounded-[18px] border border-[var(--brand-gray-200)] bg-[var(--brand-light-50)] px-3 py-2.5 text-left transition-all hover:border-[var(--brand-gray-300)] hover:bg-white"
          aria-expanded={accountMenuOpen}
          aria-haspopup="menu"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand-ink-900)] text-sm font-bold text-white shadow-sm">
            {displayName.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <p className="typo-body truncate font-semibold text-[var(--brand-ink-900)]">{displayName}</p>
            <p className="typo-micro truncate text-[var(--brand-gray-500)]">{planLabel}</p>
          </div>

          <div className="flex shrink-0 items-center gap-2 text-[var(--brand-gray-400)] transition-transform group-hover:text-[var(--brand-gray-600)]">
            <svg viewBox="0 0 24 24" className={`h-4 w-4 transition-transform ${accountMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </button>
      </div>
    </aside>
  )
}
