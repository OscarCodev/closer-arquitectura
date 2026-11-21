import Link from "next/link"
import { routes } from "@/lib/routes"
import { AppIcon } from "@/components/brand/app-icon"

export function MarketingFooter() {
  return (
    <footer className="bg-[var(--brand-ink-900)] border-t border-white/5">
      <div className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          
          {/* Brand column */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <AppIcon size={30} />
              <span className="text-lg font-semibold text-white">Closer</span>
            </div>
            <p className="typo-body text-[var(--brand-gray-500)] leading-relaxed max-w-xs">
              Entrenamiento de ventas impulsado por IA. Practica, mejora y cierra con más confianza.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--brand-gray-400)] mb-5">Producto</h4>
            <ul className="space-y-3">
              {[
                { label: 'Simulaciones', href: '#simulaciones' },
                { label: 'Analíticas', href: '#analiticas' },
                { label: 'Perfiles', href: '#perfiles' },
              ].map((item) => (
                <li key={item.label}>
                  <a href={item.href} className="typo-body text-[var(--brand-gray-500)] transition-colors hover:text-white">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Cuenta */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--brand-gray-400)] mb-5">Cuenta</h4>
            <ul className="space-y-3">
              <li>
                <Link href={routes.login} className="typo-body text-[var(--brand-gray-500)] transition-colors hover:text-white">
                  Iniciar sesión
                </Link>
              </li>
              <li>
                <Link href={routes.signup} className="typo-body text-[var(--brand-gray-500)] transition-colors hover:text-white">
                  Crear cuenta gratis
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--brand-gray-400)] mb-5">Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link href={routes.privacy} className="typo-body text-[var(--brand-gray-500)] transition-colors hover:text-white">
                  Privacidad
                </Link>
              </li>
              <li>
                <Link href={routes.terms} className="typo-body text-[var(--brand-gray-500)] transition-colors hover:text-white">
                  Términos
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/8 pt-8 md:flex-row">
          <p className="typo-caption text-[var(--brand-gray-600)]">
            © {new Date().getFullYear()} Closer AI. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-1">
            <span className="typo-caption text-[var(--brand-gray-600)]">Hecho con</span>
            <svg className="h-3.5 w-3.5 text-rose-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
            <span className="typo-caption text-[var(--brand-gray-600)]">para vendedores imparables</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
