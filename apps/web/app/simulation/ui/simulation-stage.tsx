import type { ConnectionStatus } from '@/mocks/live-audio'
import { SIMULATION_COPY } from '../config/simulation-config'
import type { SimulationProspect } from '../types/simulation-types'

type SimulationStageProps = {
  prospect: SimulationProspect
  connectionStatus: ConnectionStatus
  modelAudioLevel: number
  userAudioLevel?: number
  errorMessage?: string | null
  showCoachCard?: boolean
  coachSuggestion: string
  suggestionCount?: number
  currentSuggestionIndex?: number
  isCoachThinking?: boolean
  onCloseCoachCard?: () => void
  onPrevSuggestion?: () => void
  onNextSuggestion?: () => void
}

export function SimulationStage({
  prospect,
  connectionStatus,
  modelAudioLevel,
  userAudioLevel = 0,
  errorMessage,
  showCoachCard = false,
  coachSuggestion,
  suggestionCount = 0,
  currentSuggestionIndex = 0,
  isCoachThinking = false,
  onCloseCoachCard,
  onPrevSuggestion,
  onNextSuggestion,
}: SimulationStageProps) {
  const isConnecting = connectionStatus === 'connecting'
  const isConnected = connectionStatus === 'connected'
  const voiceEnergy = isConnected ? Math.min(1, Math.max(0, (modelAudioLevel - 0.012) / 0.3)) : 0
  const isModelSpeaking = isConnected && voiceEnergy > 0.02
  const userVoiceEnergy = isConnected ? Math.min(1, Math.max(0, (userAudioLevel - 0.012) / 0.3)) : 0
  const isUserSpeaking = isConnected && userVoiceEnergy > 0.02

  // Keep orb size fixed. Voice activity is represented by external waves only.
  const glowOpacity = isConnected ? 0.16 : 0.12
  const ringPulseDuration = `${Math.max(1.05, 1.7 - voiceEnergy * 0.6)}s`
  const barDuration = `${Math.max(0.45, 0.88 - voiceEnergy * 0.32)}s`
  const trimmedSuggestion = (coachSuggestion || '').trim()
  const isLongSuggestion = trimmedSuggestion.length > 220

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,1)_0%,rgba(244,249,255,0.7)_100%)]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-[100%] bg-[var(--brand-mist-200)] opacity-40 blur-[80px]" />

      <div className="relative z-10 flex flex-col items-center justify-center gap-1">
        {/* Prospect identity */}
        <div className="flex flex-col items-center text-center">
          <h1 className="typo-page-title text-[2.25rem] font-semibold tracking-tight text-[var(--brand-ink-900)]">
            {prospect.name}
          </h1>
          <div className="mt-2 flex items-center gap-2">
            {prospect.role ? (
              <span className="typo-label rounded-full bg-[var(--brand-mist-200)] px-3 py-1 font-semibold text-[var(--brand-blue-700)]">
                {prospect.role}
              </span>
            ) : null}
            {prospect.company ? (
              <span className="typo-body font-medium text-[var(--brand-gray-500)]">
                en {prospect.company}
              </span>
            ) : null}
          </div>
        </div>

        {/* AI orb */}
        <div className="relative flex h-[360px] w-[360px] items-center justify-center">
        {/* Deep halo + concentric rings inspired by top voice assistant UIs. */}
        <div
          className="pointer-events-none absolute h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle,rgba(0,87,255,0.18)_0%,rgba(0,87,255,0.08)_42%,rgba(0,87,255,0)_76%)] blur-[26px] transition-all duration-200"
          style={{ opacity: isConnected ? 0.22 + voiceEnergy * 0.42 : 0 }}
        />
        {[196, 224, 252, 280].map((size, index) => (
          <span
            key={size}
            className={`pointer-events-none absolute rounded-full border border-[var(--brand-blue-300)]/40 ${isModelSpeaking ? 'sim-talk-ring-active' : 'sim-talk-ring-idle'}`}
            style={{
              width: `${size}px`,
              height: `${size}px`,
              opacity: isConnected ? 0.08 + voiceEnergy * (0.28 - index * 0.04) : 0,
              animationDuration: ringPulseDuration,
              animationDelay: `${index * 0.14}s`,
            }}
          />
        ))}

        {/* User input rings — golden/amber color when user speaks */}
        {[160, 188, 216, 244].map((size, index) => (
          <span
            key={`user-${size}`}
            className={`pointer-events-none absolute rounded-full border border-[#d4a545]/40 ${isUserSpeaking ? 'sim-talk-ring-active' : 'sim-talk-ring-idle'}`}
            style={{
              width: `${size}px`,
              height: `${size}px`,
              opacity: isConnected ? 0.08 + userVoiceEnergy * (0.28 - index * 0.04) : 0,
              animationDuration: barDuration,
              animationDelay: `${index * 0.14}s`,
            }}
          />
        ))}

        {/* Glow ring behind orb — pulses with model audio */}
        <div
          className="absolute rounded-full bg-[var(--brand-blue-400)] blur-[40px] transition-all duration-150"
          style={{
            width: '168px',
            height: '168px',
            opacity: glowOpacity,
          }}
        />

        {/* Main orb */}
        <div
          className="relative z-10 flex items-center justify-center rounded-full bg-gradient-to-b from-[var(--brand-blue-400)] via-[var(--brand-blue-500)] to-[var(--brand-blue-700)] shadow-[0_16px_40px_rgba(0,87,255,0.25)]"
          style={{
            width: '160px',
            height: '160px',
            transform: 'scale(1)',
          }}
        >
          <div
            className="pointer-events-none absolute inset-[10px] rounded-full border border-white/16"
            style={{ opacity: isConnected ? 0.32 + voiceEnergy * 0.3 : 0.18 }}
          />
          {isConnecting ? (
            // Connecting spinner
            <svg
              className="h-8 w-8 animate-spin text-white/80"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : (
            <div className="pointer-events-none flex h-[16px] items-end gap-[3px]">
              {[0.36, 0.55, 0.72, 0.94, 0.72, 0.55, 0.36].map((w, index) => (
                <span
                  key={index}
                  className={`w-[3px] rounded-full ${isModelSpeaking ? 'sim-voice-bar-speaking' : ''}`}
                  style={{
                    height: `${4 + voiceEnergy * 12 * w}px`,
                    opacity: isConnected ? 0.48 + voiceEnergy * 0.5 : 0.3,
                    background: 'rgba(255,255,255,0.92)',
                    animationDuration: barDuration,
                    animationDelay: `${index * 0.08}s`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Status / helper text */}
      <div className="absolute bottom-2 z-10 w-full px-6 text-center">
        {errorMessage ? (
          <p className="typo-body mx-auto max-w-[340px] text-red-500">{errorMessage}</p>
        ) : isConnecting ? (
          <p className="typo-body mx-auto max-w-[340px] text-[var(--brand-gray-500)]">
            Conectando con el prospecto...
          </p>
        ) : showCoachCard ? (
          <section className="mx-auto w-full max-w-[640px] rounded-2xl border border-[var(--brand-blue-100)] bg-white/85 px-4 py-3 text-left shadow-[0_10px_24px_rgba(0,87,255,0.08)] backdrop-blur-sm">
            <header className="mb-2 flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1 text-left">
                <span className="typo-caption font-bold uppercase tracking-[0.14em] text-[var(--brand-blue-700)]">
                  Consejo
                </span>
                {isCoachThinking ? (
                  <span className="typo-caption text-[var(--brand-gray-500)]">Analizando...</span>
                ) : (
                  <span className="typo-caption text-[var(--brand-gray-400)]">{currentSuggestionIndex + 1} de {suggestionCount}</span>
                )}
              </div>

              <button
                type="button"
                onClick={onCloseCoachCard}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--brand-blue-100)] text-[var(--brand-gray-500)] transition-colors hover:bg-[var(--brand-light-200)] hover:text-[var(--brand-ink-800)]"
                title="Cerrar consejo"
                aria-label="Cerrar consejo"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </header>

            <div className={`custom-scrollbar pr-1 ${isLongSuggestion ? 'max-h-[120px] overflow-y-auto' : ''}`}>
              <p className="typo-body whitespace-pre-wrap break-words text-[var(--brand-gray-700)]">
                {trimmedSuggestion || SIMULATION_COPY.helperText}
              </p>
            </div>

            {isLongSuggestion ? (
              <p className="typo-caption mt-2 text-[var(--brand-gray-500)]">
                Consejo extenso: desplaza para ver todo el contenido.
              </p>
            ) : null}

            {suggestionCount > 1 && !isCoachThinking ? (
              <footer className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--brand-blue-100)] pt-2">
                <button
                  type="button"
                  onClick={onPrevSuggestion}
                  disabled={currentSuggestionIndex === 0}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--brand-blue-200)] text-[var(--brand-blue-600)] transition-colors disabled:border-[var(--brand-gray-200)] disabled:text-[var(--brand-gray-400)] hover:bg-[var(--brand-light-100)] disabled:hover:bg-transparent"
                  title="Consejo anterior"
                  aria-label="Consejo anterior"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="typo-caption text-[var(--brand-gray-500)]">
                  {currentSuggestionIndex + 1} de {suggestionCount}
                </span>
                <button
                  type="button"
                  onClick={onNextSuggestion}
                  disabled={currentSuggestionIndex === suggestionCount - 1}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--brand-blue-200)] text-[var(--brand-blue-600)] transition-colors disabled:border-[var(--brand-gray-200)] disabled:text-[var(--brand-gray-400)] hover:bg-[var(--brand-light-100)] disabled:hover:bg-transparent"
                  title="Siguiente consejo"
                  aria-label="Siguiente consejo"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </footer>
            ) : null}
          </section>
        ) : null}
      </div>
    </main>
  )
}
