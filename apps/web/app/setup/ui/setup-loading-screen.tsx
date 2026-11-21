'use client'

import { useEffect, useState } from 'react'
import { AppIcon } from '@/components/brand/app-icon'

type SetupLoadingScreenProps = {
  onComplete?: () => void
}

export function SetupLoadingScreen({ onComplete }: SetupLoadingScreenProps) {
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    // Simulate loading steps for the AI setup context
    const t1 = setTimeout(() => setActiveStep(1), 1200)
    const t2 = setTimeout(() => setActiveStep(2), 2400)
    const t3 = setTimeout(() => setActiveStep(3), 3600)
    const t4 = setTimeout(() => {
      if (onComplete) onComplete()
    }, 4800)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
    }
  }, [onComplete])

  return (
    <section className="setup-adapt-shell relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 md:px-6 bg-[var(--brand-light-50)] min-h-full">
      {/* Immersive radial background constrained to main area */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8)_0%,rgba(244,249,255,0.4)_100%)]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[350px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-[100%] bg-[var(--brand-mist-200)] opacity-40 blur-[80px]" />

      <div className="relative z-10 flex w-full max-w-[560px] flex-col items-center text-center">
        
        {/* Glow spinner with smooth pulse around the logo */}
        <div className="relative mb-12 flex h-36 w-36 items-center justify-center">
          <div className="absolute inset-0 animate-[spin_3s_linear_infinite] rounded-full border-[1.5px] border-[var(--brand-light-200)] border-t-[var(--brand-ink-900)] border-r-[var(--brand-gray-400)]" />
          <div className="absolute h-24 w-24 animate-[pulse_2s_ease-in-out_infinite] rounded-full bg-[var(--brand-mist-200)] opacity-60 blur-2xl" />
          <div className="relative flex items-center justify-center drop-shadow-[0_8px_24px_rgba(10,10,10,0.12)]">
            <AppIcon size={64} withBackground={false} className="setup-adapt-icon" />
          </div>
        </div>

        {/* Dynamic Typography */}
        <p className="typo-micro font-semibold tracking-[0.25em] uppercase text-[var(--brand-gray-500)] animate-pulse">
          Inicializando sesión
        </p>
        <h2 className="typo-page-title mt-4 font-semibold tracking-tight text-[var(--brand-ink-900)] text-[2rem] leading-tight">
          Cargando entorno de simulación
        </h2>
        <p className="typo-body mx-auto mt-4 max-w-[420px] text-[var(--brand-gray-600)] leading-relaxed text-[1.125rem]">
          Estamos procesando el contexto comercial y configurando la lógica de tu prospecto para la práctica.
        </p>

        {/* Typographical cascading loading list */}
        <div className="mt-16 flex w-full max-w-[340px] flex-col gap-6 text-left">
          {/* Step 1 */}
          <div className={`flex items-center gap-4 transition-all duration-700 ease-out ${activeStep >= 0 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
            <div className="flex h-6 w-6 items-center justify-center shrink-0">
               {activeStep === 0 ? (
                 <span className="h-2.5 w-2.5 animate-ping rounded-full bg-[var(--brand-ink-900)]" />
               ) : (
                 <svg viewBox="0 0 24 24" className="h-5 w-5 text-[var(--brand-ink-900)]" fill="none" stroke="currentColor" strokeWidth="3.5">
                  <polyline points="20 6 9 17 4 12" />
                 </svg>
               )}
            </div>
            <span className={`typo-body font-semibold transition-colors duration-500 text-[1.125rem] ${activeStep === 0 ? 'text-[var(--brand-ink-900)]' : activeStep > 0 ? 'text-[var(--brand-gray-400)]' : 'text-transparent'}`}>
              Analizando contexto y rol
            </span>
          </div>

          {/* Step 2 */}
          <div className={`flex items-center gap-4 transition-all duration-700 ease-out ${activeStep >= 1 ? 'opacity-100 translate-x-0' : 'opacity-20 translate-x-4'}`}>
            <div className="flex h-6 w-6 items-center justify-center shrink-0">
               {activeStep === 1 ? (
                 <span className="h-2.5 w-2.5 animate-ping rounded-full bg-[var(--brand-ink-900)]" />
               ) : activeStep > 1 ? (
                 <svg viewBox="0 0 24 24" className="h-5 w-5 text-[var(--brand-ink-900)]" fill="none" stroke="currentColor" strokeWidth="3.5">
                  <polyline points="20 6 9 17 4 12" />
                 </svg>
               ) : (
                 <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-gray-300)]" />
               )}
            </div>
            <span className={`typo-body font-semibold transition-colors duration-500 text-[1.125rem] ${activeStep === 1 ? 'text-[var(--brand-ink-900)]' : activeStep > 1 ? 'text-[var(--brand-gray-400)]' : 'text-[var(--brand-gray-400)] font-medium'}`}>
              Configurando objeciones de prospecto
            </span>
          </div>

          {/* Step 3 */}
          <div className={`flex items-center gap-4 transition-all duration-700 ease-out ${activeStep >= 2 ? 'opacity-100 translate-x-0' : 'opacity-20 translate-x-4'}`}>
            <div className="flex h-6 w-6 items-center justify-center shrink-0">
               {activeStep === 2 ? (
                 <span className="h-2.5 w-2.5 animate-ping rounded-full bg-[var(--brand-ink-900)]" />
               ) : activeStep > 2 ? (
                 <svg viewBox="0 0 24 24" className="h-5 w-5 text-[var(--brand-ink-900)]" fill="none" stroke="currentColor" strokeWidth="3.5">
                  <polyline points="20 6 9 17 4 12" />
                 </svg>
               ) : (
                 <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-gray-300)]" />
               )}
             </div>
            <span className={`typo-body font-semibold transition-colors duration-500 text-[1.125rem] ${activeStep === 2 ? 'text-[var(--brand-ink-900)]' : 'text-[var(--brand-gray-400)] font-medium'}`}>
              Aplicando modo y tono de la simulación
            </span>
          </div>

          {/* Step 4 */}
          <div className={`flex items-center gap-4 transition-all duration-700 ease-out ${activeStep >= 3 ? 'opacity-100 translate-x-0' : 'opacity-20 translate-x-4'}`}>
            <div className="flex h-6 w-6 items-center justify-center shrink-0">
               {activeStep === 3 ? (
                 <span className="h-2.5 w-2.5 animate-ping rounded-full bg-[var(--brand-blue-500)]" />
               ) : activeStep > 3 ? (
                 <svg viewBox="0 0 24 24" className="h-5 w-5 text-[var(--brand-blue-500)]" fill="none" stroke="currentColor" strokeWidth="3.5">
                  <polyline points="20 6 9 17 4 12" />
                 </svg>
               ) : (
                 <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-gray-300)]" />
               )}
             </div>
            <span className={`typo-body font-semibold transition-colors duration-500 text-[1.125rem] ${activeStep === 3 ? 'text-[var(--brand-blue-600)]' : 'text-[var(--brand-gray-400)] font-medium'}`}>
              Desplegando sesión IA
            </span>
          </div>
        </div>

      </div>
    </section>
  )
}
