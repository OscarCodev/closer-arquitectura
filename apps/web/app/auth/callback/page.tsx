'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/auth/auth-client'
import { resolvePostLoginRoute } from '@/lib/auth/post-login'
import { routes } from '@/lib/routes'
import { AppIcon } from '@/components/brand/app-icon'

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [status, setStatus] = useState<'loading' | 'error'>('loading')

  useEffect(() => {
    let cancelled = false

    const completeSignIn = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (cancelled) return

      if (!user) {
        setStatus('error')
        router.replace(routes.authCodeError)
        return
      }

      router.replace(await resolvePostLoginRoute())
    }

    completeSignIn().catch(() => {
      if (cancelled) return
      setStatus('error')
      router.replace(routes.authCodeError)
    })

    return () => {
      cancelled = true
    }
  }, [router, supabase])

  return (
    <main className="flex h-[100dvh] w-screen items-center justify-center bg-[var(--brand-light-50)] px-6">
      <div className="mx-auto flex w-full max-w-sm flex-col items-center text-center">
        <div className="mb-4">
          <AppIcon size={56} />
        </div>
        <h1 className="typo-page-title font-semibold text-[var(--brand-ink-900)]">
          {status === 'error' ? 'No pudimos completar el inicio de sesión' : 'Completando inicio de sesión'}
        </h1>
        <p className="typo-body mt-3 text-[var(--brand-gray-500)]">
          {status === 'error'
            ? 'La respuesta de Google no pudo validarse. Intenta de nuevo desde el botón de Google.'
            : 'Estamos validando tu cuenta y preparando tu espacio.'}
        </p>
      </div>
    </main>
  )
}