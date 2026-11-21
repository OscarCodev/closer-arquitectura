'use client'

import { useEffect, useRef, useState } from 'react'
import { ADVANCED_OPTION_COPY } from '../config/setup-config'
import type { AdvancedOptionCopy, AdvancedTab } from '../types/setup-types'

export function useAdvancedOptions() {
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [advancedTab, setAdvancedTab] = useState<AdvancedTab>('modo')
  const [advancedPreview, setAdvancedPreview] = useState<{ tab: AdvancedTab; option: string } | null>(null)
  const [advancedSelections, setAdvancedSelections] = useState<Record<AdvancedTab, string>>({
    modo: 'Ciclo Completo',
    tono: 'Perfil Real',
  })
  const advancedPanelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!advancedPanelRef.current) return
      if (!advancedPanelRef.current.contains(event.target as Node)) setAdvancedOpen(false)
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const activePreviewOption =
    advancedPreview && advancedPreview.tab === advancedTab
      ? advancedPreview.option
      : advancedSelections[advancedTab]

  const activePreviewCopy: AdvancedOptionCopy = ADVANCED_OPTION_COPY[advancedTab][activePreviewOption]

  const onAdvancedSelect = (tab: AdvancedTab, option: string) => {
    setAdvancedSelections((prev) => ({ ...prev, [tab]: option }))
  }

  return {
    advancedOpen,
    advancedTab,
    advancedSelections,
    advancedPanelRef,
    activePreviewOption,
    activePreviewCopy,
    onToggleAdvanced: () => setAdvancedOpen((prev) => !prev),
    onCloseAdvanced: () => setAdvancedOpen(false),
    onSetAdvancedTab: setAdvancedTab,
    onAdvancedSelect,
    onAdvancedPreview: setAdvancedPreview,
  }
}
