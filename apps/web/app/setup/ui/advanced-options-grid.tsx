import { ADVANCED_OPTIONS } from '../config/setup-config'
import type { AdvancedTab } from '../types/setup-types'

type AdvancedOptionsGridProps = {
  tab: AdvancedTab
  visible: boolean
  advancedSelections: Record<AdvancedTab, string>
  onSelect: (tab: AdvancedTab, option: string) => void
  onPreview: (preview: { tab: AdvancedTab; option: string } | null) => void
}

export function AdvancedOptionsGrid({
  tab,
  visible,
  advancedSelections,
  onSelect,
  onPreview,
}: AdvancedOptionsGridProps) {
  return (
    <div
      className={`absolute inset-0 grid auto-rows-min content-start grid-cols-2 gap-2 transition-all duration-200 ease-out ${
        visible
          ? 'translate-x-0 opacity-100'
          : tab === 'modo'
            ? '-translate-x-1 opacity-0 pointer-events-none'
            : 'translate-x-1 opacity-0 pointer-events-none'
      }`}
    >
      {ADVANCED_OPTIONS[tab].map((option) => {
        const isActive = advancedSelections[tab] === option
        const isDefault =
          (tab === 'modo' && option === 'Ciclo Completo') ||
          (tab === 'tono' && option === 'Perfil Real')

        return (
          <div key={option} className="relative">
            {isDefault && (
              <span className="absolute -right-0.5 -top-1.5 z-10 rounded bg-[var(--brand-blue-600)] px-1 py-0 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                Default
              </span>
            )}
            <button
              type="button"
              onMouseEnter={() => onPreview({ tab, option })}
              onMouseLeave={() => onPreview(null)}
              onFocus={() => onPreview({ tab, option })}
              onBlur={() => onPreview(null)}
              onClick={() => onSelect(tab, option)}
              className={`typo-caption h-full w-full rounded-[10px] border px-2 py-2 text-center font-semibold transition-all duration-200 ${
                isActive
                  ? 'border-[var(--brand-blue-300)] bg-white text-[var(--brand-blue-700)] shadow-sm ring-1 ring-[var(--brand-blue-300)]'
                  : 'border-[var(--brand-gray-200)] bg-[var(--brand-light-50)] text-[var(--brand-gray-600)] hover:border-[var(--brand-gray-300)] hover:bg-white hover:text-[var(--brand-gray-800)]'
              }`}
            >
              {option}
            </button>
          </div>
        )
      })}
    </div>
  )
}
