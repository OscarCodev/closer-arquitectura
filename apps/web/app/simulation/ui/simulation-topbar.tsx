import { AppIcon } from '@/components/brand/app-icon'

type SimulationTopbarProps = {
  time: string
}

export function SimulationTopbar({ time }: SimulationTopbarProps) {
  return (
    <header className="flex h-[72px] items-center justify-between border-b border-[var(--color-border)] px-4 md:px-6">
      <div className="flex items-center gap-3">
        <AppIcon size={34} />
        <span className="typo-brand hidden font-bold text-[var(--brand-ink-900)] sm:inline-block">Closer</span>
        <div className="ml-2 flex h-7 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"></span>
          <span className="typo-micro font-semibold uppercase tracking-wider text-emerald-700">En vivo</span>
        </div>
      </div>

      <div className="flex items-center justify-center">
        <span className="typo-body rounded-lg border border-[var(--brand-gray-100)] bg-[var(--brand-light-200)] px-3 py-1 font-semibold tabular-nums text-[var(--brand-ink-900)]">
          {time}
        </span>
      </div>
    </header>
  )
}
