'use client'

import { mockFetch } from '@/mocks/api'
import { useEffect, useState } from 'react'
import { SAMPLE_SCENARIOS } from '../config/setup-config'
import type { OnboardingProfile } from '../types/setup-types'
import { clampPracticeText, MAX_PRACTICE_FIELD_CHARS } from '@/lib/validation/practice-input'

const AUTOGEN_RECENT_NAMES_KEY = 'closer.autogen.recent-names.v1'
const AUTOGEN_LAST_GENDER_KEY = 'closer.autogen.last-gender.v1'
const AUTOGEN_RECENT_PRODUCT_NAMES_KEY = 'closer.autogen.recent-product-names.v1'
const AUTOGEN_RECENT_SCENARIO_THEMES_KEY = 'closer.autogen.recent-scenario-themes.v1'

type AutogenGender = 'female' | 'male' | 'unknown'

function loadRecentNames(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(AUTOGEN_RECENT_NAMES_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : []
  } catch {
    return []
  }
}

function saveRecentNames(names: string[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(AUTOGEN_RECENT_NAMES_KEY, JSON.stringify(names.slice(0, 12)))
  } catch {
    // ignore storage issues
  }
}

function loadRecentValues(storageKey: string): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(storageKey)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((value) => typeof value === 'string') : []
  } catch {
    return []
  }
}

function saveRecentValues(storageKey: string, values: string[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(values.slice(0, 12)))
  } catch {
    // ignore storage issues
  }
}

function getNextTargetGender(): Exclude<AutogenGender, 'unknown'> {
  if (typeof window === 'undefined') return 'female'
  try {
    const last = window.localStorage.getItem(AUTOGEN_LAST_GENDER_KEY)
    const next = last === 'female' ? 'male' : 'female'
    window.localStorage.setItem(AUTOGEN_LAST_GENDER_KEY, next)
    return next
  } catch {
    return 'female'
  }
}

function upsertRecentName(name: string) {
  const trimmed = name.trim()
  if (!trimmed) return
  const normalized = trimmed.toLowerCase()
  const current = loadRecentNames()
  const deduped = [trimmed, ...current.filter((n) => n.toLowerCase() !== normalized)]
  saveRecentNames(deduped)
}

function upsertRecentValue(storageKey: string, value: string) {
  const trimmed = value.trim()
  if (!trimmed) return
  const normalized = trimmed.toLowerCase()
  const current = loadRecentValues(storageKey)
  const deduped = [trimmed, ...current.filter((item) => item.toLowerCase() !== normalized)]
  saveRecentValues(storageKey, deduped)
}

function extractNameFromProspectText(prospect: string): string {
  const firstChunk = prospect.split(/[\n,.]/)[0]?.trim() || ''
  if (!firstChunk) return ''
  const cleaned = firstChunk.replace(/^\s*(perfil|prospecto|cliente)\s*[:\-]?\s*/i, '').trim()
  return cleaned
}

type UsePracticeFormOptions = {
  onboardingProfile: OnboardingProfile | null
  onUpgradeRequired?: () => void
}

export function usePracticeForm({ onboardingProfile, onUpgradeRequired }: UsePracticeFormOptions) {
  const [context, setContext] = useState('')
  const [prospect, setProspect] = useState('')
  const [autofillStatus, setAutofillStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [autofillMessage, setAutofillMessage] = useState('')
  const [isStartingPractice, setIsStartingPractice] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search)
      const tab = searchParams.get('tab')

      if (tab === 'resultado' || tab === 'rendimiento') {
        window.history.replaceState({}, '', window.location.pathname)
      }
    }
  }, [])

  const isFormValid =
    context.trim().length >= 20 &&
    prospect.trim().length >= 20 &&
    context.length <= MAX_PRACTICE_FIELD_CHARS &&
    prospect.length <= MAX_PRACTICE_FIELD_CHARS

  const updateContext = (value: string) => setContext(clampPracticeText(value))
  const updateProspect = (value: string) => setProspect(clampPracticeText(value))

  const applyAutofill = async () => {
    if (autofillStatus === 'loading') return
    setAutofillStatus('loading')
    setAutofillMessage('')

    try {
      // If the user has an onboarding profile, generate via Gemini
      if (
        onboardingProfile?.role &&
        onboardingProfile?.industry &&
        onboardingProfile?.sellsTo
      ) {
        const targetGender = getNextTargetGender()
        const avoidNames = loadRecentNames()
        const recentProductNames = loadRecentValues(AUTOGEN_RECENT_PRODUCT_NAMES_KEY)
        const recentScenarioThemes = loadRecentValues(AUTOGEN_RECENT_SCENARIO_THEMES_KEY)
        const variantSeed = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`

        const res = await mockFetch('/api/simulation/autogenerate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profile: onboardingProfile,
            constraints: {
              targetGender,
              avoidNames,
              avoidProductNames: recentProductNames,
              recentScenarioThemes,
              variantSeed,
            },
          }),
        })

        if (res.status === 429) {
          const data = (await res.json().catch(() => ({}))) as {
            retryAfterSeconds?: number
            error?: string
            errorCode?: string
          }

          if (data.errorCode === 'quota_exhausted') {
            onUpgradeRequired?.()
          }

          const retrySeconds = Number.isFinite(data.retryAfterSeconds)
            ? Math.max(1, Math.floor(data.retryAfterSeconds as number))
            : 60
          setAutofillStatus('error')
          setAutofillMessage(
            data.error || `Límite temporal alcanzado. Reintenta en ${retrySeconds}s.`,
          )
          setTimeout(() => {
            setAutofillStatus('idle')
            setAutofillMessage('')
          }, 3000)
          return
        }

        if (res.ok) {
          const data: { context: string; prospect: string; prospectName?: string; productName?: string; scenarioTheme?: string } = await res.json()
          updateContext(typeof data.context === 'string' ? data.context : String(data.context))
          updateProspect(typeof data.prospect === 'string' ? data.prospect : String(data.prospect))

          const generatedName =
            (typeof data.prospectName === 'string' ? data.prospectName : '').trim() ||
            extractNameFromProspectText(typeof data.prospect === 'string' ? data.prospect : '')
          if (generatedName) upsertRecentName(generatedName)

          const generatedProductName = (typeof data.productName === 'string' ? data.productName : '').trim()
          if (generatedProductName) upsertRecentValue(AUTOGEN_RECENT_PRODUCT_NAMES_KEY, generatedProductName)

          const generatedScenarioTheme = (typeof data.scenarioTheme === 'string' ? data.scenarioTheme : '').trim()
          if (generatedScenarioTheme) upsertRecentValue(AUTOGEN_RECENT_SCENARIO_THEMES_KEY, generatedScenarioTheme)

          setAutofillStatus('success')
          setTimeout(() => setAutofillStatus('idle'), 2000)
          return
        }
      }

      // Fallback: use a random sample scenario
      const fallback = SAMPLE_SCENARIOS[Math.floor(Math.random() * SAMPLE_SCENARIOS.length)]
      updateContext(fallback.context)
      updateProspect(fallback.prospect)
      setAutofillStatus('success')
      setAutofillMessage('')
      setTimeout(() => setAutofillStatus('idle'), 2000)
    } catch {
      // On network error, fall back to sample scenario silently
      const fallback = SAMPLE_SCENARIOS[Math.floor(Math.random() * SAMPLE_SCENARIOS.length)]
      updateContext(fallback.context)
      updateProspect(fallback.prospect)
      setAutofillStatus('success')
      setAutofillMessage('')
      setTimeout(() => setAutofillStatus('idle'), 2000)
    }
  }

  const getProfileName = (prospectText: string, totalProfiles: number): string => {
    const firstChunk = prospectText.split(',')[0]?.trim()
    if (firstChunk && firstChunk.length > 1) return firstChunk.slice(0, 40)
    return `Perfil ${totalProfiles + 1}`
  }

  const startPractice = () => setIsStartingPractice(true)

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
    startPractice,
  }
}
