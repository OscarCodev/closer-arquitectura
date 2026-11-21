import type { MutableRefObject } from 'react'
import type { AdvancedOptionCopy, AdvancedTab, SavedProfile } from '../types/setup-types'
import { AdvancedOptionsGrid } from './advanced-options-grid'
import { MAX_PRACTICE_FIELD_CHARS } from '@/lib/validation/practice-input'

type SetupPracticeTabProps = {
  context: string
  prospect: string
  savedProfiles: SavedProfile[]
  profileSelectorOpen: boolean
  advancedOpen: boolean
  advancedTab: AdvancedTab
  advancedPreviewCopy: AdvancedOptionCopy
  activePreviewOption: string
  autofillStatus: 'idle' | 'loading' | 'success' | 'error'
  autofillMessage?: string
  isFormValid: boolean
  profileSelectorRef: MutableRefObject<HTMLDivElement | null>
  advancedPanelRef: MutableRefObject<HTMLDivElement | null>
  advancedSelections: Record<AdvancedTab, string>
  onContextChange: (value: string) => void
  onProspectChange: (value: string) => void
  onToggleProfileSelector: () => void
  onSelectProfile: (profile: SavedProfile) => void
  onToggleAdvanced: () => void
  onCloseAdvanced: () => void
  onSetAdvancedTab: (tab: AdvancedTab) => void
  onAdvancedSelect: (tab: AdvancedTab, option: string) => void
  onAdvancedPreview: (preview: { tab: AdvancedTab; option: string } | null) => void
  onApplyAutofill: () => void
  onStartPractice: () => void
  errorMessage?: string | null
}

export function SetupPracticeTab({
  context,
  prospect,
  savedProfiles,
  profileSelectorOpen,
  advancedOpen,
  advancedTab,
  advancedPreviewCopy,
  activePreviewOption,
  autofillStatus,
  autofillMessage,
  isFormValid,
  profileSelectorRef,
  advancedPanelRef,
  advancedSelections,
  onContextChange,
  onProspectChange,
  onToggleProfileSelector,
  onSelectProfile,
  onToggleAdvanced,
  onCloseAdvanced,
  onSetAdvancedTab,
  onAdvancedSelect,
  onAdvancedPreview,
  onApplyAutofill,
  onStartPractice,
  errorMessage,
}: SetupPracticeTabProps) {
  return (
    <section className="flex flex-1 items-center justify-center overflow-auto px-4 py-8 md:px-6">
      <div className="setup-reveal w-full max-w-[460px]">
        <header className="setup-reveal setup-reveal-delay-1 mb-5 text-center">
          <p className="typo-micro font-semibold tracking-[0.14em] uppercase text-[var(--brand-gray-500)]">
            Sesión de entrenamiento IA
          </p>
          <h1 className="typo-page-title mt-2 font-semibold text-[var(--brand-ink-900)]">
            Preparación de venta
          </h1>
        </header>

        <div className="setup-reveal setup-reveal-delay-2 grid gap-3">
          <div className="flex items-center">
            <label htmlFor="context" className="typo-label font-semibold text-[var(--brand-gray-600)]">
              Contexto
            </label>
            <div className="group relative ml-1.5">
              <button
                type="button"
                aria-label="Más información sobre contexto"
                className="grid h-3.5 w-3.5 place-items-center rounded-full border border-[var(--brand-gray-200)] bg-[var(--brand-light-50)] text-[9px] font-semibold leading-none text-[var(--brand-gray-500)] transition-colors hover:border-[var(--brand-gray-300)] hover:bg-[var(--brand-light-200)] hover:text-[var(--brand-gray-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue-200)]"
              >
                ?
              </button>
              <div
                role="tooltip"
                className="pointer-events-none absolute left-0 top-full z-10 mt-2 w-[280px] rounded-lg border border-[var(--brand-gray-200)] bg-[var(--brand-light-50)] p-3 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
              >
                <p className="typo-caption text-[var(--brand-gray-600)]">
                  Incluye qué ofreces, cuánto cuesta, cuál es tu propuesta de valor y qué resultado buscas en la llamada.
                </p>
              </div>
            </div>
          </div>
          <div className="relative">
            <textarea
              id="context"
              rows={4}
              value={context}
              onChange={(event) => onContextChange(event.target.value)}
              maxLength={MAX_PRACTICE_FIELD_CHARS}
              placeholder="Ej: qué ofreces, precio, propuesta de valor y objetivo de la llamada."
              className="custom-scrollbar typo-input w-full resize-none rounded-xl border border-[var(--brand-gray-200)] bg-[var(--brand-light-50)] px-3 py-3 pr-16 pb-6 text-[var(--brand-ink-800)] outline-none transition-all focus:border-[var(--brand-blue-300)] focus:ring-2 focus:ring-[var(--brand-blue-100)]"
            />
            <p className={`typo-caption absolute bottom-2 right-3 pointer-events-none ${context.length > MAX_PRACTICE_FIELD_CHARS * 0.9 ? 'text-[var(--color-danger-text)]' : 'text-[var(--brand-gray-500)]'}`}>
              {context.length}/{MAX_PRACTICE_FIELD_CHARS}
            </p>
          </div>

          <div className="mt-1 flex items-center justify-between">
            <div className="flex items-center">
              <label htmlFor="prospect" className="typo-label font-semibold text-[var(--brand-gray-600)]">
                Perfil
              </label>
              <div className="group relative ml-1.5">
                <button
                  type="button"
                  aria-label="Más información sobre perfil"
                  className="grid h-3.5 w-3.5 place-items-center rounded-full border border-[var(--brand-gray-200)] bg-[var(--brand-light-50)] text-[9px] font-semibold leading-none text-[var(--brand-gray-500)] transition-colors hover:border-[var(--brand-gray-300)] hover:bg-[var(--brand-light-200)] hover:text-[var(--brand-gray-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue-200)]"
                >
                  ?
                </button>
                <div
                  role="tooltip"
                  className="pointer-events-none absolute left-0 top-full z-10 mt-2 w-[280px] rounded-lg border border-[var(--brand-gray-200)] bg-[var(--brand-light-50)] p-3 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                >
                  <p className="typo-caption text-[var(--brand-gray-600)]">
                    Describe a la persona con quien hablarás: nombre, rol, empresa, retos y objeciones más comunes.
                  </p>
                </div>
              </div>
            </div>
            <div ref={profileSelectorRef} className="relative">
              <button
                type="button"
                onClick={onToggleProfileSelector}
                className="typo-micro inline-flex items-center gap-1 font-semibold text-[var(--brand-blue-600)] hover:text-[var(--brand-blue-700)]"
              >
                Elegir perfil
                <svg
                  viewBox="0 0 24 24"
                  className={`h-3.5 w-3.5 transition-transform ${profileSelectorOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {profileSelectorOpen && (
                <div className="absolute right-0 top-full z-20 mt-2 w-[300px] rounded-xl border border-[var(--brand-gray-200)] bg-[var(--brand-light-50)] p-2 shadow-sm">
                  {savedProfiles.length === 0 ? (
                    <div className="rounded-lg bg-[var(--brand-light-100)] p-3 text-center">
                      <div className="mx-auto mb-2 grid h-8 w-8 place-items-center rounded-full bg-[var(--brand-mist-100)] text-[var(--brand-blue-700)]">
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21V7a2 2 0 0 0-2-2h-3l-2-2H6a2 2 0 0 0-2 2v16" />
                          <path d="M8 21h8" />
                        </svg>
                      </div>
                      <p className="typo-caption text-[var(--brand-gray-600)]">
                        Aquí se almacenarán los perfiles que crees al presionar Iniciar.
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-60 space-y-1 overflow-auto">
                      {savedProfiles.map((profile) => (
                        <button
                          key={profile.id}
                          type="button"
                          onClick={() => onSelectProfile(profile)}
                          className="w-full rounded-lg px-3 py-2 text-left hover:bg-[var(--brand-light-200)]"
                        >
                          <p className="typo-body font-semibold text-[var(--brand-gray-700)]">{profile.name}</p>
                          <p className="typo-caption text-[var(--brand-gray-500)]">{profile.createdAt}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="relative">
            <textarea
              id="prospect"
              rows={3}
              value={prospect}
              onChange={(event) => onProspectChange(event.target.value)}
              maxLength={MAX_PRACTICE_FIELD_CHARS}
              placeholder="Ej: nombre, rol, empresa, retos y objeciones principales."
              className="custom-scrollbar typo-input w-full resize-none rounded-xl border border-[var(--brand-gray-200)] bg-[var(--brand-light-50)] px-3 py-3 pr-16 pb-6 text-[var(--brand-ink-800)] outline-none transition-all focus:border-[var(--brand-blue-300)] focus:ring-2 focus:ring-[var(--brand-blue-100)]"
            />
            <p className={`typo-caption absolute bottom-2 right-3 pointer-events-none ${prospect.length > MAX_PRACTICE_FIELD_CHARS * 0.9 ? 'text-[var(--color-danger-text)]' : 'text-[var(--brand-gray-500)]'}`}>
              {prospect.length}/{MAX_PRACTICE_FIELD_CHARS}
            </p>
          </div>

          <div className="mt-6 flex w-full items-start justify-between">
            <div className="flex items-start gap-2.5">
              <div ref={advancedPanelRef} className="relative">
                <button
                  type="button"
                  onClick={onToggleAdvanced}
                  aria-expanded={advancedOpen}
                  className={`group flex h-[44px] items-center justify-center rounded-xl px-3 transition-all duration-300 ${
                    advancedOpen
                      ? 'bg-[var(--brand-blue-50)] text-[var(--brand-blue-600)] shadow-[inset_0_0_0_1px_var(--brand-blue-100)]'
                      : 'bg-[var(--brand-light-400)] text-[var(--brand-gray-600)] opacity-85 hover:bg-[var(--brand-light-500)] hover:text-[var(--brand-gray-800)] hover:opacity-100'
                  } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue-200)]`}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="4" y1="6" x2="20" y2="6" />
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <line x1="4" y1="18" x2="20" y2="18" />
                    <circle cx="9" cy="6" r="1.6" />
                    <circle cx="15" cy="12" r="1.6" />
                    <circle cx="11" cy="18" r="1.6" />
                  </svg>
                  {!advancedOpen && (
                    <span className="typo-body pointer-events-none max-w-0 overflow-hidden whitespace-nowrap font-semibold opacity-0 transition-all duration-300 ease-out group-hover:ml-2 group-hover:max-w-[120px] group-hover:opacity-100">
                      Configurar
                    </span>
                  )}
                </button>

                <div
                  aria-hidden={!advancedOpen}
                  className={`absolute bottom-full left-0 z-20 mb-2 w-80 rounded-xl border border-[var(--brand-gray-200)] bg-[var(--brand-light-50)] p-4 shadow-lg transition-all duration-200 ease-out ${
                    advancedOpen
                      ? 'translate-y-0 scale-100 opacity-100'
                      : 'pointer-events-none translate-y-1 scale-[0.98] opacity-0'
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <p className="typo-micro font-semibold tracking-[0.12em] uppercase text-[var(--brand-gray-500)]">
                      Configura tu entrenamiento
                    </p>
                    <button
                      type="button"
                      onClick={onCloseAdvanced}
                      className="text-[var(--brand-gray-400)] hover:text-[var(--brand-gray-600)]"
                      aria-label="Cerrar"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex w-full rounded-lg bg-[var(--brand-gray-100)] p-[3px]">
                      {(['modo', 'tono'] as AdvancedTab[]).map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => onSetAdvancedTab(tab)}
                          className={`typo-micro flex-1 rounded-md py-[7px] text-center font-bold uppercase tracking-[0.1em] transition-all duration-300 ${
                            advancedTab === tab
                              ? 'bg-white text-[var(--brand-blue-700)] shadow-sm'
                              : 'text-[var(--brand-gray-500)] hover:text-[var(--brand-gray-700)]'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    <div className="rounded-lg border border-[var(--brand-blue-100)] bg-[var(--brand-mist-100)] p-3 transition-colors duration-200">
                      <p className="typo-micro font-semibold uppercase tracking-[0.08em] text-[var(--brand-blue-700)]">
                        {advancedTab === 'modo' ? `Modo: ${activePreviewOption}` : `Tono: ${activePreviewOption}`}
                      </p>
                      <p className="typo-caption mt-1 text-[var(--brand-ink-900)]">{advancedPreviewCopy.description}</p>
                      <p className="typo-caption mt-1.5 text-[var(--brand-gray-600)]">{advancedPreviewCopy.impact}</p>
                    </div>

                    <div className="relative min-h-[190px]">
                      <AdvancedOptionsGrid
                        tab="modo"
                        visible={advancedTab === 'modo'}
                        advancedSelections={advancedSelections}
                        onSelect={onAdvancedSelect}
                        onPreview={onAdvancedPreview}
                      />
                      <AdvancedOptionsGrid
                        tab="tono"
                        visible={advancedTab === 'tono'}
                        advancedSelections={advancedSelections}
                        onSelect={onAdvancedSelect}
                        onPreview={onAdvancedPreview}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="group relative">
                {autofillStatus === 'idle' && (
                  <div
                    role="tooltip"
                    className="pointer-events-none absolute bottom-full left-0 z-50 mb-2 w-[280px] -translate-y-1 rounded-lg border border-[var(--brand-gray-200)] bg-[var(--brand-light-50)] p-3 text-center opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
                  >
                    <p className="typo-caption text-[var(--brand-gray-600)]">
                      Utiliza nuestra IA para diseñar una simulación estratégica personalizada según tu industria y objetivos.
                    </p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={onApplyAutofill}
                  disabled={autofillStatus !== 'idle'}
                  aria-label="Autogenerar escenario"
                  title="Autogenerar escenario"
                  className={`flex h-[44px] items-center justify-center rounded-xl px-3 font-semibold transition-all duration-300 ${
                    autofillStatus === 'loading'
                      ? 'w-auto cursor-wait bg-[var(--brand-light-200)] text-[var(--brand-gray-500)]'
                      : autofillStatus === 'success'
                        ? 'w-auto bg-[var(--brand-blue-50)] text-[var(--brand-blue-600)] shadow-[inset_0_0_0_1px_var(--brand-blue-100)]'
                        : 'bg-[var(--brand-light-400)] text-[var(--brand-gray-600)] opacity-85 hover:bg-[var(--brand-light-500)] hover:text-[var(--brand-gray-800)] hover:opacity-100'
                  }`}
                >
                  {autofillStatus === 'loading' ? (
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : autofillStatus === 'success' ? (
                    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 animate-bounce" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2 19.07V22h2.93l16.71-16.64a1.21 1.21 0 0 0 0-1.72Z" />
                      <path d="m14 7 3 3" />
                      <path d="M5 6v4" />
                      <path d="M19 14v4" />
                      <path d="M10 2v2" />
                      <path d="M7 8H3" />
                      <path d="M21 16h-4" />
                    </svg>
                  )}
                  <span
                    className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-out ${
                      autofillStatus !== 'idle'
                        ? 'ml-2 max-w-[120px] opacity-100'
                        : 'max-w-0 opacity-0 group-hover:ml-2 group-hover:max-w-[120px] group-hover:opacity-100'
                    }`}
                  >
                    {autofillStatus === 'loading'
                      ? 'Generando...'
                      : autofillStatus === 'success'
                        ? '¡Listo!'
                        : 'Autogenerar'}
                  </span>
                </button>
              </div>
            </div>

            {autofillStatus === 'error' && autofillMessage ? (
              <p className="typo-caption mt-2 text-[var(--color-danger-text)]">{autofillMessage}</p>
            ) : null}

            {errorMessage ? (
              <p role="alert" className="typo-caption mt-2 text-[var(--color-danger-text)]">
                {errorMessage}
              </p>
            ) : null}

            <button
              type="button"
              onClick={onStartPractice}
              disabled={!isFormValid}
              className={`typo-body flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-blue-500)] px-4 py-2.5 font-semibold text-white shadow-sm transition-all duration-500 ${
                isFormValid
                  ? 'scale-100 opacity-100 shadow-md hover:bg-[var(--brand-blue-600)]'
                  : 'scale-[0.99] cursor-not-allowed opacity-55'
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Iniciar
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
