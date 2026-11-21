'use client'

import Link from "next/link"
import { routes } from "@/lib/routes"
import { AppIcon } from "@/components/brand/app-icon"
import { useEffect, useState } from "react"

export function MarketingHeader() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] border-b border-[var(--brand-gray-100)]'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <AppIcon size={34} />
          <span className="typo-brand font-semibold text-[var(--brand-ink-800)]">
            Closer
          </span>
        </div>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href={routes.login}
            className="typo-body whitespace-nowrap rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-soft)]"
          >
            Iniciar sesión
          </Link>
          <Link
            href={routes.signup}
            className="typo-body whitespace-nowrap rounded-lg bg-[var(--color-primary)] px-3 py-1.5 sm:px-5 sm:py-2 font-semibold text-[var(--color-surface)] shadow-sm transition-all hover:bg-[var(--color-primary-strong)] hover:-translate-y-px hover:shadow-md"
          >
            Comienza gratis
          </Link>
        </nav>
      </div>
    </header>
  )
}
