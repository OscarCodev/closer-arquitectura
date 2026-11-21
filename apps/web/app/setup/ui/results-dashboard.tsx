'use client'

import { useState, useEffect } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  MessageSquare,
  Play,
  RotateCcw,
  Briefcase,
  FileText,
  XCircle,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Mic,
  Activity,
  AlignLeft,
  Volume2,
} from 'lucide-react'
import type { RecentSession } from '../types/setup-types'

/* ── Radar Chart (Skills) ────────────────────────────────────────── */
function RadarChart({ data, labels, color, size = 220 }: { data: number[]; labels: string[]; color: string; size?: number }) {
  const center = size / 2
  const maxRadius = (size / 2) * 0.75
  const angleStep = (Math.PI * 2) / labels.length

  const getPoints = (values: number[], radiusScale = 1) => {
    return values
      .map((v, i) => {
        const r = ((v / 100) * maxRadius * radiusScale)
        const angle = i * angleStep - Math.PI / 2
        const x = center + r * Math.cos(angle)
        const y = center + r * Math.sin(angle)
        return `${x},${y}`
      })
      .join(' ')
  }

  return (
    <div className="relative flex flex-col items-center">
      <svg width={size} height={size} className="overflow-visible">
        {[0.2, 0.4, 0.6, 0.8, 1].map((scale) => (
          <polygon
            key={scale}
            points={getPoints(
              labels.map(() => 100),
              scale
            )}
            fill="none"
            stroke="var(--brand-gray-100)"
            strokeWidth="1"
          />
        ))}

        {labels.map((_, i) => {
          const angle = i * angleStep - Math.PI / 2
          const x = center + maxRadius * Math.cos(angle)
          const y = center + maxRadius * Math.sin(angle)
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="var(--brand-gray-100)"
              strokeWidth="1"
            />
          )
        })}

        <polygon
          points={getPoints(data)}
          fill={color + '20'}
          stroke={color}
          strokeWidth="2.5"
        />

        {labels.map((label, i) => {
          const angle = i * angleStep - Math.PI / 2
          const offset = size > 300 ? 35 : 22
          const x = center + (maxRadius + offset) * Math.cos(angle)
          const y = center + (maxRadius + offset / 2) * Math.sin(angle)
          return (
            <text
              key={i}
              x={x}
              y={y}
              fontSize={size > 300 ? '11' : '10'}
              fontWeight="700"
              fill="var(--brand-gray-500)"
              textAnchor="middle"
              className="uppercase tracking-widest"
            >
              {label}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

interface ResultsDashboardProps {
  recentSession?: RecentSession
  onRetry?: () => void
  onBack?: () => void
}

export function ResultsDashboard({ recentSession, onRetry, onBack }: ResultsDashboardProps) {
  if (!recentSession) {
    return (
      <section className="grid flex-1 place-items-center bg-[var(--brand-light-50)] px-6 py-12">
        <div className="text-center">
          <p className="typo-micro font-semibold uppercase tracking-[0.14em] text-[var(--brand-gray-500)]">
            Sin datos
          </p>
          <h2 className="typo-page-title mt-2 font-semibold text-[var(--brand-ink-900)]">
            Aun no hay una sesion para mostrar
          </h2>
        </div>
      </section>
    )
  }

  const [currentSimulationIndex, setCurrentSimulationIndex] = useState(
    Math.max(0, recentSession.simulations.length - 1),
  )
  const [displayScore, setDisplayScore] = useState(0)
  const [mode, setMode] = useState<'summary' | 'review' | 'transcript' | 'context'>('summary')
  const [currentTurn, setCurrentTurn] = useState(0)

  const totalSimulations = recentSession.simulations.length
  const safeSimulationIndex = Math.min(Math.max(currentSimulationIndex, 0), Math.max(totalSimulations - 1, 0))
  const currentSimulation = recentSession.simulations[safeSimulationIndex]
  const canonicalContext = recentSession.simulations[0]?.context || currentSimulation?.context
  const sessionMode = recentSession.advancedSelections?.modo || 'Ciclo Completo'
  const sessionTone = recentSession.advancedSelections?.tono || 'Perfil Real'

  if (!currentSimulation) {
    return (
      <section className="grid flex-1 place-items-center bg-[var(--brand-light-50)] px-6 py-12">
        <div className="text-center">
          <p className="typo-micro font-semibold uppercase tracking-[0.14em] text-[var(--brand-gray-500)]">
            Sin datos
          </p>
          <h2 className="typo-page-title mt-2 font-semibold text-[var(--brand-ink-900)]">
            Esta sesion no tiene simulaciones todavia
          </h2>
        </div>
      </section>
    )
  }

  const { metrics, conversation, analysis } = currentSimulation

  // Reset dashboard state when user selects a different recent session.
  useEffect(() => {
    setCurrentSimulationIndex(Math.max(0, recentSession.simulations.length - 1))
    setMode('summary')
    setCurrentTurn(0)
    setDisplayScore(0)
  }, [recentSession])

  // Score animation
  useEffect(() => {
    if (mode !== 'summary') return

    let startTime: number
    const duration = 1200

    const startDelay = setTimeout(() => {
      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp
        const progress = Math.min((timestamp - startTime) / duration, 1)
        const easeOutQuint = 1 - Math.pow(1 - progress, 5)
        setDisplayScore(Math.floor(easeOutQuint * metrics.score))
        if (progress < 1) window.requestAnimationFrame(step)
      }
      window.requestAnimationFrame(step)
    }, 300)

    return () => clearTimeout(startDelay)
  }, [mode, metrics.score])

  // Filter errors for review
  const errorsOnly = conversation.filter((c) => c.evaluation === 'critical' || c.evaluation === 'warning')
  const criticalCount = conversation.filter((c) => c.evaluation === 'critical').length
  const warningCount = conversation.filter((c) => c.evaluation === 'warning').length
  const goodCount = conversation.filter((c) => c.evaluation === 'good').length
  const neutralCount = conversation.filter((c) => c.evaluation === 'neutral').length
  const pendingFeedbackCount = criticalCount + warningCount
  const positiveFeedbackCount = goodCount + neutralCount
  const feedbackButtonCount = pendingFeedbackCount > 0 ? pendingFeedbackCount : positiveFeedbackCount
  const feedbackButtonLabel = pendingFeedbackCount > 0 ? 'Feedback y Métricas' : 'Resumen de Desempeño'
  const reviewStartIndex = pendingFeedbackCount > 0 ? 0 : errorsOnly.length
  const reviewSteps = [...errorsOnly, 'voice', 'radar']

  // Keyboard navigation for review mode
  useEffect(() => {
    if (mode !== 'review') return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setCurrentTurn((prev) => Math.min(reviewSteps.length - 1, prev + 1))
      else if (e.key === 'ArrowLeft') setCurrentTurn((prev) => Math.max(0, prev - 1))
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mode, reviewSteps.length])

  // ─── NAV BETWEEN ATTEMPTS ───
  const handlePrevAttempt = () => {
    if (safeSimulationIndex > 0) {
      setCurrentSimulationIndex(safeSimulationIndex - 1)
      setMode('summary')
      setCurrentTurn(0)
      setDisplayScore(0)
    }
  }

  const handleNextAttempt = () => {
    if (safeSimulationIndex < totalSimulations - 1) {
      setCurrentSimulationIndex(safeSimulationIndex + 1)
      setMode('summary')
      setCurrentTurn(0)
      setDisplayScore(0)
    }
  }

  // ─── SCORE LEVEL DETERMINATION ───
  const getScoreLevel = (score: number) => {
    if (score >= 75) return { level: 'avanzada', name: 'Avanzada' }
    if (score >= 50) return { level: 'intermedia', name: 'Intermedia' }
    return { level: 'basica', name: 'Básica' }
  }

  const getScoreColors = (score: number) => {
    const level = getScoreLevel(score)
    if (level.level === 'avanzada') {
      return {
        borderColor: '#10B981',
        textColor: '#059669',
        bgTint: 'bg-emerald-50',
        title: '¡Excelente desempeño!',
        description: 'Demostraste dominio en tus habilidades de venta. Sigue así.',
      }
    } else if (level.level === 'intermedia') {
      return {
        borderColor: '#FCD34D',
        textColor: '#B45309',
        bgTint: 'bg-amber-50',
        title: 'Buen comienzo',
        description: 'Vas por buen camino. Trabaja en los puntos débiles identificados.',
      }
    } else {
      return {
        borderColor: 'var(--color-danger-bg)',
        textColor: 'var(--color-danger-text)',
        bgTint: 'bg-red-50',
        title: 'Perdiste puntos vitales',
        description: 'Tu precisión promedio fue baja. Cometiste errores que casi cuestan la oportunidad.',
      }
    }
  }

  if (mode === 'summary') {
    const colors = getScoreColors(metrics.score)

    return (
      <section className="flex flex-1 flex-col overflow-auto bg-[var(--brand-light-50)] relative items-center justify-center">
        <div className="w-full max-w-[650px] p-6 text-center">
          {onBack && (
            <button
              onClick={onBack}
              className="absolute top-6 left-6 flex items-center gap-1.5 typo-body font-semibold text-[var(--brand-gray-500)] hover:text-[var(--brand-ink-900)] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Volver al Menú
            </button>
          )}

          {/* ── ATTEMPT NAVIGATION ── */}
          {totalSimulations > 1 && (
            <div className="absolute top-1/2 left-4 -translate-y-1/2 flex flex-col items-center gap-3">
              <button
                onClick={handlePrevAttempt}
                disabled={safeSimulationIndex === 0}
                className={`p-2 rounded-full transition-all ${
                  safeSimulationIndex === 0
                    ? 'opacity-30 cursor-not-allowed'
                    : 'hover:bg-white shadow-sm hover:shadow-md'
                }`}
              >
                <ChevronLeft className="w-5 h-5 text-[var(--brand-ink-900)]" />
              </button>
              <div className="flex flex-col items-center gap-1.5 bg-white px-3 py-2 rounded-lg shadow-sm">
                <span className="text-2xl font-bold text-[var(--brand-ink-900)]">{safeSimulationIndex + 1}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--brand-gray-500)]">
                  de {totalSimulations}
                </span>
              </div>
              <button
                onClick={handleNextAttempt}
                disabled={safeSimulationIndex === totalSimulations - 1}
                className={`p-2 rounded-full transition-all ${
                  safeSimulationIndex === totalSimulations - 1
                    ? 'opacity-30 cursor-not-allowed'
                    : 'hover:bg-white shadow-sm hover:shadow-md'
                }`}
              >
                <ChevronRight className="w-5 h-5 text-[var(--brand-ink-900)]" />
              </button>
            </div>
          )}

          <header className="mb-10 setup-reveal">
            <h2 className="typo-micro mb-6 font-semibold tracking-[0.15em] uppercase text-[var(--brand-gray-500)]">
              Precisión de la Venta
            </h2>

            <div
              className="mx-auto flex h-40 w-40 items-center justify-center rounded-full border-[10px] bg-white shadow-sm mb-6 transition-transform duration-500 hover:scale-105"
              style={{ borderColor: colors.borderColor }}
            >
              <div className="flex flex-col items-center">
                <span className="text-5xl font-extrabold leading-none" style={{ color: colors.textColor }}>
                  {displayScore}
                </span>
                <span className="typo-body font-semibold text-[var(--brand-gray-500)]">/ 100</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 mb-8 opacity-80">
              <div className="flex items-center gap-1.5 text-[var(--brand-gray-500)]">
                <Clock className="w-4 h-4" />
                <span className="typo-label font-bold tracking-widest">{metrics.duration}</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-[var(--brand-gray-300)]" />
              <div className="flex items-center gap-1.5 text-[var(--brand-gray-500)]">
                <MessageSquare className="w-4 h-4" />
                <span className="typo-label font-bold tracking-widest uppercase">{metrics.turns} Turnos</span>
              </div>
            </div>

            <h1 className="typo-page-title font-semibold text-[var(--brand-ink-900)] mb-4">
              {colors.title}
            </h1>
            <p className="typo-body text-[var(--brand-gray-600)] mx-auto max-w-[420px] mb-8">
              {colors.description}
            </p>

            <div className="flex flex-wrap justify-center gap-3 mb-10">
              <div className="flex flex-col items-center px-3 py-1.5 border-b-2 border-[var(--color-danger-text)] min-w-[88px]">
                <span className="text-xl font-bold text-[var(--color-danger-text)]">{criticalCount}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--brand-gray-500)] mt-1">
                  Errores
                </span>
              </div>
              <div className="flex flex-col items-center px-3 py-1.5 border-b-2 border-amber-500 min-w-[88px]">
                <span className="text-xl font-bold text-amber-600">{warningCount}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--brand-gray-500)] mt-1">
                  Mejorables
                </span>
              </div>
              <div className="flex flex-col items-center px-3 py-1.5 border-b-2 border-emerald-500 min-w-[88px]">
                <span className="text-xl font-bold text-emerald-600">{goodCount}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--brand-gray-500)] mt-1">
                  Brillantes
                </span>
              </div>
              <div className="flex flex-col items-center px-3 py-1.5 border-b-2 border-slate-400 min-w-[88px]">
                <span className="text-xl font-bold text-slate-600">{neutralCount}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--brand-gray-500)] mt-1">
                  Neutros
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 max-w-[340px] mx-auto mt-4">
              <button
                onClick={() => {
                  setMode('review')
                  setCurrentTurn(reviewStartIndex)
                }}
                className="flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-ink-900)] px-6 py-4 font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[var(--brand-ink-700)] hover:shadow-lg"
              >
                <Play className="w-5 h-5 fill-current" />
                {feedbackButtonLabel} ({feedbackButtonCount})
              </button>

              <div className="flex items-center justify-center gap-6 mt-2 flex-wrap">
                <button
                  onClick={() => setMode('context')}
                  className="typo-label font-semibold text-[var(--brand-gray-500)] hover:text-[var(--brand-ink-900)] transition-colors flex items-center gap-1.5"
                >
                  <Briefcase className="w-4 h-4" />
                  Contexto
                </button>

                <button
                  onClick={() => setMode('transcript')}
                  className="typo-label font-semibold text-[var(--brand-gray-500)] hover:text-[var(--brand-ink-900)] transition-colors flex items-center gap-1.5"
                >
                  <FileText className="w-4 h-4" />
                  Transcripción
                </button>

                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="typo-label font-semibold text-[var(--brand-gray-500)] hover:text-[var(--brand-ink-900)] transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reintentar Llamada
                  </button>
                )}
              </div>
            </div>
          </header>
        </div>
      </section>
    )
  }

  if (mode === 'context') {
    return (
      <section className="flex flex-1 flex-col overflow-hidden bg-[var(--brand-light-50)]">
        <header className="relative flex h-16 shrink-0 items-center border-b border-[var(--color-border)] bg-white px-4 shadow-sm md:px-6">
          <button
            onClick={() => setMode('summary')}
            className="z-10 flex items-center gap-1.5 rounded-md px-2 py-1 text-[var(--brand-gray-500)] typo-body font-semibold transition-colors hover:bg-[var(--brand-light-200)]"
          >
            <ChevronLeft className="w-5 h-5 -ml-1" />
            Volver al Resumen
          </button>

          <span className="absolute left-1/2 hidden -translate-x-1/2 text-[var(--brand-ink-900)] typo-body font-semibold md:block">
            Contexto de la Simulación
          </span>
        </header>

        <div className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-[800px] p-4 md:p-8">
            <div className="setup-reveal space-y-5">
            <div className="rounded-2xl border border-[var(--brand-gray-200)] bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-[var(--brand-gray-500)]">
                <Activity className="w-4 h-4" />
                <span className="typo-label font-bold uppercase tracking-wider">Configuración de la Simulación</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-[var(--brand-light-50)] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-gray-500)]">Modo</p>
                  <p className="typo-body mt-1 font-semibold text-[var(--brand-ink-900)]">{sessionMode}</p>
                </div>

                <div className="rounded-xl bg-[var(--brand-light-50)] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-gray-500)]">Tono</p>
                  <p className="typo-body mt-1 font-semibold text-[var(--brand-ink-900)]">{sessionTone}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--brand-gray-200)] bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-[var(--brand-gray-500)]">
                <FileText className="w-4 h-4" />
                <span className="typo-label font-bold uppercase tracking-wider">Tu Contexto de Venta</span>
              </div>
              <div className="rounded-xl bg-[var(--brand-light-50)] p-4">
                <p className="typo-body leading-[1.7] text-[var(--brand-gray-700)]">{canonicalContext?.salesContext || recentSession.context}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--brand-gray-200)] bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-[var(--brand-gray-500)]">
                <Briefcase className="w-4 h-4" />
                <span className="typo-label font-bold uppercase tracking-wider">Perfil</span>
              </div>
              <div className="mb-4 flex items-start gap-3">
                <div className="grid h-[50px] w-[50px] shrink-0 place-items-center rounded-xl bg-[var(--brand-mist-100)] text-[18px] font-bold text-[var(--brand-blue-600)]">
                  {(canonicalContext?.prospectName || recentSession.prospect || 'Prospecto')
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-[18px] font-bold leading-tight text-[var(--brand-ink-900)]">
                    {canonicalContext?.prospectName || recentSession.prospect || 'Prospecto'}
                  </h3>
                  <p className="typo-micro mt-1 flex items-center gap-1.5 font-medium text-[var(--brand-gray-500)]">
                    <Briefcase className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      {canonicalContext?.prospectRole || ''}
                      {canonicalContext?.prospectCompany ? ` en ${canonicalContext.prospectCompany}` : ''}
                    </span>
                  </p>
                </div>
              </div>
              <div className="rounded-xl bg-[var(--brand-light-50)] p-4">
                <p className="typo-body leading-[1.7] text-[var(--brand-gray-700)]">
                  {canonicalContext?.prospectDescription || recentSession.context}
                </p>
              </div>
            </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (mode === 'transcript') {
    return (
      <section className="flex flex-1 flex-col overflow-hidden bg-[var(--brand-light-50)]">
        <header className="relative flex h-16 shrink-0 items-center border-b border-[var(--color-border)] bg-white px-4 shadow-sm md:px-6">
          <button
            onClick={() => setMode('summary')}
            className="z-10 flex items-center gap-1.5 rounded-md px-2 py-1 text-[var(--brand-gray-500)] typo-body font-semibold transition-colors hover:bg-[var(--brand-light-200)]"
          >
            <ChevronLeft className="w-5 h-5 -ml-1" />
            Volver al Resumen
          </button>

          <span className="absolute left-1/2 hidden -translate-x-1/2 text-[var(--brand-ink-900)] typo-body font-semibold md:block">
            Historial de la Llamada
          </span>
        </header>

        <div className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-[800px] space-y-8 p-4 md:p-8">
            {conversation.map((step, i) => (
            <div
              key={`${step.turn}-${i}`}
              className="setup-reveal mb-10 space-y-4 border-b border-[var(--brand-gray-200)] pb-6 last:border-0"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="flex gap-4">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--brand-blue-200)] bg-[var(--brand-mist-200)]">
                  <span className="text-[10px] font-bold text-[var(--brand-blue-700)]">IA</span>
                </div>
                <p className="typo-body mt-1 leading-relaxed text-[var(--brand-gray-700)]">{step.ia}</p>
              </div>

              <div className="flex gap-4">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-transparent bg-[var(--brand-ink-900)]">
                  <span className="text-[10px] font-bold text-white">TÚ</span>
                </div>
                <div className="mt-1 flex-1 space-y-2">
                  <p className="typo-body font-medium leading-relaxed text-[var(--brand-ink-900)]">{step.tu}</p>

                  <div
                    className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 shadow-sm"
                    style={{
                      backgroundColor:
                        step.evaluation === 'critical'
                          ? 'var(--color-danger-bg)'
                          : step.evaluation === 'warning'
                            ? '#FEF3C7'
                            : step.evaluation === 'good'
                              ? '#D1FAE5'
                              : '#F3F4F6',
                      borderColor:
                        step.evaluation === 'critical'
                          ? 'var(--color-danger-border)'
                          : step.evaluation === 'warning'
                            ? '#FDE68A'
                            : step.evaluation === 'good'
                              ? '#A7F3D0'
                              : '#E5E7EB',
                      color:
                        step.evaluation === 'critical'
                          ? 'var(--color-danger-text)'
                          : step.evaluation === 'warning'
                            ? '#B45309'
                            : step.evaluation === 'good'
                              ? '#047857'
                              : '#6B7280',
                    }}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {step.evaluation === 'critical'
                        ? 'Error Crítico'
                        : step.evaluation === 'warning'
                          ? 'Imprecisión'
                          : step.evaluation === 'good'
                            ? 'Brillante'
                            : 'Neutro'}
                    </span>
                  </div>

                  {(step.evaluation === 'critical' || step.evaluation === 'warning') && step.improvement && (
                    <div className="mt-3 rounded-lg border border-[var(--brand-blue-100)] bg-[var(--brand-mist-50)] p-4 text-sm text-[var(--brand-blue-900)]">
                      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[var(--brand-blue-600)]">
                        Debiste decir:
                      </span>
                      <span className="italic">{step.improvement}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (mode === 'review') {
    const currentStepData = errorsOnly[currentTurn]
    const isMetricsTab = currentTurn === errorsOnly.length
    const isRadarTab = currentTurn === errorsOnly.length + 1
    const isMetricsModule = isMetricsTab || isRadarTab
    const isCritical = currentStepData?.evaluation === 'critical'
    const voiceMetrics = analysis.voice
    const skillRadar = analysis.skills

    return (
      <section className="flex flex-1 flex-col overflow-hidden bg-[var(--brand-light-100)]">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-white px-4 shadow-sm md:px-6">
          <button
            onClick={() => setMode('summary')}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[var(--brand-gray-500)] typo-body font-semibold transition-colors hover:bg-[var(--brand-light-200)]"
          >
            <ChevronLeft className="w-5 h-5 -ml-1" />
            Volver al Resumen
          </button>

          <div className="absolute left-1/2 flex w-full -translate-x-1/2 flex-col items-center gap-1.5 pointer-events-none md:w-auto">
            <span className="hidden text-[10px] font-bold uppercase tracking-widest text-[var(--brand-gray-500)] md:block">
              {isMetricsTab ? 'Resumen de Comunicación' : isRadarTab ? 'Dominio de Habilidades' : `Puntos de Mejora ${currentTurn + 1} de ${errorsOnly.length}`}
            </span>
            <div className="pointer-events-auto hidden items-center justify-center gap-1 md:flex">
              {reviewSteps.map((_, i) => {
                const isMetricsPoint = i >= errorsOnly.length
                const isCriticalPoint = !isMetricsPoint && errorsOnly[i]?.evaluation === 'critical'
                const isWarningPoint = !isMetricsPoint && errorsOnly[i]?.evaluation === 'warning'

                return (
                  <div
                    key={i}
                    onClick={() => setCurrentTurn(i)}
                    className={`h-2 w-8 cursor-pointer rounded-full transition-all ${
                      i === currentTurn
                        ? 'scale-y-125 bg-[var(--brand-ink-900)]'
                        : isMetricsPoint
                          ? 'bg-[var(--brand-blue-200)] hover:bg-[var(--brand-blue-300)]'
                          : isCriticalPoint
                            ? 'bg-[var(--color-danger-bg)] hover:bg-[var(--color-danger-border)]'
                            : isWarningPoint
                              ? 'bg-amber-100 hover:bg-amber-200'
                              : 'bg-[var(--brand-gray-200)]'
                    }`}
                  />
                )
              })}
            </div>
          </div>

          {onBack ? (
            <button
              onClick={onBack}
              className="typo-label font-bold text-[var(--brand-gray-500)] transition-colors tracking-widest uppercase hover:text-[var(--brand-ink-900)]"
            >
              {isMetricsModule ? 'Volver al Menú' : 'Cerrar ✕'}
            </button>
          ) : (
            <div className="w-16" />
          )}
        </header>

        <div className="flex-1 overflow-auto bg-[var(--brand-light-50)]">
          <div className="mx-auto w-full max-w-[800px] p-6 pb-32 md:p-10 md:pb-32">
            {currentTurn < errorsOnly.length ? (
              <div key={`turn-${currentTurn}`} className="setup-reveal space-y-8">
                <div className="flex gap-4">
                  <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--brand-blue-200)] bg-[var(--brand-mist-200)]">
                    <span className="typo-caption font-bold text-[var(--brand-blue-700)]">IA</span>
                  </div>
                  <div className="rounded-2xl rounded-tl-sm border border-[var(--brand-gray-200)] bg-white p-5 pr-8 shadow-sm">
                    <p className="typo-body-lg leading-relaxed text-[var(--brand-gray-700)]">{currentStepData?.ia}</p>
                  </div>
                </div>

                <div className="flex flex-row-reverse gap-4">
                  <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-transparent bg-[var(--brand-ink-900)] shadow-md">
                    <span className="typo-caption font-bold text-white">TÚ</span>
                  </div>
                  <div className="relative rounded-2xl rounded-tr-sm border border-[var(--brand-gray-300)] bg-[var(--brand-light-200)] p-5 pl-8">
                    <p className="typo-body-lg leading-relaxed text-[var(--brand-ink-900)]">{currentStepData?.tu}</p>
                    <div className={`absolute -bottom-5 -left-4 flex items-center gap-1.5 rounded-full border-2 border-white px-3 py-1 shadow-md ${isCritical ? 'bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]' : 'bg-amber-100 text-amber-700'}`}>
                      {isCritical ? <XCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      <span className="text-[12px] font-bold uppercase tracking-wider">{isCritical ? 'Error Crítico' : 'Imprecisión'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-8">
                  <div className={`rounded-2xl border-2 p-6 transition-all ${isCritical ? 'border-[var(--color-danger-border)] bg-[var(--color-danger-bg)]' : 'border-amber-200 bg-amber-50'}`}>
                    <h4 className={`typo-body-lg mb-3 font-bold ${isCritical ? 'text-[var(--color-danger-text)]' : 'text-amber-800'}`}>Coach: {currentStepData?.title}</h4>
                    <p className="typo-body mb-5 text-[var(--brand-gray-700)]">{currentStepData?.diagnostic}</p>
                    {currentStepData?.improvement && (
                      <div className="rounded-xl border border-white/50 bg-white/70 p-4 backdrop-blur-sm">
                        <div className="mb-2 flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-[var(--brand-blue-500)]" />
                          <span className="typo-label font-bold uppercase tracking-wider text-[var(--brand-blue-700)]">Libreto Sugerido</span>
                        </div>
                        <p className="typo-body font-medium italic text-[var(--brand-blue-900)]">{currentStepData.improvement}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : isMetricsTab ? (
              <div key="metrics" className="setup-reveal space-y-6">
                <header className="mb-8 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-blue-100)] text-[var(--brand-blue-600)]">
                    <Mic className="w-8 h-8" />
                  </div>
                  <h2 className="typo-page-title font-semibold text-[var(--brand-ink-900)]">Tus Métricas de Voz</h2>
                  <p className="typo-body mt-2 text-[var(--brand-gray-600)]">Así fue tu desempeño técnico al momento de hablar.</p>
                </header>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[var(--brand-gray-200)] bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-center gap-2 text-[var(--brand-gray-500)]">
                      <Clock className="w-4 h-4" />
                      <span className="typo-label font-bold uppercase tracking-wider">Ritmo de Habla</span>
                    </div>
                    <div className="mb-2 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-[var(--color-danger-text)]">{voiceMetrics.speechRate.value}</span>
                      <span className="typo-body font-semibold text-[var(--brand-gray-500)]">{voiceMetrics.speechRate.unit}</span>
                    </div>
                    <p className="typo-caption text-[var(--brand-gray-600)]">{voiceMetrics.speechRate.insight}</p>
                  </div>

                  <div className="rounded-2xl border border-[var(--brand-gray-200)] bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-center gap-2 text-[var(--brand-gray-500)]">
                      <Volume2 className="w-4 h-4" />
                      <span className="typo-label font-bold uppercase tracking-wider">Hablar vs Escuchar</span>
                    </div>
                    <div className="mb-3 flex h-4 w-full overflow-hidden rounded-full">
                      <div className="h-full bg-[var(--brand-blue-500)]" style={{ width: `${voiceMetrics.talkListenRatio.talk}%` }} />
                      <div className="h-full bg-[var(--brand-gray-200)]" style={{ width: `${voiceMetrics.talkListenRatio.listen}%` }} />
                    </div>
                    <div className="flex justify-between typo-caption font-semibold">
                      <span className="text-[var(--brand-blue-700)]">{voiceMetrics.talkListenRatio.talk}% Hablaste</span>
                      <span className="text-[var(--brand-gray-500)]">{voiceMetrics.talkListenRatio.listen}% Escuchaste</span>
                    </div>
                    <p className="typo-caption mt-2 text-[var(--brand-gray-600)]">{voiceMetrics.talkListenRatio.insight}</p>
                  </div>

                  <div className="rounded-2xl border border-[var(--brand-gray-200)] bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-center gap-2 text-[var(--brand-gray-500)]">
                      <AlignLeft className="w-4 h-4" />
                      <span className="typo-label font-bold uppercase tracking-wider">Monólogo más largo</span>
                    </div>
                    <div className="mb-2 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-amber-600">{voiceMetrics.longestMonologue.value}</span>
                      <span className="typo-body font-semibold text-[var(--brand-gray-500)]">mm:ss</span>
                    </div>
                    <p className="typo-caption text-[var(--brand-gray-600)]">{voiceMetrics.longestMonologue.insight}</p>
                  </div>

                  <div className="rounded-2xl border border-[var(--brand-gray-200)] bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-center gap-2 text-[var(--brand-gray-500)]">
                      <MessageSquare className="w-4 h-4" />
                      <span className="typo-label font-bold uppercase tracking-wider">Muletillas (Fillers)</span>
                    </div>
                    <div className="mb-3 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-emerald-600">{voiceMetrics.fillers.count}</span>
                      <span className="typo-body font-semibold text-[var(--brand-gray-500)]">detectadas</span>
                    </div>
                    <div className="mb-3 flex flex-wrap gap-2">
                      {voiceMetrics.fillers.examples.map((example) => (
                        <span
                          key={example.text}
                          className="inline-flex items-center rounded-md border border-[var(--brand-gray-300)] bg-[var(--brand-light-200)] px-2 py-1 text-xs font-semibold text-[var(--brand-gray-600)]"
                        >
                          &quot;{example.text}&quot; <span className="ml-1 opacity-60">x{example.count}</span>
                        </span>
                      ))}
                    </div>
                    <p className="typo-caption text-[var(--brand-gray-600)]">{voiceMetrics.fillers.insight}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div key="radar" className="setup-reveal flex flex-col items-center space-y-8">
                <header className="mb-4 text-center">
                  <h2 className="typo-page-title font-semibold text-[var(--brand-ink-900)]">Dominio de Habilidades</h2>
                  <p className="typo-body mt-2 text-[var(--brand-gray-600)]">Basado en tus interacciones con prospectos</p>
                </header>

                <div className="flex w-full flex-col items-center justify-around gap-12 pt-4 md:flex-row">
                  <RadarChart
                    data={skillRadar.values}
                    labels={skillRadar.labels}
                    color="#8b5cf6"
                    size={360}
                  />

                  <div className="flex flex-col gap-8">
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-gray-400)]">Mejor Habilidad</p>
                      <p className="text-xl font-extrabold text-[#8b5cf6]">{skillRadar.strongest.label} ({skillRadar.strongest.value}%)</p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-gray-400)]">Por Mejorar</p>
                      <p className="text-xl font-extrabold text-red-500">{skillRadar.weakest.label} ({skillRadar.weakest.value}%)</p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-gray-400)]">Ratio de Éxito</p>
                      <p className="text-xl font-extrabold text-[var(--brand-ink-900)]">
                        {skillRadar.averageSuccessRate}% <span className="text-sm font-bold text-[var(--brand-gray-400)]">promedio</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="w-full max-w-[860px] rounded-2xl border border-[var(--brand-blue-100)] bg-[var(--brand-mist-50)] p-5 shadow-sm">
                  <div className="mb-2 flex items-center gap-2 text-[var(--brand-blue-700)]">
                    <Lightbulb className="h-4 w-4" />
                    <span className="typo-label font-bold uppercase tracking-wider">Plan de Mejora</span>
                  </div>
                  <p className="typo-body text-[var(--brand-blue-900)]">
                    {skillRadar.improvementMessage || `Refuerza ${skillRadar.weakest.label} con una práctica enfocada y objetivos medibles en tu próxima simulación.`}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="z-10 flex items-center justify-between border-t border-[var(--color-border)] bg-white p-4 drop-shadow-[0_-12px_24px_rgba(0,0,0,0.03)]">
          <button
            disabled={currentTurn === 0}
            onClick={() => setCurrentTurn(Math.max(0, currentTurn - 1))}
            className="flex items-center gap-2 rounded-lg px-4 py-3 font-semibold text-[var(--brand-gray-600)] transition-colors hover:bg-[var(--brand-light-200)] disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5" />
            Anterior
          </button>

          {currentTurn < reviewSteps.length - 1 ? (
            <div className="flex items-center gap-3">
              {currentTurn < errorsOnly.length ? (
                <button
                  onClick={() => setCurrentTurn(errorsOnly.length)}
                  className="typo-label px-4 py-3 font-bold text-[var(--brand-gray-500)] transition-colors hover:text-[var(--brand-ink-900)]"
                >
                  Saltar a métricas
                </button>
              ) : null}
              <button
                onClick={() => setCurrentTurn(currentTurn + 1)}
                className={`flex items-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                  currentTurn >= errorsOnly.length - 1
                    ? 'bg-[var(--brand-blue-100)] text-[var(--brand-blue-700)] hover:bg-[var(--brand-blue-200)]'
                    : 'bg-[var(--brand-ink-900)] text-white hover:bg-[var(--brand-ink-700)]'
                }`}
              >
                {currentTurn === errorsOnly.length - 1 ? 'Métricas de Voz' : currentTurn === errorsOnly.length ? 'Ver Habilidades' : 'Siguiente'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                onClick={onBack}
                className="flex items-center gap-2 rounded-xl bg-[var(--brand-blue-500)] px-6 py-3 font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[var(--brand-blue-600)] hover:shadow-lg"
              >
                <RotateCcw className="w-5 h-5" />
                Finalizar Revisión
              </button>
            </div>
          )}
        </div>
      </section>
    )
  }

  return null
}
