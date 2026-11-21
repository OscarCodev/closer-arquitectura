'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppIcon } from '@/components/brand/app-icon'
import { createClient, type User } from '@/lib/auth/auth-client'
import { closerApi } from '@/lib/api/closer-api'
import { errorMessage } from '@/lib/api/http'
import { useAuthStore } from '@/stores/use-auth-store'
import { OnboardingAdaptingScreen } from '@/app/setup/_components/onboarding-adapting-screen'
import { routes } from '@/lib/routes'
import type { OnboardingProfile } from '../types/setup-types'

type AuthProviderType = 'google' | 'email' | 'other'
type OnboardingStep = 1 | 2 | 3 | 4 | 5

const onboardingInitialState: OnboardingProfile = {
  firstName: '',
  role: '',
  roleOtherDetail: '',
  industry: '',
  industryOtherDetail: '',
  sellsTo: '',
  sellsToOtherDetail: '',
  experienceLevel: '',
  mainChallenge: '',
  mainChallengeOtherDetail: '',
  weeklyCalls: '',
  goalWithCloser: '',
  companyName: '',
  phone: '',
}

const roleOptions = [
  'Prospecto o captador',
  'Vendedor o closer',
  'Líder o gerente de ventas',
  'Dueño o emprendedor',
  'Profesional independiente',
  'Otro',
]

const roleSubtexts: Record<string, string> = {
  'Prospecto o captador': 'Generas leads y agendas reuniones',
  'Vendedor o closer': 'Conduces y cierras las ventas',
  'Profesional independiente': 'Vendes tus propios servicios',
}
const industryOptions = [
  'Tecnología / Software',
  'Salud y bienestar',
  'Educación y formación',
  'Finanzas y seguros',
  'Inmobiliaria',
  'Comercio y retail',
  'Industria y manufactura',
  'Servicios a empresas (B2B)',
  'Alimentación / Consumo masivo',
  'Otro',
]
const sellsToOptions = [
  'Personas y consumidores finales',
  'Dueños y emprendedores',
  'Pymes con equipo directivo',
  'Corporativos y grandes empresas',
  'Gobierno e instituciones públicas',
  'Otro',
]

const sellsToSubtexts: Record<string, string> = {
  'Pymes con equipo directivo': 'Hay más de una persona involucrada en la decisión',
  'Corporativos y grandes empresas': 'Procesos formales, comités y ciclos de compra largos',
  'Gobierno e instituciones públicas': 'Licitaciones, burocracia y tiempos extendidos',
}
const experienceOptions = ['Estoy empezando', '1-3 años', '4-7 años', '8+ años']

const mainChallengeOptions = [
  'Conseguir más prospectos o contactos',
  'Lograr que me escuchen en el primer contacto',
  'Transmitir bien el valor de lo que vendo',
  'Manejar objeciones de precio',
  'Cerrar y conseguir el compromiso',
  'Hacer seguimiento sin parecer pesado',
  'Superar el miedo al rechazo',
  'Otro',
]

export default function OnboardingPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  const [authUser, setAuthUser] = useState<User | null>(null)
  const [authProvider, setAuthProvider] = useState<AuthProviderType>('other')
  const [authLoading, setAuthLoading] = useState(true)

  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>(1)
  const [onboardingLoading, setOnboardingLoading] = useState(false)
  const [onboardingAdaptationVisible, setOnboardingAdaptationVisible] = useState(false)
  const [onboardingError, setOnboardingError] = useState('')
  const [onboardingProfile, setOnboardingProfile] = useState<OnboardingProfile>(onboardingInitialState)

  const totalOnboardingSteps = 5

  const authFirstName = useMemo(() => {
    if (!authUser) {
      return ''
    }

    const userData = (authUser.user_metadata ?? {}) as Record<string, unknown>
    const value =
      typeof userData.firstName === 'string'
        ? userData.firstName
        : typeof userData.full_name === 'string'
          ? userData.full_name
          : ''
    return value.split(' ')[0] || ''
  }, [authUser])

  const shouldAskName = authProvider !== 'google' && !authFirstName.trim()

  const isCurrentStepComplete = () => {
    if (onboardingStep === 1) {
      return Boolean(
        onboardingProfile.experienceLevel &&
        (!shouldAskName || onboardingProfile.firstName.trim().length > 1),
      )
    }

    if (onboardingStep === 2) {
      const roleDetailOk = onboardingProfile.role !== 'Otro' || onboardingProfile.roleOtherDetail.trim().length > 1
      return Boolean(onboardingProfile.role && roleDetailOk)
    }

    if (onboardingStep === 3) {
      const industryDetailOk =
        onboardingProfile.industry !== 'Otro' || onboardingProfile.industryOtherDetail.trim().length > 1
      return Boolean(onboardingProfile.industry && industryDetailOk)
    }

    if (onboardingStep === 4) {
      const sellsToDetailOk =
        onboardingProfile.sellsTo !== 'Otro' || onboardingProfile.sellsToOtherDetail.trim().length > 1
      return Boolean(onboardingProfile.sellsTo && sellsToDetailOk)
    }

    const mainChallengeDetailOk =
      onboardingProfile.mainChallenge !== 'Otro' || onboardingProfile.mainChallengeOtherDetail.trim().length > 1
    return Boolean(onboardingProfile.mainChallenge && mainChallengeDetailOk)
  }

  const detectProvider = (user: User): AuthProviderType => {
    const provider = typeof user.app_metadata?.provider === 'string' ? user.app_metadata.provider : ''

    if (provider === 'google') {
      return 'google'
    }

    if (provider === 'email') {
      return 'email'
    }

    return 'other'
  }

  const getSafeString = (value: unknown) => (typeof value === 'string' ? value : '')

  const getOptionsForCurrentStep = () => {
    if (onboardingStep === 1) {
      return experienceOptions
    }

    if (onboardingStep === 2) {
      return roleOptions
    }

    if (onboardingStep === 3) {
      return industryOptions
    }

    if (onboardingStep === 4) {
      return sellsToOptions
    }

    return mainChallengeOptions
  }

  const getSelectedValueForCurrentStep = () => {
    if (onboardingStep === 1) {
      return onboardingProfile.experienceLevel
    }

    if (onboardingStep === 2) {
      return onboardingProfile.role
    }

    if (onboardingStep === 3) {
      return onboardingProfile.industry
    }

    if (onboardingStep === 4) {
      return onboardingProfile.sellsTo
    }

    return onboardingProfile.mainChallenge
  }

  const selectOptionForCurrentStep = (value: string) => {
    if (onboardingStep === 1) {
      updateOnboardingField('experienceLevel', value)
      return
    }

    if (onboardingStep === 2) {
      updateOnboardingField('role', value)
      return
    }

    if (onboardingStep === 3) {
      updateOnboardingField('industry', value)
      return
    }

    if (onboardingStep === 4) {
      updateOnboardingField('sellsTo', value)
      return
    }

    updateOnboardingField('mainChallenge', value)
  }

  const moveCurrentSelection = (direction: -1 | 1) => {
    const options = getOptionsForCurrentStep()

    if (!options.length) {
      return
    }

    const selectedValue = getSelectedValueForCurrentStep()
    const selectedIndex = options.indexOf(selectedValue)

    if (selectedIndex === -1) {
      const targetIndex = direction > 0 ? 0 : options.length - 1
      selectOptionForCurrentStep(options[targetIndex])
      return
    }

    const nextIndex = (selectedIndex + direction + options.length) % options.length
    selectOptionForCurrentStep(options[nextIndex])
  }

  const isEditableElement = (element: EventTarget | null) => {
    if (!(element instanceof HTMLElement)) {
      return false
    }

    if (element.isContentEditable) {
      return true
    }

    const tagName = element.tagName
    return tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT'
  }

  // Auth sync — redirect to setup if onboarding already completed, or to login if not authenticated
  useEffect(() => {
    const syncAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace(routes.login)
        return
      }

      const provider = detectProvider(user)
      const userData = (user.user_metadata ?? {}) as Record<string, unknown>
      const storedProfile = (await closerApi.getOnboarding().catch(() => null)) as Partial<OnboardingProfile> | null
      const firstNameFromProfile = getSafeString(storedProfile?.firstName)
      const firstNameFromAuth = getSafeString(userData.full_name).split(' ')[0] || ''

      if (storedProfile) {
        router.replace(routes.setup)
        return
      }

      setAuthUser(user)
      setAuthProvider(provider)
      setOnboardingProfile({
        firstName: firstNameFromProfile || firstNameFromAuth,
        role: '',
        roleOtherDetail: '',
        industry: '',
        industryOtherDetail: '',
        sellsTo: '',
        sellsToOtherDetail: '',
        experienceLevel: '',
        mainChallenge: '',
        mainChallengeOtherDetail: '',
        weeklyCalls: '',
        goalWithCloser: '',
        companyName: '',
        phone: '',
      })
      setAuthLoading(false)
    }

    syncAuth()
  }, [supabase, router])

  // Keyboard navigation: step flow + option selection shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.isComposing || onboardingLoading || authLoading || onboardingAdaptationVisible) {
        return
      }

      if (e.ctrlKey || e.metaKey || e.altKey) {
        return
      }

      const target = e.target as EventTarget | null
      const editableTarget = isEditableElement(target)
      const targetTag = target instanceof HTMLElement ? target.tagName : ''

      if (e.key === 'Enter') {
        if (targetTag === 'BUTTON' || targetTag === 'TEXTAREA') {
          return
        }

        if (!isCurrentStepComplete()) {
          return
        }

        e.preventDefault()
        if (onboardingStep < totalOnboardingSteps) {
          setOnboardingStep((prev) => Math.min(totalOnboardingSteps, prev + 1) as OnboardingStep)
        } else {
          handleSubmitOnboarding()
        }
        return
      }

      if (editableTarget) {
        return
      }

      if (e.key === 'ArrowRight') {
        if (!isCurrentStepComplete() || onboardingStep >= totalOnboardingSteps) {
          return
        }

        e.preventDefault()
        setOnboardingStep((prev) => Math.min(totalOnboardingSteps, prev + 1) as OnboardingStep)
        return
      }

      if (e.key === 'ArrowLeft') {
        if (onboardingStep <= 1) {
          return
        }

        e.preventDefault()
        setOnboardingStep((prev) => Math.max(1, prev - 1) as OnboardingStep)
        return
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        moveCurrentSelection(e.key === 'ArrowDown' ? 1 : -1)
        return
      }

      if (/^[1-9]$/.test(e.key)) {
        const optionIndex = Number.parseInt(e.key, 10) - 1
        const options = getOptionsForCurrentStep()
        if (optionIndex < options.length) {
          e.preventDefault()
          selectOptionForCurrentStep(options[optionIndex])
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onboardingStep, onboardingProfile, onboardingLoading, authLoading, onboardingAdaptationVisible])

  // After adaptation animation, redirect to setup
  useEffect(() => {
    if (!onboardingAdaptationVisible) {
      return
    }

    const timeout = window.setTimeout(() => {
      router.replace(routes.setup)
    }, 4200)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [onboardingAdaptationVisible, router])

  function updateOnboardingField(field: keyof OnboardingProfile, value: string) {
    setOnboardingError('')
    setOnboardingProfile((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  async function handleSubmitOnboarding() {
    if (!authUser) {
      router.replace(routes.login)
      return
    }

    if (!isCurrentStepComplete()) {
      setOnboardingError('Completa los campos obligatorios para continuar.')
      return
    }

    setOnboardingLoading(true)
    setOnboardingError('')

    const profileToSave: OnboardingProfile = {
      ...onboardingProfile,
      firstName: onboardingProfile.firstName.trim(),
      roleOtherDetail: onboardingProfile.roleOtherDetail.trim(),
      industryOtherDetail: onboardingProfile.industryOtherDetail.trim(),
      sellsToOtherDetail: onboardingProfile.sellsToOtherDetail.trim(),
      mainChallengeOtherDetail: onboardingProfile.mainChallengeOtherDetail.trim(),
      goalWithCloser: onboardingProfile.goalWithCloser.trim(),
      companyName: onboardingProfile.companyName.trim(),
      phone: onboardingProfile.phone.trim(),
    }

    // Una sola escritura, en el servidor (el MVP escribía en dos lugares y se desincronizaban).
    try {
      await closerApi.saveOnboarding(profileToSave)
      await useAuthStore.getState().refreshUser()
    } catch (error) {
      setOnboardingLoading(false)
      setOnboardingError(errorMessage(error, 'No pudimos guardar tu onboarding. Inténtalo de nuevo.'))
      return
    }

    setOnboardingLoading(false)
    setOnboardingProfile(profileToSave)
    setOnboardingAdaptationVisible(true)
  }

  // Loading state
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--brand-light-100)] text-[var(--brand-ink-900)]">
        <section className="grid flex-1 place-items-center px-6 py-12">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <AppIcon size={40} />
            </div>
            <p className="typo-micro font-semibold tracking-[0.14em] uppercase text-[var(--brand-gray-500)]">
              Preparando tu espacio
            </p>
            <h2 className="typo-page-title mt-2 font-semibold text-[var(--brand-ink-900)]">Cargando perfil</h2>
          </div>
        </section>
      </div>
    )
  }

  // Adaptation animation (full-screen)
  if (onboardingAdaptationVisible) {
    return (
      <div className="min-h-screen bg-[var(--brand-light-100)] text-[var(--brand-ink-900)]">
        <OnboardingAdaptingScreen name={authFirstName} />
      </div>
    )
  }

  // Onboarding steps
  return (
    <div className="relative flex min-h-screen flex-col bg-[var(--brand-light-50)] text-[var(--brand-ink-900)] selection:bg-[var(--brand-blue-100)] selection:text-[var(--brand-blue-700)]">
      {/* Encabezado inmersivo */}
      <header className="fixed top-0 left-0 right-0 z-10 bg-[var(--brand-light-50)]/90 backdrop-blur-md">
        <div className="mx-auto flex h-[72px] w-full max-w-[720px] items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <AppIcon size={28} />
            <span className="typo-body font-semibold text-[var(--brand-ink-900)]">Closer</span>
          </div>
          <span className="typo-micro font-semibold tracking-wider text-[var(--brand-gray-500)] uppercase">
            Paso {onboardingStep} de {totalOnboardingSteps}
          </span>
        </div>
        {/* Barra de progreso de borde a borde en la parte superior */}
        <div className="absolute bottom-0 left-0 right-0 h-1 w-full bg-[var(--brand-light-200)]">
          <div
            className="h-full bg-[var(--brand-blue-500)] transition-all duration-500 ease-out"
            style={{ width: `${(onboardingStep / totalOnboardingSteps) * 100}%` }}
          />
        </div>
      </header>

      {/* Main Content Centrado y Angosto */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-28 sm:px-6">
        <div className="setup-reveal w-full max-w-[560px]">
          <h2 className="typo-page-title mb-8 text-center sm:text-left font-semibold tracking-tight text-[var(--brand-ink-900)] text-[1.75rem] leading-tight">
            {onboardingStep === 1 && 'Comencemos por conocerte'}
            {onboardingStep === 2 && 'Tu rol profesional'}
            {onboardingStep === 3 && 'Sobre tu industria y sector'}
            {onboardingStep === 4 && 'Tu cliente típico'}
            {onboardingStep === 5 && 'Tu mayor reto hoy'}
          </h2>

          <div className="space-y-8">
            {onboardingStep === 1 && (
              <div className="space-y-8">
                {shouldAskName && (
                  <div>
                    <label htmlFor="onboarding-name" className="typo-body font-semibold text-[var(--brand-gray-700)]">
                      ¿Cómo te llamas?
                    </label>
                    <input
                      id="onboarding-name"
                      type="text"
                      value={onboardingProfile.firstName}
                      onChange={(event) => updateOnboardingField('firstName', event.target.value)}
                      placeholder="Escribe tu nombre"
                      className="typo-input mt-2 w-full rounded-xl border border-[var(--brand-gray-200)] bg-white px-4 py-3.5 placeholder-[var(--brand-gray-400)] shadow-sm outline-none transition-all hover:border-[var(--brand-gray-300)] focus:border-[var(--brand-blue-400)] focus:ring-[3px] focus:ring-[var(--brand-blue-100)]"
                    />
                  </div>
                )}

                <div>
                  <h3 className="typo-body font-semibold text-[var(--brand-gray-700)]">¿Cuántos años llevas en ventas?</h3>
                  <p className="typo-caption mt-1 text-[var(--brand-gray-500)]">Con esto Closer sabe cómo adaptar el cliente y el feedback para ti.</p>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {experienceOptions.map((option) => {
                      const active = onboardingProfile.experienceLevel === option
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => updateOnboardingField('experienceLevel', option)}
                          className={`typo-body flex w-full items-center justify-between rounded-xl border p-4 text-left font-medium transition-all duration-200 ${active
                              ? 'border-[var(--brand-blue-300)] bg-[var(--brand-mist-50)] text-[var(--brand-blue-700)] ring-1 ring-[var(--brand-blue-300)] shadow-[0_2px_8px_rgba(0,87,255,0.06)]'
                              : 'border-[var(--brand-gray-200)] bg-white text-[var(--brand-gray-700)] hover:border-[var(--brand-gray-300)] hover:bg-[var(--brand-light-100)]'
                            }`}
                        >
                          {option}
                          {active && (
                            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-[var(--brand-blue-500)]" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {onboardingStep === 2 && (
              <div>
                <h3 className="typo-body font-semibold text-[var(--brand-gray-700)]">Tu rol actual</h3>
                <p className="typo-caption mt-1 text-[var(--brand-gray-500)]">Escoge lo que mejor describe tus actividades de día a día.</p>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {roleOptions.map((option) => {
                    const active = onboardingProfile.role === option
                    const subtext = roleSubtexts[option]
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => updateOnboardingField('role', option)}
                        className={`typo-body flex w-full items-start justify-between rounded-xl border p-4 text-left font-medium transition-all duration-200 ${active
                            ? 'border-[var(--brand-blue-300)] bg-[var(--brand-mist-50)] text-[var(--brand-blue-700)] ring-1 ring-[var(--brand-blue-300)] shadow-[0_2px_8px_rgba(0,87,255,0.06)]'
                            : 'border-[var(--brand-gray-200)] bg-white text-[var(--brand-gray-700)] hover:border-[var(--brand-gray-300)] hover:bg-[var(--brand-light-100)]'
                          }`}
                      >
                        <span className="flex flex-col gap-0.5">
                          <span>{option}</span>
                          {subtext && (
                            <span className={`typo-micro font-normal ${active ? 'text-[var(--brand-blue-500)]' : 'text-[var(--brand-gray-400)]'}`}>
                              {subtext}
                            </span>
                          )}
                        </span>
                        {active && (
                          <svg viewBox="0 0 24 24" className="ml-2 mt-0.5 h-5 w-5 shrink-0 text-[var(--brand-blue-500)]" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    )
                  })}
                </div>

                {onboardingProfile.role === 'Otro' && (
                  <div className="mt-4">
                    <div className="flex items-baseline justify-between">
                      <label htmlFor="onboarding-role-other" className="typo-label font-semibold text-[var(--brand-gray-600)]">
                        Especifica tu rol
                      </label>
                      {onboardingProfile.roleOtherDetail.length > 40 && (
                        <span className={`typo-micro ${onboardingProfile.roleOtherDetail.length >= 60 ? 'text-[var(--color-danger-text)]' : 'text-[var(--brand-gray-400)]'}`}>
                          {60 - onboardingProfile.roleOtherDetail.length}
                        </span>
                      )}
                    </div>
                    <input
                      id="onboarding-role-other"
                      type="text"
                      maxLength={60}
                      value={onboardingProfile.roleOtherDetail}
                      onChange={(event) => updateOnboardingField('roleOtherDetail', event.target.value)}
                      placeholder="Ej: Preventa técnica o Sales Engineer"
                      className="typo-input mt-2 w-full rounded-xl border border-[var(--brand-gray-200)] bg-white px-4 py-3 placeholder-[var(--brand-gray-400)] shadow-sm outline-none transition-all hover:border-[var(--brand-gray-300)] focus:border-[var(--brand-blue-400)] focus:ring-[3px] focus:ring-[var(--brand-blue-100)]"
                    />
                  </div>
                )}
              </div>
            )}

            {onboardingStep === 3 && (
              <div>
                <h3 className="typo-body font-semibold text-[var(--brand-gray-700)]">¿En qué sector o industria vendes?</h3>
                <p className="typo-caption mt-1 text-[var(--brand-gray-500)]">Identificaremos dinámicas propias de este rubro.</p>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {industryOptions.map((option) => {
                    const active = onboardingProfile.industry === option
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => updateOnboardingField('industry', option)}
                        className={`typo-body flex w-full items-center justify-between rounded-xl border p-4 text-left font-medium transition-all duration-200 ${active
                            ? 'border-[var(--brand-blue-300)] bg-[var(--brand-mist-50)] text-[var(--brand-blue-700)] ring-1 ring-[var(--brand-blue-300)] shadow-[0_2px_8px_rgba(0,87,255,0.06)]'
                            : 'border-[var(--brand-gray-200)] bg-white text-[var(--brand-gray-700)] hover:border-[var(--brand-gray-300)] hover:bg-[var(--brand-light-100)]'
                          }`}
                      >
                        {option}
                        {active && (
                          <svg viewBox="0 0 24 24" className="h-5 w-5 text-[var(--brand-blue-500)]" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    )
                  })}
                </div>

                {onboardingProfile.industry === 'Otro' && (
                  <div className="mt-4">
                    <div className="flex items-baseline justify-between">
                      <label htmlFor="onboarding-industry-other" className="typo-label font-semibold text-[var(--brand-gray-600)]">
                        Especifica tu industria
                      </label>
                      {onboardingProfile.industryOtherDetail.length > 40 && (
                        <span className={`typo-micro ${onboardingProfile.industryOtherDetail.length >= 60 ? 'text-[var(--color-danger-text)]' : 'text-[var(--brand-gray-400)]'}`}>
                          {60 - onboardingProfile.industryOtherDetail.length}
                        </span>
                      )}
                    </div>
                    <input
                      id="onboarding-industry-other"
                      type="text"
                      maxLength={60}
                      value={onboardingProfile.industryOtherDetail}
                      onChange={(event) => updateOnboardingField('industryOtherDetail', event.target.value)}
                      placeholder="Ej: Biotecnología o Agropecuario"
                      className="typo-input mt-2 w-full rounded-xl border border-[var(--brand-gray-200)] bg-white px-4 py-3 placeholder-[var(--brand-gray-400)] shadow-sm outline-none transition-all hover:border-[var(--brand-gray-300)] focus:border-[var(--brand-blue-400)] focus:ring-[3px] focus:ring-[var(--brand-blue-100)]"
                    />
                  </div>
                )}
              </div>
            )}

            {onboardingStep === 4 && (
              <div>
                <h3 className="typo-body font-semibold text-[var(--brand-gray-700)]">¿Quién es tu cliente típico?</h3>
                <p className="typo-caption mt-1 text-[var(--brand-gray-500)]">Esto es crítico para personalizar nuestras IAs de objeciones.</p>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {sellsToOptions.map((option) => {
                    const active = onboardingProfile.sellsTo === option
                    const subtext = sellsToSubtexts[option]
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => updateOnboardingField('sellsTo', option)}
                        className={`typo-body flex w-full items-start justify-between rounded-xl border p-4 text-left font-medium transition-all duration-200 ${active
                            ? 'border-[var(--brand-blue-300)] bg-[var(--brand-mist-50)] text-[var(--brand-blue-700)] ring-1 ring-[var(--brand-blue-300)] shadow-[0_2px_8px_rgba(0,87,255,0.06)]'
                            : 'border-[var(--brand-gray-200)] bg-white text-[var(--brand-gray-700)] hover:border-[var(--brand-gray-300)] hover:bg-[var(--brand-light-100)]'
                          }`}
                      >
                        <span className="flex flex-col gap-0.5">
                          <span>{option}</span>
                          {subtext && (
                            <span className={`typo-micro font-normal ${active ? 'text-[var(--brand-blue-500)]' : 'text-[var(--brand-gray-400)]'}`}>
                              {subtext}
                            </span>
                          )}
                        </span>
                        {active && (
                          <svg viewBox="0 0 24 24" className="ml-2 mt-0.5 h-5 w-5 shrink-0 text-[var(--brand-blue-500)]" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    )
                  })}
                </div>

                {onboardingProfile.sellsTo === 'Otro' && (
                  <div className="mt-4">
                    <div className="flex items-baseline justify-between">
                      <label htmlFor="onboarding-sells-to-other" className="typo-label font-semibold text-[var(--brand-gray-600)]">
                        Especifica tu segmento
                      </label>
                      {onboardingProfile.sellsToOtherDetail.length > 40 && (
                        <span className={`typo-micro ${onboardingProfile.sellsToOtherDetail.length >= 60 ? 'text-[var(--color-danger-text)]' : 'text-[var(--brand-gray-400)]'}`}>
                          {60 - onboardingProfile.sellsToOtherDetail.length}
                        </span>
                      )}
                    </div>
                    <input
                      id="onboarding-sells-to-other"
                      type="text"
                      maxLength={60}
                      value={onboardingProfile.sellsToOtherDetail}
                      onChange={(event) => updateOnboardingField('sellsToOtherDetail', event.target.value)}
                      placeholder="Ej: Universidades o Clínicas"
                      className="typo-input mt-2 w-full rounded-xl border border-[var(--brand-gray-200)] bg-white px-4 py-3 placeholder-[var(--brand-gray-400)] shadow-sm outline-none transition-all hover:border-[var(--brand-gray-300)] focus:border-[var(--brand-blue-400)] focus:ring-[3px] focus:ring-[var(--brand-blue-100)]"
                    />
                  </div>
                )}
              </div>
            )}

            {onboardingStep === 5 && (
              <div>
                <h3 className="typo-body font-semibold text-[var(--brand-gray-700)]">¿Cuál es tu mayor reto hoy vendiendo?</h3>
                <p className="typo-caption mt-1 text-[var(--brand-gray-500)]">Priorizaremos este punto en tus simulaciones.</p>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {mainChallengeOptions.map((option) => {
                    const active = onboardingProfile.mainChallenge === option
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => updateOnboardingField('mainChallenge', option)}
                        className={`typo-body flex w-full items-center justify-between rounded-xl border p-4 text-left font-medium transition-all duration-200 ${active
                            ? 'border-[var(--brand-blue-300)] bg-[var(--brand-mist-50)] text-[var(--brand-blue-700)] ring-1 ring-[var(--brand-blue-300)] shadow-[0_2px_8px_rgba(0,87,255,0.06)]'
                            : 'border-[var(--brand-gray-200)] bg-white text-[var(--brand-gray-700)] hover:border-[var(--brand-gray-300)] hover:bg-[var(--brand-light-100)]'
                          }`}
                      >
                        {option}
                        {active && (
                          <svg viewBox="0 0 24 24" className="h-5 w-5 text-[var(--brand-blue-500)]" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    )
                  })}
                </div>

                {onboardingProfile.mainChallenge === 'Otro' && (
                  <div className="mt-4">
                    <div className="flex items-baseline justify-between">
                      <label htmlFor="onboarding-challenge-other" className="typo-label font-semibold text-[var(--brand-gray-600)]">
                        Cuéntanos tu reto
                      </label>
                      {onboardingProfile.mainChallengeOtherDetail.length > 40 && (
                        <span className={`typo-micro ${onboardingProfile.mainChallengeOtherDetail.length >= 60 ? 'text-[var(--color-danger-text)]' : 'text-[var(--brand-gray-400)]'}`}>
                          {60 - onboardingProfile.mainChallengeOtherDetail.length}
                        </span>
                      )}
                    </div>
                    <input
                      id="onboarding-challenge-other"
                      type="text"
                      maxLength={60}
                      value={onboardingProfile.mainChallengeOtherDetail}
                      onChange={(event) => updateOnboardingField('mainChallengeOtherDetail', event.target.value)}
                      placeholder="Ej: No sé cómo diferenciarme de la competencia"
                      className="typo-input mt-2 w-full rounded-xl border border-[var(--brand-gray-200)] bg-white px-4 py-3 placeholder-[var(--brand-gray-400)] shadow-sm outline-none transition-all hover:border-[var(--brand-gray-300)] focus:border-[var(--brand-blue-400)] focus:ring-[3px] focus:ring-[var(--brand-blue-100)]"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {onboardingError && (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] p-4 text-[var(--color-danger-text)]">
                <svg viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="typo-label">{onboardingError}</p>
              </div>
            )}
          </div>

          {/* Botones de navegación, desvinculados de un "footer de tarjeta" */}
          <div className="mt-14 flex items-center justify-between border-t border-[var(--brand-gray-200)] pt-8 pb-10">
            <div className="w-[120px]">
              {onboardingStep > 1 && (
                <button
                  type="button"
                  disabled={onboardingLoading}
                  onClick={() => setOnboardingStep((prev) => Math.max(1, prev - 1) as OnboardingStep)}
                  className="typo-body flex items-center gap-2 font-medium text-[var(--brand-gray-500)] transition-colors hover:text-[var(--brand-ink-900)] disabled:opacity-50"
                >
                  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                  Atrás
                </button>
              )}
            </div>

            {onboardingStep < totalOnboardingSteps ? (
              <button
                type="button"
                disabled={!isCurrentStepComplete()}
                onClick={() => setOnboardingStep((prev) => Math.min(totalOnboardingSteps, prev + 1) as OnboardingStep)}
                className="typo-body flex items-center gap-2 rounded-xl bg-[var(--brand-ink-900)] px-6 py-3.5 font-semibold text-white transition-all hover:bg-[var(--brand-ink-800)] hover:shadow-[0_4px_12px_rgba(10,10,10,0.08)] disabled:cursor-not-allowed disabled:bg-[var(--brand-gray-200)] disabled:text-[var(--brand-gray-400)] disabled:shadow-none"
              >
                Siguiente
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                disabled={onboardingLoading || !isCurrentStepComplete()}
                onClick={handleSubmitOnboarding}
                className="typo-body flex items-center gap-2 rounded-xl bg-[var(--brand-blue-500)] px-6 py-3.5 font-semibold text-white transition-all hover:bg-[var(--brand-blue-600)] hover:shadow-[0_4px_12px_rgba(0,87,255,0.22)] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
              >
                {onboardingLoading ? 'Guardando...' : 'Empezar ahora'}
                {!onboardingLoading && (
                  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="5 12 10 17 19 8" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
