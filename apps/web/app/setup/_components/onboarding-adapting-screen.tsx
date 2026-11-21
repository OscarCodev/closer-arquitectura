'use client'

import { useEffect, useState } from 'react'
import { AppIcon } from '@/components/brand/app-icon'

type OnboardingAdaptingScreenProps = {
  name?: string
}

export function OnboardingAdaptingScreen({ name }: OnboardingAdaptingScreenProps) {
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    // Flujo simulado de 3 pasos a lo largo del tiempo de redirección (~4s)
    const t1 = setTimeout(() => setActiveStep(1), 1400)
    const t2 = setTimeout(() => setActiveStep(2), 2600)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  return (
    <section className="setup-adapt-shell relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden px-4 md:px-6">
      {/* Fondos radiales e inmersivos */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,1)_0%,rgba(244,249,255,0.7)_100%)]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-[100%] bg-[var(--brand-mist-100)] opacity-40 blur-[100px]" />

      <div className="relative z-10 flex w-full max-w-[560px] flex-col items-center text-center">
        
        {/* Glow spinner around the logo */}
        <div className="relative mb-12 flex h-36 w-36 items-center justify-center">
          <div className="absolute inset-0 animate-[spin_3s_linear_infinite] rounded-full border-[1.5px] border-[var(--brand-light-200)] border-t-[var(--brand-blue-500)] border-r-[var(--brand-blue-300)]" />
          <div className="absolute h-24 w-24 animate-[pulse_2.5s_ease-in-out_infinite] rounded-full bg-[var(--brand-blue-100)] opacity-70 blur-2xl" />
          <div className="relative flex items-center justify-center drop-shadow-[0_8px_24px_rgba(0,87,255,0.18)]">
            <AppIcon size={64} withBackground={false} className="setup-adapt-icon" />
          </div>
        </div>

        {/* Textos fluidos sin card y sin bordes */}
        <p className="typo-micro font-semibold tracking-[0.25em] uppercase text-[var(--brand-blue-600)] animate-pulse">
          Adaptando Closer
        </p>
        <h2 className="typo-page-title mt-4 font-semibold tracking-tight text-[var(--brand-ink-900)] text-[2rem] leading-tight">
          Estamos preparando tu experiencia
        </h2>
        <p className="typo-body mx-auto mt-4 max-w-[420px] text-[var(--brand-gray-600)] leading-relaxed text-[1.125rem]">
          {name
            ? `${name}, estamos calibrando nuestros modelos para tu perfil, tu industria y tu forma de vender.`
            : 'Estamos calibrando nuestros modelos para tu perfil, tu industria y tu forma de vender.'}
        </p>

        {/* Lista tipográfica inmersiva interactiva en cascada */}
        <div className="mt-16 flex w-full max-w-[320px] flex-col gap-6 text-left">
          {/* Step 1 */}
          <div className={`flex items-center gap-4 transition-all duration-700 ease-out ${activeStep >= 0 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
            <div className="flex h-6 w-6 items-center justify-center shrink-0">
               {activeStep === 0 ? (
                 <span className="h-2.5 w-2.5 animate-ping rounded-full bg-[var(--brand-blue-500)]" />
               ) : (
                 <svg viewBox="0 0 24 24" className="h-5 w-5 text-[var(--brand-blue-500)]" fill="none" stroke="currentColor" strokeWidth="3.5">
                  <polyline points="20 6 9 17 4 12" />
                 </svg>
               )}
            </div>
            <span className={`typo-body font-semibold transition-colors duration-500 text-[1.125rem] ${activeStep === 0 ? 'text-[var(--brand-ink-900)]' : activeStep > 0 ? 'text-[var(--brand-gray-400)]' : 'text-transparent'}`}>
              Procesando tu perfil
            </span>
          </div>

          {/* Step 2 */}
          <div className={`flex items-center gap-4 transition-all duration-700 ease-out ${activeStep >= 1 ? 'opacity-100 translate-x-0' : 'opacity-20 translate-x-4'}`}>
            <div className="flex h-6 w-6 items-center justify-center shrink-0">
               {activeStep === 1 ? (
                 <span className="h-2.5 w-2.5 animate-ping rounded-full bg-[var(--brand-blue-500)]" />
               ) : activeStep > 1 ? (
                 <svg viewBox="0 0 24 24" className="h-5 w-5 text-[var(--brand-blue-500)]" fill="none" stroke="currentColor" strokeWidth="3.5">
                  <polyline points="20 6 9 17 4 12" />
                 </svg>
               ) : (
                 <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-gray-300)]" />
               )}
            </div>
            <span className={`typo-body font-semibold transition-colors duration-500 text-[1.125rem] ${activeStep === 1 ? 'text-[var(--brand-ink-900)]' : activeStep > 1 ? 'text-[var(--brand-gray-400)]' : 'text-[var(--brand-gray-400)] font-medium'}`}>
              Configurando IA para tu nicho
            </span>
          </div>

          {/* Step 3 */}
          <div className={`flex items-center gap-4 transition-all duration-700 ease-out ${activeStep >= 2 ? 'opacity-100 translate-x-0' : 'opacity-20 translate-x-4'}`}>
            <div className="flex h-6 w-6 items-center justify-center shrink-0">
               {activeStep === 2 ? (
                 <span className="h-2.5 w-2.5 animate-ping rounded-full bg-[var(--brand-blue-500)]" />
               ) : activeStep > 2 ? (
                 <svg viewBox="0 0 24 24" className="h-5 w-5 text-[var(--brand-blue-500)]" fill="none" stroke="currentColor" strokeWidth="3.5">
                  <polyline points="20 6 9 17 4 12" />
                 </svg>
               ) : (
                 <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-gray-300)]" />
               )}
             </div>
            <span className={`typo-body font-semibold transition-colors duration-500 text-[1.125rem] ${activeStep === 2 ? 'text-[var(--brand-ink-900)]' : 'text-[var(--brand-gray-400)] font-medium'}`}>
              Preparando simulador base
            </span>
          </div>
        </div>

      </div>
    </section>
  )
}
