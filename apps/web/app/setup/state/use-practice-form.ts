'use client'

import { useEffect, useRef, useState } from 'react'
import { closerApi } from '@/lib/api/closer-api'
import { ApiError } from '@/lib/api/http'
import { clampPracticeText, MAX_PRACTICE_FIELD_CHARS } from '@/lib/validation/practice-input'
import { SAMPLE_SCENARIOS } from '../config/setup-config'

const MIN_FIELD_CHARS = 20

/** Formulario de práctica (contexto + prospecto) y botón "Autocompletar". */
export function usePracticeForm() {
  const [context, setContext] = useState('')
  const [prospect, setProspect] = useState('')
  const [autofillStatus, setAutofillStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [autofillMessage, setAutofillMessage] = useState('')
  const [isStartingPractice, setIsStartingPractice] = useState(false)
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get('tab')
    if (tab === 'resultado' || tab === 'rendimiento') window.history.replaceState({}, '', window.location.pathname)
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current)
    }
  }, [])

  const isFormValid =
    context.trim().length >= MIN_FIELD_CHARS &&
    prospect.trim().length >= MIN_FIELD_CHARS &&
    context.length <= MAX_PRACTICE_FIELD_CHARS &&
    prospect.length <= MAX_PRACTICE_FIELD_CHARS

  const updateContext = (value: string) => setContext(clampPracticeText(value))
  const updateProspect = (value: string) => setProspect(clampPracticeText(value))

  const finishAutofill = (status: 'success' | 'error', message = '') => {
    setAutofillStatus(status)
    setAutofillMessage(message)
    if (resetTimer.current) clearTimeout(resetTimer.current)
    resetTimer.current = setTimeout(() => {
      setAutofillStatus('idle')
      setAutofillMessage('')
    }, status === 'error' ? 3000 : 2000)
  }

  /** Pide un escenario a la IA del backend; si no hay conexión, usa uno de ejemplo local. */
  const applyAutofill = async () => {
    if (autofillStatus === 'loading') return
    setAutofillStatus('loading')
    setAutofillMessage('')
    try {
      const scenario = await closerApi.generateScenario()
      updateContext(scenario.context)
      updateProspect(scenario.prospect)
      finishAutofill('success')
    } catch (error) {
      if (error instanceof ApiError && error.isRateLimited) {
        finishAutofill('error', error.message)
        return
      }
      const sample = SAMPLE_SCENARIOS[Math.floor(Math.random() * SAMPLE_SCENARIOS.length)]
      updateContext(sample.context)
      updateProspect(sample.prospect)
      finishAutofill('success')
    }
  }

  const getProfileName = (prospectText: string, totalProfiles: number): string => {
    const firstChunk = prospectText.split(',')[0]?.trim()
    return firstChunk && firstChunk.length > 1 ? firstChunk.slice(0, 40) : `Perfil ${totalProfiles + 1}`
  }

  return {
    context,
    setContext: updateContext,
    prospect,
    setProspect: updateProspect,
    autofillStatus,
    autofillMessage,
    isStartingPractice,
    isFormValid,
    applyAutofill,
    getProfileName,
    startPractice: () => setIsStartingPractice(true),
    cancelPractice: () => setIsStartingPractice(false),
  }
}
