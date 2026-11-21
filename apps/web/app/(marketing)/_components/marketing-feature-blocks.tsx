import { Zap, BarChart2, Users, ArrowRight } from "lucide-react"
import { ScrollReveal } from "./scroll-reveal"
import Link from "next/link"
import { routes } from "@/lib/routes"

/* ── Marketing Radar Chart (Based on app's RadarChart) ───────────────── */
function MarketingRadarChart({ data, labels, color, size = 220 }: { data: number[]; labels: string[]; color: string; size?: number }) {
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

export function FeatureSimulation() {
  return (
    <section id="simulaciones" className="mx-auto w-full max-w-6xl px-6 py-20">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <ScrollReveal direction="left" duration={800}>
          <div className="flex flex-col items-start">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-blue-50)] text-[var(--brand-blue-600)]">
              <Zap className="h-5 w-5" />
            </div>
            <h2 className="typo-page-title tracking-tight text-[var(--brand-ink-900)] font-semibold">Simulaciones hiper-realistas en tiempo real</h2>
            <p className="typo-body-lg mt-4 text-[var(--brand-gray-600)]">
              Practica conversaciones difíciles antes de la llamada importante. Nuestra IA se adapta a tu industria, simulando clientes reales con emociones, dudas y resistencia auténtica.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                "Llamadas interactivas usando voz",
                "Coaching táctico en vivo mientras hablas",
                "Cientos de configuraciones y perfiles personalizables"
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-medium text-[var(--brand-ink-800)]">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--brand-mist-200)] text-[var(--brand-blue-700)]">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </ScrollReveal>

        {/* UI Mockup using app's stage styling */}
        <ScrollReveal direction="right" duration={900} delay={200}>
          <div className="relative flex h-[460px] w-full flex-col items-center justify-center overflow-hidden rounded-3xl border border-[var(--brand-gray-100)] bg-[var(--brand-light-50)] shadow-sm">
             <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,1)_0%,rgba(244,249,255,0.7)_100%)]" />
             
             <div className="relative z-10 flex flex-col items-center justify-center">
               <div className="mb-8 flex flex-col items-center text-center">
                 <h3 className="text-2xl font-semibold tracking-tight text-[var(--brand-ink-900)]">Santiago Herrera</h3>
                 <span className="mt-2 text-xs font-bold uppercase tracking-widest text-[var(--brand-blue-700)] bg-[var(--brand-mist-200)] px-3 py-1 rounded-full">VP de Finanzas</span>
               </div>

               {/* Orb */}
               <div className="relative flex items-center justify-center h-[160px] w-[160px]">
                  <div className="absolute rounded-full border border-[var(--brand-blue-300)]/40 w-[240px] h-[240px] sim-talk-ring-active" />
                  <div className="absolute rounded-full border border-[var(--brand-blue-300)]/40 w-[200px] h-[200px] sim-talk-ring-active" style={{animationDelay: '0.2s'}} />
                  
                  <div className="relative z-10 flex h-[140px] w-[140px] items-center justify-center rounded-full bg-gradient-to-b from-[var(--brand-blue-400)] via-[var(--brand-blue-500)] to-[var(--brand-blue-700)] shadow-[0_16px_40px_rgba(0,87,255,0.25)]">
                    <div className="pointer-events-none flex items-end gap-1 h-[24px]">
                      <span className="w-1 h-2 bg-white/90 rounded-full" />
                      <span className="w-1 h-4 bg-white/90 rounded-full" />
                      <span className="w-1 h-6 bg-white/90 rounded-full" />
                      <span className="w-1 h-4 bg-white/90 rounded-full" />
                      <span className="w-1 h-2 bg-white/90 rounded-full" />
                    </div>
                  </div>
               </div>
             </div>

             {/* Coach Card Mockup */}
             <div className="absolute bottom-6 mx-auto w-[90%] rounded-2xl border border-[var(--brand-blue-100)] bg-white/90 px-4 py-3 shadow-[0_10px_24px_rgba(0,87,255,0.08)] backdrop-blur-md">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-blue-700)]">IA Coach en vivo</span>
                <p className="mt-1 text-sm font-medium text-[var(--brand-gray-700)]">No intentes justificar el precio aún. Pregunta qué impacto tendría no resolver el problema hoy mismo.</p>
             </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

export function FeatureAnalytics() {
  return (
    <section id="analiticas" className="bg-white py-20 border-y border-[var(--brand-gray-100)]">
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          
          {/* UI Mockup using app's dashboard styling */}
          <ScrollReveal direction="left" duration={900} delay={200} className="order-2 lg:order-1">
            <div className="relative rounded-3xl border border-[var(--brand-gray-100)] bg-[var(--brand-light-50)] p-6 shadow-sm">
              <div className="rounded-2xl border border-[var(--brand-gray-200)] bg-white p-6 shadow-sm flex flex-col items-center">
                  <div className="mb-4 w-full text-left">
                    <h3 className="typo-body font-bold text-[var(--brand-ink-900)]">Dominio de Habilidades</h3>
                    <p className="text-[11px] text-[var(--brand-gray-500)] mt-0.5">Basado en tus conversaciones de práctica</p>
                  </div>
                  <MarketingRadarChart 
                    data={[85, 90, 75, 88, 60]} 
                    labels={['Prospección', 'Descubrimiento', 'Demo', 'Objeciones', 'Cierre Venta']} 
                    color="#0057ff" 
                    size={260} 
                  />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                 <div className="rounded-xl border border-[var(--brand-gray-200)] bg-white p-4 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-gray-500)] mb-1">Métricas clave</p>
                    <p className="text-2xl font-extrabold text-[var(--brand-ink-900)]">84%</p>
                    <p className="text-xs text-[var(--brand-gray-500)] mt-1">Precisión de guión</p>
                 </div>
                 <div className="rounded-xl border border-[var(--brand-gray-200)] bg-white p-4 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-gray-500)] mb-1">Tendencia</p>
                    <p className="text-2xl font-extrabold text-[#10b981]">+12%</p>
                    <p className="text-xs text-[var(--brand-gray-500)] mt-1">Mejora en Cierre</p>
                 </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right" duration={800} className="order-1 lg:order-2">
            <div className="flex flex-col items-start lg:pl-8">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-mist-100)] text-[var(--brand-blue-600)]">
                <BarChart2 className="h-5 w-5" />
              </div>
              <h2 className="typo-page-title tracking-tight text-[var(--brand-ink-900)] font-semibold">Cada práctica se convierte en datos claros</h2>
              <p className="typo-body-lg mt-4 text-[var(--brand-gray-600)]">
                Tus paneles analizan más de 40 variables por sesión, desde cuánto escuchas vs cuánto hablas hasta tu capacidad para responder objeciones. Visualiza claramente tus fortalezas y debilidades.
              </p>
              <Link href={routes.login} className="mt-8 group flex items-center gap-2 text-sm font-semibold text-[var(--brand-blue-600)] hover:text-[var(--brand-blue-700)]">
                Explorar métricas de Closer <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </ScrollReveal>

        </div>
      </div>
    </section>
  )
}

export function FeatureProfiles() {
  return (
    <section id="perfiles" className="mx-auto w-full max-w-6xl px-6 py-20">
      <ScrollReveal direction="up" duration={700}>
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-light-200)] text-[var(--brand-ink-800)]">
            <Users className="h-5 w-5" />
          </div>
          <h2 className="typo-hero-title tracking-tight text-[var(--brand-ink-900)] text-[2.5rem] font-semibold">Perfiles infinitos, escenarios reales</h2>
          <p className="typo-body-lg mt-4 max-w-2xl text-[var(--brand-gray-600)]">
            Crea perfiles que replican exactamente a tu cliente ideal o selecciona desde nuestra biblioteca de personajes. Configura desde la personalidad hasta el nivel de dificultad.
          </p>
        </div>
      </ScrollReveal>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { rol: 'Director Financiero', objecion: 'No hay presupuesto', dif: 'Alta', col: 'bg-red-50 text-red-700 border-red-100', icon: '🏦' },
          { rol: 'Jefe de Tecnología', objecion: 'Complejidad de integración', dif: 'Media', col: 'bg-blue-50 text-blue-700 border-blue-100', icon: '💻' },
          { rol: 'Director Comercial', objecion: 'No se ve el retorno claro', dif: 'Avanzada', col: 'bg-violet-50 text-violet-700 border-violet-100', icon: '📈' }
        ].map((profile, i) => (
          <ScrollReveal key={i} direction="up" delay={i * 150} duration={650}>
            <div className="rounded-2xl border border-[var(--brand-gray-200)] bg-white p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-[var(--brand-light-50)] text-2xl flex items-center justify-center border border-[var(--brand-gray-100)] mb-4 shadow-sm">
                 {profile.icon}
              </div>
              <h3 className="text-lg font-bold text-[var(--brand-ink-900)]">{profile.rol}</h3>
              <p className="mt-2 text-sm text-[var(--brand-gray-500)] line-clamp-2">Desafío principal: <span className="font-semibold">{profile.objecion}</span></p>
              <div className="mt-5 border-t border-[var(--brand-gray-100)] pt-4 flex items-center justify-between">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-gray-500)]">Dificultad</span>
                 <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border ${profile.col}`}>{profile.dif}</span>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  )
}

export function MarketingCTA() {
  return (
    <section className="border-t border-[var(--brand-gray-100)] py-20 bg-[var(--brand-ink-900)] text-center relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(0,87,255,0.4)_0%,rgba(10,10,10,1)_70%)]" />
      <ScrollReveal direction="up" duration={800} className="relative z-10">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white mb-6">El entrenamiento nunca había sido tan ágil.</h2>
          <p className="text-lg text-[var(--brand-gray-400)] mb-10">
            Únete a miles de vendedores que redujeron su tiempo de preparación y mejoraron sus resultados semana a semana con Closer.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={routes.login} className="flex items-center justify-center rounded-lg bg-[var(--brand-blue-500)] px-8 py-4 text-sm font-semibold text-white shadow-lg hover:bg-[var(--brand-blue-600)] hover:-translate-y-0.5 transition-all w-full sm:w-auto">
              Comenzar mi primera simulación
            </Link>
            <Link href={routes.signup} className="flex items-center justify-center rounded-lg border border-white/20 bg-white/5 px-8 py-4 text-sm font-semibold text-white shadow-lg hover:bg-white/10 hover:-translate-y-0.5 transition-all w-full sm:w-auto">
               Registrarse gratis
            </Link>
          </div>
        </div>
      </ScrollReveal>
    </section>
  )
}
