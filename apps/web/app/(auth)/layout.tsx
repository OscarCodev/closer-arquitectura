import type { ReactNode } from "react"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--brand-light-50)] text-[var(--brand-ink-900)]">
      <div className="mx-auto flex min-h-screen w-full max-w-xl items-center px-6 py-12">
        <div className="w-full">{children}</div>
      </div>
    </div>
  )
}
