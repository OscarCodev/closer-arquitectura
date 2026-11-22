'use client'

import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/auth/auth-client'
import { resolvePostLoginRoute } from '@/lib/auth/post-login'
import { routes } from '@/lib/routes'
import { AppIcon } from '@/components/brand/app-icon'
import { EmailLinkForm } from '../_components/email-link-form'

export default function SignupPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const redirectIfSignedIn = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) router.replace(await resolvePostLoginRoute())
    }

    void redirectIfSignedIn()
  }, [supabase, router])

  return (
    <main className="mx-auto w-full max-w-[360px]">
      <div className="mb-6 text-center">
        <div className="mb-3 flex justify-center">
          <AppIcon size={56} />
        </div>
        <h1 className="typo-page-title font-semibold text-[var(--brand-ink-900)]">Comienza gratis</h1>
        <p className="typo-label mt-2 text-[var(--brand-gray-500)]">Crea tu cuenta con un enlace que te enviamos por correo.</p>
      </div>

      <div className="flex flex-col gap-4 w-full">
        <EmailLinkForm
          supabase={supabase}
          submitLabel="Crear cuenta con correo"
          hint="Te enviaremos un enlace para verificar tu correo y activar tu cuenta."
        />

        <p className="typo-body text-[var(--brand-gray-600)]">
          ¿Ya tienes cuenta?{' '}
          <Link href={routes.login} className="font-medium text-[var(--brand-blue-600)] hover:underline">
            Iniciar sesión
          </Link>
        </p>

        <div className="border-t border-[var(--color-border)] pt-4">
          <p className="typo-legal text-center text-[var(--color-muted)]">
            Al continuar, confirmas que entiendes y aceptas los{' '}
            <Link href={routes.terms} className="text-[var(--brand-gray-700)] hover:text-[var(--color-primary-strong)] hover:underline">
              Términos y condiciones
            </Link>{' '}
            y la{' '}
            <Link href={routes.privacy} className="text-[var(--brand-gray-700)] hover:text-[var(--color-primary-strong)] hover:underline">
              Política de privacidad
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
