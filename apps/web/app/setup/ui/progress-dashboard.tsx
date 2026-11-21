'use client'

import { useEffect, useRef, useState } from 'react'
import { Clock, Activity } from 'lucide-react'
import type { RecentSession } from '../types/setup-types'

export type ActivityHeatmapPoint = {
  level: number
  date: string
}

type ProgressDashboardProps = {
  sessions: RecentSession[]
  consistencyData?: ActivityHeatmapPoint[]
  consistencyStreakDays?: number
}

function toDayKey(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function resolveActivityLevel(count: number) {
  if (count <= 0) return 0
  if (count === 1) return 1
  if (count === 2) return 2
  if (count === 3) return 3
  return 4
}

function buildConsistencyFromAttempts(attemptDates: Date[]): {
  data: ActivityHeatmapPoint[]
  streakDays: number
} {
  const today = new Date()
  const countByDay = new Map<string, number>()

  attemptDates.forEach((date) => {
    const key = toDayKey(date)
    countByDay.set(key, (countByDay.get(key) || 0) + 1)
  })

  const points: ActivityHeatmapPoint[] = []
  for (let offset = 27; offset >= 0; offset--) {
    const date = new Date(today)
    date.setHours(0, 0, 0, 0)
    date.setDate(today.getDate() - offset)

    const key = toDayKey(date)
    const count = countByDay.get(key) || 0
    points.push({ level: resolveActivityLevel(count), date: key })
  }

  let streak = 0
  for (let offset = 0; offset <= 27; offset++) {
    const date = new Date(today)
    date.setHours(0, 0, 0, 0)
    date.setDate(today.getDate() - offset)
    const key = toDayKey(date)
    const count = countByDay.get(key) || 0

    if (count > 0) {
      streak += 1
    } else {
      break
    }
  }

  return { data: points, streakDays: streak }
}

/* ── Sparkline component ──────────────────────────────────────────── */
function Sparkline({ data, color, height = 48 }: { data: number[]; color: string; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || data.length < 2) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.scale(dpr, dpr)

    const min = Math.min(...data) - 5
    const max = Math.max(...data) + 5
    const range = max - min || 1
    const stepX = w / (data.length - 1)

    const gradient = ctx.createLinearGradient(0, 0, 0, h)
    gradient.addColorStop(0, color + '20')
    gradient.addColorStop(1, color + '00')

    ctx.beginPath()
    ctx.moveTo(0, h)
    data.forEach((v, i) => {
      const x = i * stepX
      const y = h - ((v - min) / range) * (h - 8)
      if (i === 0) ctx.lineTo(x, y)
      else {
        const prevX = (i - 1) * stepX
        const prevY = h - ((data[i - 1] - min) / range) * (h - 8)
        const cpX = (prevX + x) / 2
        ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y)
      }
    })
    ctx.lineTo(w, h)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()

    ctx.beginPath()
    data.forEach((v, i) => {
      const x = i * stepX
      const y = h - ((v - min) / range) * (h - 8)
      if (i === 0) ctx.moveTo(x, y)
      else {
        const prevX = (i - 1) * stepX
        const prevY = h - ((data[i - 1] - min) / range) * (h - 8)
        const cpX = (prevX + x) / 2
        ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y)
      }
    })
    ctx.strokeStyle = color
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.stroke()

    const lastX = (data.length - 1) * stepX
    const lastY = h - ((data[data.length - 1] - min) / range) * (h - 8)
    ctx.beginPath()
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
  }, [data, color, height])

  return <canvas ref={canvasRef} className="w-full" style={{ height }} />
}

/* ── Radar Chart (Skills) ────────────────────────────────────────── */
function RadarChart({ data, labels, color, size = 220 }: { data: number[]; labels: string[]; color: string; size?: number }) {
  const center = size / 2
  const maxRadius = (size / 2) * 0.75
  const angleStep = (Math.PI * 2) / labels.length

  const getPoints = (values: number[], radiusScale = 1) => {
    return values.map((v, i) => {
      const r = (v / 100) * maxRadius * radiusScale
      const angle = i * angleStep - Math.PI / 2
      const x = center + r * Math.cos(angle)
      const y = center + r * Math.sin(angle)
      return `${x},${y}`
    }).join(' ')
  }

  return (
    <div className="relative flex flex-col items-center">
      <svg width={size} height={size} className="overflow-visible">
        {[0.2, 0.4, 0.6, 0.8, 1].map((scale) => (
          <polygon
            key={scale}
            points={getPoints(labels.map(() => 100), scale)}
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
            <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="var(--brand-gray-100)" strokeWidth="1" />
          )
        })}

        <polygon points={getPoints(data)} fill={color + '20'} stroke={color} strokeWidth="2.5" />

        {labels.map((label, i) => {
          const angle = i * angleStep - Math.PI / 2
          const offset = size > 300 ? 35 : 22
          const x = center + (maxRadius + offset) * Math.cos(angle)
          const y = center + (maxRadius + offset/2) * Math.sin(angle)
          return (
            <text
              key={i}
              x={x}
              y={y}
              fontSize={size > 300 ? "11" : "10"}
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

/* ── Activity Tracker (Heatmap) ──────────────────────────────────── */
function ActivityTracker({ data }: { data: ActivityHeatmapPoint[] }) {
  const colors = ['bg-slate-100', 'bg-blue-100', 'bg-blue-300', 'bg-blue-500', 'bg-blue-600']
  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-7 gap-2.5 self-center">
        {data.map((item, i) => {
          const level = Math.max(0, Math.min(colors.length - 1, Math.round(item.level)))
          return <div key={i} className={`h-[18px] w-[18px] rounded-[4px] ${colors[level]} transition-all hover:scale-125 cursor-pointer`} />
        })}
      </div>
      <div className="mt-6 flex items-center justify-center gap-4">
        <span className="text-[9px] font-bold text-[var(--brand-gray-400)] uppercase tracking-wider">Menos</span>
        <div className="flex gap-1">
          {colors.map((c, i) => <div key={i} className={`h-2 w-2 rounded-[1px] ${c}`} />)}
        </div>
        <span className="text-[9px] font-bold text-[var(--brand-gray-400)] uppercase tracking-wider">Más</span>
      </div>
    </div>
  )
}

/** Flecha de tendencia (definida fuera del render para no recrearla en cada render). */
function TrendArrow({ value, inverted = false, suffix = '%' }: { value: number; inverted?: boolean; suffix?: string }) {
  const isPositive = inverted ? value < 0 : value > 0
  if (value === 0 || !Number.isFinite(value)) {
    return <span className="inline-flex items-center text-[10px] font-bold text-[var(--brand-gray-400)]">= 0{suffix}</span>
  }
  return (
    <span className={`inline-flex items-center text-[10px] font-bold ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
      {isPositive ? '▲' : '▼'} {Math.abs(value)}{suffix}
    </span>
  )
}

export function ProgressDashboard({ sessions, consistencyData, consistencyStreakDays }: ProgressDashboardProps) {
  const [animatedValues, setAnimatedValues] = useState({ precision: 0, errors: 0, listen: 0 })

  const attempts = sessions.flatMap((session) => session.simulations)
  const latestAttempts = sessions
    .map((session) => session.simulations[session.simulations.length - 1])
    .filter((attempt): attempt is NonNullable<typeof attempt> => Boolean(attempt))

  const totalSessions = latestAttempts.length
  const precisionBase = totalSessions > 0 ? totalSessions : 1
  const attemptsBase = attempts.length > 0 ? attempts.length : 1
  const avgPrecision = Math.round(latestAttempts.reduce((a, attempt) => a + attempt.metrics.score, 0) / precisionBase)
  const avgErrors = +(
    latestAttempts.reduce((a, attempt) => a + attempt.metrics.errors, 0) / precisionBase
  ).toFixed(1)
  const avgListenRatio = Math.round(
    attempts.reduce((a, attempt) => a + attempt.analysis.voice.talkListenRatio.listen, 0) / attemptsBase,
  )

  const latestScores = latestAttempts.map((attempt) => attempt.metrics.score)
  const recentSlice = latestScores.slice(0, 3)
  const prevSlice = latestScores.slice(3, 6)
  const recent3Avg =
    recentSlice.length > 0
      ? Math.round(recentSlice.reduce((a, value) => a + value, 0) / recentSlice.length)
      : 0
  const prev3Avg =
    prevSlice.length > 0 ? Math.round(prevSlice.reduce((a, value) => a + value, 0) / prevSlice.length) : 0
  const precisionTrend = recent3Avg - prev3Avg
  const precisionTrendPercent = prev3Avg > 0 ? Math.round((precisionTrend / prev3Avg) * 100) : 0

  const latestErrors = latestAttempts.map((attempt) => attempt.metrics.errors)
  const recentErrorsSlice = latestErrors.slice(0, 3)
  const prevErrorsSlice = latestErrors.slice(3, 6)
  const recentErrorsAvg =
    recentErrorsSlice.length > 0
      ? recentErrorsSlice.reduce((acc, value) => acc + value, 0) / recentErrorsSlice.length
      : 0
  const prevErrorsAvg =
    prevErrorsSlice.length > 0
      ? prevErrorsSlice.reduce((acc, value) => acc + value, 0) / prevErrorsSlice.length
      : 0
  const errorsTrendDelta = +(recentErrorsAvg - prevErrorsAvg).toFixed(1)

  const sparklineData = latestScores.length > 0 ? [...latestScores].reverse() : [0, 0]
  const fallbackSkillLabels = ['Prospección', 'Descubrimiento', 'Demo', 'Objeciones', 'Cierre Venta']
  const skillLabels = attempts[0]?.analysis.skills.labels ?? fallbackSkillLabels
  const skillValues = skillLabels.map((_, idx) => {
    if (attempts.length === 0) return 0
    const total = attempts.reduce((acc, attempt) => acc + (attempt.analysis.skills.values[idx] ?? 0), 0)
    return Math.round(total / attempts.length)
  })
  const bestSkillIndex = skillValues.indexOf(Math.max(...skillValues))
  const weakestSkillIndex = skillValues.indexOf(Math.min(...skillValues))
  const bestSkill = skillLabels[bestSkillIndex]
  const weakestSkill = skillLabels[weakestSkillIndex]
  const bestSkillScore = skillValues[bestSkillIndex]
  const weakestSkillScore = skillValues[weakestSkillIndex]
  const avgSuccessRate =
    attempts.length > 0
      ? (
          attempts.reduce((acc, attempt) => acc + attempt.analysis.skills.averageSuccessRate, 0) /
          attempts.length
        ).toFixed(1)
      : '0.0'
  const attemptDates = attempts
    .map((attempt) => new Date(attempt.createdAt))
    .filter((date) => !Number.isNaN(date.getTime()))
  const realConsistency = buildConsistencyFromAttempts(attemptDates)
  const normalizedConsistencyData = (consistencyData && consistencyData.length > 0 ? consistencyData : realConsistency.data)
    .slice(-28)
    .map((point, index) => ({
      level: Math.max(0, Math.min(4, Math.round(point.level))),
      date: point.date || `Dia ${index + 1}`,
    }))
  const streakDays = consistencyStreakDays ?? realConsistency.streakDays
  const streakLabel = `${streakDays} ${streakDays === 1 ? 'DIA' : 'DIAS'} RACHA`

  useEffect(() => {
    let start: number
    const duration = 900
    const step = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 4)
      setAnimatedValues({
        precision: Math.round(ease * avgPrecision),
        errors: +(ease * avgErrors).toFixed(1),
        listen: Math.round(ease * avgListenRatio),
      })
      if (p < 1) requestAnimationFrame(step)
    }
    const frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [avgPrecision, avgErrors, avgListenRatio])

  return (
    <section className="flex flex-1 overflow-auto bg-[var(--brand-light-50)] p-6 justify-center">
      <div className="w-full max-w-5xl pt-2 flex flex-col setup-reveal">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="typo-page-title font-bold text-[var(--brand-ink-900)]">Tu Progreso</h1>
            <p className="mt-2 typo-body text-[var(--brand-gray-600)]">
              Análisis estratégico de tus últimas {totalSessions} sesiones.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-5 lg:flex-1 lg:min-h-0">
          
          {/* Left Column: Domain Mastery */}
          <div className="col-span-12 lg:col-span-7 h-auto lg:h-full flex flex-col lg:min-h-0">
            <div className="h-auto lg:h-full rounded-2xl border border-[var(--brand-gray-200)] bg-white p-6 shadow-sm flex flex-col">
              <div className="mb-4">
                <h3 className="typo-body font-bold text-[var(--brand-ink-900)]">Dominio de Habilidades</h3>
                <p className="text-[11px] text-[var(--brand-gray-500)] mt-0.5">Basado en tus interacciones con prospectos</p>
              </div>
              <div className="flex flex-col items-center justify-center gap-7 py-2">
                <div className="w-full flex justify-center sm:hidden">
                  <RadarChart
                    data={skillValues}
                    labels={skillLabels}
                    color="#8b5cf6"
                    size={260}
                  />
                </div>
                <div className="hidden w-full justify-center sm:flex">
                  <RadarChart
                    data={skillValues}
                    labels={skillLabels}
                    color="#8b5cf6"
                    size={330}
                  />
                </div>

                <div className="w-full max-w-[700px] grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="rounded-lg bg-[var(--brand-light-50)] px-3 py-2">
                    <p className="text-[10px] font-semibold text-[var(--brand-gray-500)] uppercase tracking-[0.14em]">Mejor habilidad</p>
                    <p className="mt-1 text-[19px] font-extrabold text-violet-600 leading-none tracking-[-0.01em]">{bestSkill}</p>
                    <p className="mt-0.5 text-[11px] font-semibold text-violet-500">{bestSkillScore}%</p>
                  </div>
                  <div className="rounded-lg bg-[var(--brand-light-50)] px-3 py-2">
                    <p className="text-[10px] font-semibold text-[var(--brand-gray-500)] uppercase tracking-[0.14em]">Por mejorar</p>
                    <p className="mt-1 text-[19px] font-extrabold text-red-500 leading-none tracking-[-0.01em]">{weakestSkill}</p>
                    <p className="mt-0.5 text-[11px] font-semibold text-red-400">{weakestSkillScore}%</p>
                  </div>
                  <div className="rounded-lg bg-[var(--brand-light-50)] px-3 py-2">
                    <p className="text-[10px] font-semibold text-[var(--brand-gray-500)] uppercase tracking-[0.14em]">Ratio de éxito</p>
                    <p className="mt-1 text-[19px] font-extrabold text-[var(--brand-ink-800)] leading-none tracking-[-0.01em]">{avgSuccessRate}%</p>
                    <p className="mt-0.5 text-[11px] font-semibold text-[var(--brand-gray-500)]">promedio</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: KPIs & Trends */}
          <div className="col-span-12 lg:col-span-5 h-auto lg:h-full flex flex-col gap-5 lg:min-h-0">
            
            {/* 2 KPI Cards - HORIZONTAL ROW */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[var(--brand-gray-200)] bg-white p-3.5 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center gap-2 text-[var(--brand-gray-500)] mb-3">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-500">
                    <Clock className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-widest">PRECISIÓN</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-[var(--brand-ink-900)] leading-none tabular-nums">{animatedValues.precision}</span>
                  <span className="text-sm font-bold text-[var(--brand-gray-400)]">/ 100</span>
                  <div className="ml-auto flex items-center gap-1 text-emerald-600 font-bold text-xs bg-emerald-50 px-1.5 py-0.5 rounded-md">
                    <TrendArrow value={precisionTrendPercent} />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[var(--brand-gray-200)] bg-white p-3.5 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center gap-2 text-[var(--brand-gray-500)] mb-3">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-red-50 text-red-500">
                    <Activity className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-widest">ERRORES</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-[var(--brand-ink-900)] leading-none tabular-nums">{animatedValues.errors}</span>
                  <span className="text-sm font-bold text-[var(--brand-gray-400)]">/ sesión</span>
                  <div className="ml-auto flex items-center gap-1 text-red-600 font-bold text-xs bg-red-50 px-1.5 py-0.5 rounded-md">
                    <TrendArrow value={errorsTrendDelta} inverted suffix="" />
                  </div>
                </div>
              </div>
            </div>

            {/* Evolución de Precisión */}
            <div className="flex-1 rounded-2xl border border-[var(--brand-gray-200)] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-[var(--brand-ink-900)]">Evolución de Precisión</h3>
                <span className="text-[11px] font-bold text-[var(--brand-blue-600)] bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">Tendencia</span>
              </div>
              <Sparkline data={sparklineData} color="#3B82F6" height={100} />
              <div className="flex justify-between mt-3 px-0.5">
                <span className="text-[9px] font-medium text-[var(--brand-gray-400)] uppercase tracking-tight">Hace 2 sem.</span>
                <span className="text-[9px] font-medium text-[var(--brand-gray-400)] uppercase tracking-tight">Hoy</span>
              </div>
            </div>

            {/* Consistency Heatmap Card */}
            <div className="flex-1 rounded-2xl border border-[var(--brand-gray-200)] bg-white p-5 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-bold text-[var(--brand-ink-900)]">Consistencia</h3>
                <span className="text-[11px] font-bold text-[var(--brand-blue-600)] bg-blue-50 px-2 py-0.5 rounded tracking-wider">{streakLabel}</span>
              </div>
              <ActivityTracker data={normalizedConsistencyData} />
              <p className="text-[10px] text-[var(--brand-gray-400)] mt-4 text-center uppercase tracking-widest">Actividad: Últimas 4 semanas</p>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
