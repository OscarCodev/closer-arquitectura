import Link from 'next/link'
import { routes } from '@/lib/routes'

export default function AuthCodeErrorPage() {
  return (
    <main className="flex h-[100dvh] w-screen items-center justify-center bg-[var(--brand-light-50)]">
      <div className="mx-auto w-full max-w-[360px] text-center">
        <h1 className="typo-page-title font-semibold text-[var(--brand-ink-900)]">
          No pudimos iniciar sesión
        </h1>
        <p className="typo-body mt-3 text-[var(--brand-gray-500)]">
          El enlace expiró, ya se usó o se abrió en otro navegador. Pide uno nuevo y ábrelo en el mismo navegador donde lo solicitaste.
        </p>
        <Link
          href={routes.login}
          className="typo-body mt-6 inline-block px-4 py-[10px] bg-[var(--brand-blue-500)] text-white rounded-[6px] hover:bg-[var(--brand-blue-600)] transition-colors font-medium"
        >
          Volver a iniciar sesión
        </Link>
      </div>
    </main>
  )
}
