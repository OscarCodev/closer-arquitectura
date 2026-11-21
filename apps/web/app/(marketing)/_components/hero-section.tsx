'use client'

import Link from "next/link"
import { routes } from "@/lib/routes"
import { AppIcon } from "@/components/brand/app-icon"
import { useEffect, useState } from "react"

/* ── Radar Chart — miniature replica of app's RadarChart (progress-dashboard.tsx) ── */
function HeroRadarChart({ data, labels, color, size = 180 }: { data: number[]; labels: string[]; color: string; size?: number }) {
  const center = size / 2
  const maxRadius = (size / 2) * 0.72
  const angleStep = (Math.PI * 2) / labels.length

  const getPoints = (values: number[], radiusScale = 1) =>
    values.map((v, i) => {
      const r = (v / 100) * maxRadius * radiusScale
      const angle = i * angleStep - Math.PI / 2
      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`
    }).join(' ')

  return (
    <div className="flex justify-center">
      <svg width={size} height={size} className="overflow-visible">
        {[0.2, 0.4, 0.6, 0.8, 1].map((scale) => (
          <polygon key={scale} points={getPoints(labels.map(() => 100), scale)} fill="none" stroke="var(--brand-gray-100)" strokeWidth="1" />
        ))}
        {labels.map((_, i) => {
          const angle = i * angleStep - Math.PI / 2
          return <line key={i} x1={center} y1={center} x2={center + maxRadius * Math.cos(angle)} y2={center + maxRadius * Math.sin(angle)} stroke="var(--brand-gray-100)" strokeWidth="1" />
        })}
        <polygon points={getPoints(data)} fill={color + '20'} stroke={color} strokeWidth="2" />
        {labels.map((label, i) => {
          const angle = i * angleStep - Math.PI / 2
          const x = center + (maxRadius + 18) * Math.cos(angle)
          const y = center + (maxRadius + 12) * Math.sin(angle)
          return <text key={i} x={x} y={y} fontSize="8" fontWeight="700" fill="var(--brand-gray-500)" textAnchor="middle" className="uppercase tracking-widest">{label}</text>
        })}
      </svg>
    </div>
  )
}

/* ── Word-by-word reveal headline ── */
function AnimatedWords({ text, className, baseDelay = 0 }: { text: string; className?: string; baseDelay?: number }) {
  const words = text.split(' ')
  return (
    <span className={className} aria-label={text}>
      {words.map((word, i) => (
        <span
          key={i}
          className="inline-block"
          style={{
            opacity: 0,
            transform: 'translateY(28px)',
            animation: `hero-word-in 0.65s cubic-bezier(0.22, 1, 0.36, 1) forwards`,
            animationDelay: `${baseDelay + i * 80}ms`,
          }}
        >
          {word}{i < words.length - 1 ? '\u00a0' : ''}
        </span>
      ))}
    </span>
  )
}

/* ── Cycling text that morphs between phrases ── */
const CYCLING_PHRASES: React.ReactNode[] = [
  <>Cierra con<br />clientes reales.</>,
  <>Supera cualquier<br />objeción.</>,
  <>Gana más confianza<br />vendiendo.</>,
  <>Domina cada<br />conversación.</>,
]

function CyclingText() {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex(prev => (prev + 1) % CYCLING_PHRASES.length)
        setVisible(true)
      }, 400)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <span
      className="block bg-gradient-to-r from-[var(--brand-blue-500)] to-indigo-500 bg-clip-text text-transparent"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.4s cubic-bezier(0.22,1,0.36,1), transform 0.4s cubic-bezier(0.22,1,0.36,1)',
        minHeight: '1.2em',
        display: 'block',
      }}
    >
      {CYCLING_PHRASES[index]}
    </span>
  )
}

/* ── Fade-up reveal wrapper ── */
function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <div
      className={className}
      style={{
        opacity: 0,
        transform: 'translateY(20px)',
        animation: `hero-word-in 0.7s cubic-bezier(0.22,1,0.36,1) forwards`,
        animationDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

export function HeroSection() {
  return (
    <>
      {/* keyframe injection */}
      <style>{`
        @keyframes hero-word-in {
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32">
        {/* Background glowing effects */}
        <div className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[800px] -translate-x-1/2 rounded-[100%] bg-gradient-to-b from-[var(--brand-blue-100)] to-transparent opacity-60 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 top-32 h-64 w-64 rounded-full bg-[var(--brand-mist-300)] opacity-50 blur-[100px]" />
        <div className="pointer-events-none absolute -right-32 top-32 h-64 w-64 rounded-full bg-[var(--brand-blue-200)] opacity-40 blur-[100px]" />

        <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-6 text-center">

          {/* Brand mark */}
          <FadeUp delay={0} className="mb-8">
            <AppIcon size={48} />
          </FadeUp>

          <h1 className="typo-hero-title mx-auto max-w-4xl font-extrabold tracking-tight text-[var(--brand-ink-900)]">
            <AnimatedWords text="Practica la llamada difícil." baseDelay={150} />
            <span
              style={{
                opacity: 0,
                animation: `hero-word-in 0.55s cubic-bezier(0.22,1,0.36,1) forwards`,
                animationDelay: '600ms',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                /* Fixed height = 2 lines so layout never shifts */
                height: '3em',
                overflow: 'hidden',
              }}
            >
              <CyclingText />
            </span>
          </h1>

          {/* Subtitle */}
          <FadeUp delay={750} className="w-full">
            <p className="typo-body-lg mx-auto mt-6 max-w-2xl text-[var(--brand-gray-600)] leading-relaxed">
              Mejora tus habilidades de venta sin riesgo. Closer simula llamadas con clientes
              virtuales hiperrealistas y te da retroalimentación instantánea para que vendas con más confianza.
            </p>
          </FadeUp>

          {/* CTA Buttons */}
          <FadeUp delay={900} className="w-full">
            <div className="mt-10 flex w-full flex-col justify-center gap-4 sm:flex-row sm:items-center">
              <Link
                href={routes.signup}
                className="typo-body group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-[var(--brand-blue-600)] px-8 py-4 font-semibold text-white shadow-[0_10px_20px_rgba(0,87,255,0.2)] transition-all hover:-translate-y-0.5 hover:bg-[var(--brand-blue-700)] hover:shadow-[0_15px_25px_rgba(0,87,255,0.3)]"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Iniciar prueba gratuita
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
              <Link
                href={routes.login}
                className="typo-body inline-flex items-center justify-center rounded-xl border border-[var(--brand-gray-200)] bg-white px-8 py-4 font-semibold text-[var(--brand-ink-800)] shadow-sm transition-all hover:bg-[var(--brand-light-100)]"
              >
                Ver demo interactiva
              </Link>
            </div>
          </FadeUp>

          {/* Massive UI Dashboard Mockup directly in Hero */}
          <FadeUp delay={1100} className="mt-20 w-full">
            <div className="relative mx-auto w-full max-w-5xl rounded-[2rem] border border-[var(--brand-gray-200)] bg-white/40 p-2 shadow-2xl backdrop-blur-xl">
              <div className="absolute inset-x-0 bottom-0 z-20 h-40 bg-gradient-to-t from-[var(--brand-light-50)] to-transparent pointer-events-none rounded-b-[2rem]" />
              
              <div className="relative overflow-hidden rounded-[1.5rem] bg-white border border-[var(--brand-gray-100)] shadow-sm">
                {/* Browser/Window Header */}
                <div className="flex items-center border-b border-[var(--brand-gray-100)] bg-[#fafafa] px-4 py-3">
                  <div className="flex gap-2">
                    <div className="h-3 w-3 rounded-full bg-rose-400/80"></div>
                    <div className="h-3 w-3 rounded-full bg-amber-400/80"></div>
                    <div className="h-3 w-3 rounded-full bg-emerald-400/80"></div>
                  </div>
                  <div className="mx-auto flex h-6 w-64 items-center justify-center rounded-md bg-white border border-[var(--brand-gray-100)] text-[10px] font-medium text-[var(--brand-gray-400)]">
                    app.closer.ai / simulación
                  </div>
                  <div className="w-12"></div>
                </div>

                {/* Fake App State inside the Hero Mockup */}
                <div className="grid grid-cols-1 overflow-hidden md:grid-cols-[1fr_320px]">
                  {/* Left side: The Call Simulation */}
                  <div className="relative flex h-[480px] flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,1)_0%,rgba(244,249,255,0.7)_100%)]">
                    <div className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-[100%] bg-[var(--brand-blue-100)] opacity-40 blur-[60px]" />
                    
                    <div className="relative z-10 flex flex-col items-center">
                      <h3 className="text-2xl font-bold text-[var(--brand-ink-900)]">Santiago Herrera</h3>
                      <p className="mt-1 text-sm font-semibold text-[var(--brand-blue-600)] uppercase tracking-widest">CFO en Acme Corp</p>
                      
                      {/* The AI Orb Replica */}
                      <div className="relative mt-8 flex h-[200px] w-[200px] items-center justify-center">
                        <div className="absolute h-full w-full animate-ping rounded-full border border-[var(--brand-blue-300)] opacity-20" style={{animationDuration: '3s'}}></div>
                        <div className="absolute h-[140%] w-[140%] animate-ping rounded-full border border-[var(--brand-blue-200)] opacity-10" style={{animationDuration: '3s', animationDelay: '1s'}}></div>
                        <div className="relative flex h-[140px] w-[140px] items-center justify-center rounded-full bg-gradient-to-b from-[var(--brand-blue-400)] via-[var(--brand-blue-500)] to-[var(--brand-blue-700)] shadow-[0_16px_40px_rgba(0,87,255,0.3)]">
                           <div className="flex items-end gap-1.5 h-[32px]">
                             <span className="w-1.5 bg-white/90 rounded-full animate-pulse h-3"></span>
                             <span className="w-1.5 bg-white/90 rounded-full animate-pulse h-6" style={{animationDelay: '150ms'}}></span>
                             <span className="w-1.5 bg-white/90 rounded-full animate-pulse h-8" style={{animationDelay: '300ms'}}></span>
                             <span className="w-1.5 bg-white/90 rounded-full animate-pulse h-5" style={{animationDelay: '450ms'}}></span>
                             <span className="w-1.5 bg-white/90 rounded-full animate-pulse h-4" style={{animationDelay: '600ms'}}></span>
                           </div>
                        </div>
                      </div>
                    </div>

                    {/* Mock Coach Card */}
                    <div className="absolute bottom-8 z-10 w-[80%] max-w-md rounded-2xl border border-[var(--brand-blue-100)] bg-white/90 px-5 py-4 shadow-xl backdrop-blur-md">
                       <div className="flex items-center gap-2 mb-2">
                         <div className="h-2 w-2 rounded-full bg-[var(--brand-blue-500)] animate-pulse"></div>
                         <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-blue-700)]">IA Coach (Sugerencia)</span>
                       </div>
                       <p className="text-sm font-medium text-[var(--brand-ink-800)] leading-relaxed">
                         &quot;Santiago está dudando por el costo inicial. Haz un reencuadre hacia el ahorro proyectado en 6 meses antes de ofrecer un descuento.&quot;
                       </p>
                    </div>
                  </div>

                  {/* Right side: Real app components */}
                  <div className="border-l border-[var(--brand-gray-100)] bg-white p-5 flex flex-col gap-4 overflow-hidden">
                    
                    {/* Score Ring — exact replica from results-dashboard */}
                    <div className="flex flex-col items-center py-2">
                      <p className="typo-micro mb-3 font-semibold tracking-[0.15em] uppercase text-[var(--brand-gray-500)]">Precisión de la Venta</p>
                      <div className="flex h-[100px] w-[100px] items-center justify-center rounded-full border-[8px] border-emerald-500 bg-white shadow-sm">
                        <div className="flex flex-col items-center">
                          <span className="text-3xl font-extrabold leading-none text-emerald-600">84</span>
                          <span className="text-[10px] font-semibold text-[var(--brand-gray-500)]">/100</span>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-3 opacity-80">
                        <div className="flex items-center gap-1 text-[var(--brand-gray-500)]">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                          <span className="text-[10px] font-bold tracking-widest">04:32</span>
                        </div>
                        <div className="h-1 w-1 rounded-full bg-[var(--brand-gray-300)]" />
                        <div className="flex items-center gap-1 text-[var(--brand-gray-500)]">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
                          <span className="text-[10px] font-bold tracking-widest uppercase">12 Turnos</span>
                        </div>
                      </div>
                    </div>

                    {/* Voice Metrics — replica from results-dashboard review mode */}
                    <div className="rounded-xl border border-[var(--brand-gray-200)] bg-white p-3.5 shadow-sm">
                      <div className="mb-2 flex items-center gap-2 text-[var(--brand-gray-500)]">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
                        <span className="text-[10px] font-bold uppercase tracking-wider">Hablar vs Escuchar</span>
                      </div>
                      <div className="mb-2 flex h-3 w-full overflow-hidden rounded-full">
                        <div className="h-full bg-[var(--brand-blue-500)]" style={{ width: '42%' }} />
                        <div className="h-full bg-[var(--brand-gray-200)]" style={{ width: '58%' }} />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[9px] font-bold text-[var(--brand-blue-700)]">42% Hablaste</span>
                        <span className="text-[9px] font-bold text-[var(--brand-gray-500)]">58% Escuchaste</span>
                      </div>
                    </div>

                    {/* Radar Chart — exact replica from progress-dashboard / results-dashboard */}
                    <div className="rounded-xl border border-[var(--brand-gray-200)] bg-white p-3 shadow-sm">
                      <p className="text-[10px] font-bold text-[var(--brand-ink-900)] mb-1">Dominio de Habilidades</p>
                      <HeroRadarChart
                        data={[85, 72, 90, 65, 78]}
                        labels={['Prospección', 'Discovery', 'Demo', 'Objeciones', 'Cierre']}
                        color="#8b5cf6"
                        size={180}
                      />
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </FadeUp>

        </div>
      </section>
    </>
  )
}
