import type { TabType } from '../types/setup-types'

/** Pestaña inicial de /setup según `?tab=` (resultado o rendimiento). */
export function getInitialTabFromQuery(): TabType {
  if (typeof window === 'undefined') return 'setup'
  const tab = new URLSearchParams(window.location.search).get('tab')
  return tab === 'resultado' || tab === 'rendimiento' ? tab : 'setup'
}
