type SimulationControlsProps = {
  isMicMuted: boolean
  isConnected: boolean
  isRequestingConsejo: boolean
  canRequestConsejo: boolean
  coachDisabledReason?: string
  userAudioLevel?: number
  onToggleMic: () => void
  onRequestConsejo: () => void
  onEndCall: () => void
}

export function SimulationControls({
  isMicMuted,
  isRequestingConsejo,
  canRequestConsejo,
  coachDisabledReason,
  userAudioLevel = 0,
  onToggleMic,
  onRequestConsejo,
  onEndCall,
}: SimulationControlsProps) {
  const isUserSpeaking = !isMicMuted && userAudioLevel > 0.08
  const isCoachButtonDisabled = !canRequestConsejo || isRequestingConsejo
  const coachButtonTitle = coachDisabledReason || 'Pedir consejo'
  return (
    <footer className="relative flex h-24 shrink-0 items-center justify-center border-t border-[var(--color-border)] bg-[var(--brand-light-50)] px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onRequestConsejo}
          disabled={isCoachButtonDisabled}
          className={`flex h-12 w-12 items-center justify-center rounded-full border transition-all ${
            isRequestingConsejo
              ? 'cursor-not-allowed border-[#e9b133] bg-[#ffe08a] text-[#a46300]'
              : isCoachButtonDisabled
                ? 'cursor-not-allowed border-[#f3d7a1] bg-transparent text-[#d7b776]'
                : 'border-[#f4c14f] bg-transparent text-[#a46300] hover:border-[#e9b133] hover:bg-[#ffe08a] hover:shadow-sm active:bg-[#ffe08a]'
          }`}
          title={coachButtonTitle}
        >
          {isRequestingConsejo ? (
            <svg
              className="h-5 w-5 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 12a9 9 0 1 1-9-9" strokeLinecap="round" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              width="20"
              height="20"
            >
              <path d="M9 18h6" />
              <path d="M10 22h4" />
              <path d="M12 2a7 7 0 0 0-4 12.74c.62.43 1 1.12 1 1.87V17h6v-.39c0-.75.38-1.44 1-1.87A7 7 0 0 0 12 2z" />
            </svg>
          )}
        </button>

        <button
          type="button"
          onClick={onToggleMic}
          className={`flex h-14 w-14 items-center justify-center rounded-full border transition-all ${
            isMicMuted
              ? 'border-[var(--brand-blue-300)] bg-[var(--brand-mist-100)] text-[var(--brand-blue-600)]'
              : isUserSpeaking
                ? 'border-[var(--brand-blue-400)] bg-[var(--brand-blue-50)] text-[var(--brand-blue-700)] shadow-[0_0_12px_rgba(0,87,255,0.4)]'
                : 'border-[var(--brand-gray-200)] bg-white text-[var(--brand-gray-600)] hover:bg-[var(--brand-light-200)] hover:text-[var(--brand-ink-900)] hover:shadow-sm'
          }`}
          title={isMicMuted ? 'Activar micrófono' : 'Silenciar micrófono'}
        >
          {isMicMuted ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              width="22"
              height="22"
            >
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
              <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              width="22"
              height="22"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <line x1="12" x2="12" y1="19" y2="22" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            </svg>
          )}
        </button>
        <button
          type="button"
          onClick={onEndCall}
          className="flex h-[60px] w-[60px] items-center justify-center rounded-full border border-[var(--color-danger-border)] bg-[var(--color-danger-text)] text-white shadow-md transition-all hover:scale-105 hover:bg-[#a93226]"
          title="Finalizar llamada"
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="none"
            width="26"
            height="26"
            style={{ transform: 'rotate(135deg)', marginTop: '2px', marginLeft: '-2px' }}
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        </button>
      </div>
    </footer>
  )
}
