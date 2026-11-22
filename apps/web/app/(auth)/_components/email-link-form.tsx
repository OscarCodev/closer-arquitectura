'use client'

import { useEffect, useState } from 'react'
import type { AuthClient } from '@/lib/auth/auth-client'
import { routes } from '@/lib/routes'

const RESEND_COOLDOWN_SECONDS = 60

type Props = {
  supabase: AuthClient
  submitLabel: string
  hint: string
}

/** Traduce los errores habituales de Supabase Auth a mensajes para el usuario. */
function toUserMessage(raw: string): string {
  const text = raw.toLowerCase()
  if (text.includes('rate limit') || text.includes('security purposes')) {
    return 'Se enviaron demasiados correos en poco tiempo. Espera unos minutos y vuelve a intentarlo.'
  }
  if (text.includes('invalid') && text.includes('email')) {
    return 'El correo no es válido. Revísalo e inténtalo de nuevo.'
  }
  return 'No pudimos enviar el enlace. Inténtalo de nuevo en unos minutos.'
}

/**
 * Acceso por correo con enlace mágico (Supabase Auth, flujo PKCE).
 * El enlace vuelve a /auth/callback, donde el cliente canjea el código por la sesión;
 * por eso debe abrirse en el mismo navegador en el que se pidió.
 */
export function EmailLinkForm({ supabase, submitLabel, hint }: Props) {
  const [email, setEmail] = useState('')
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [cooldown])

  const sendLink = async (address: string) => {
    setLoading(true)
    setError('')

    const { error: authError } = await supabase.auth.signInWithOtp({
      email: address,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}${routes.authCallback}`,
      },
    })

    setLoading(false)

    if (authError) {
      setError(toUserMessage(authError.message))
      return
    }

    setSentTo(address)
    setCooldown(RESEND_COOLDOWN_SECONDS)
  }

  const reset = () => {
    setSentTo(null)
    setError('')
  }

  if (sentTo) {
    return (
      <div className="flex flex-col gap-3" role="status" aria-live="polite">
        <div className="typo-label p-4 rounded-[6px] border bg-[var(--brand-mist-100)] text-[var(--brand-ink-700)] border-[var(--brand-mist-300)]">
          <p className="font-semibold text-[var(--brand-ink-900)]">Revisa tu correo</p>
          <p className="mt-1">
            Te enviamos un enlace de acceso a <strong className="break-all">{sentTo}</strong>.
          </p>
          <p className="mt-2">
            Ábrelo <strong>en este mismo navegador</strong> para entrar. Si no lo ves, revisa la carpeta de spam o
            promociones.
          </p>
        </div>

        {error && (
          <div className="typo-label p-3 rounded-[6px] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)] border border-[var(--color-danger-border)]">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={() => void sendLink(sentTo)}
          disabled={loading || cooldown > 0}
          className="typo-body w-full px-4 py-[10px] bg-[var(--brand-light-50)] border border-[var(--brand-gray-100)] rounded-[6px] hover:bg-[var(--brand-light-200)] transition-colors font-medium text-[var(--brand-ink-800)] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Enviando...' : cooldown > 0 ? `Reenviar enlace (${cooldown} s)` : 'Reenviar enlace'}
        </button>
        <button
          type="button"
          onClick={reset}
          className="typo-label text-[var(--brand-blue-600)] hover:underline self-center"
        >
          Usar otro correo
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        void sendLink(email.trim())
      }}
      className="flex flex-col gap-3"
    >
      {error && (
        <div className="typo-label p-3 rounded-[6px] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)] border border-[var(--color-danger-border)]">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-1.5 w-full">
        <label htmlFor="email" className="typo-label text-[var(--brand-gray-500)] ml-0.5">
          Correo electrónico
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="ejemplo@correo.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          disabled={loading}
          className="typo-input w-full px-[14px] py-[10px] rounded-[6px] border border-[var(--brand-gray-100)] bg-[var(--brand-light-50)] focus:outline-none focus:ring-[3px] focus:ring-[var(--brand-blue-100)] focus:border-[var(--brand-blue-500)] text-[var(--brand-ink-800)] transition-all"
        />
        <p className="typo-caption text-[var(--brand-gray-400)] ml-0.5 mt-0.5">{hint}</p>
      </div>

      <button
        type="submit"
        disabled={loading || !email.trim()}
        className="typo-body w-full mt-3 px-4 py-[10px] bg-[var(--brand-blue-500)] text-white rounded-[6px] hover:bg-[var(--brand-blue-600)] transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? 'Enviando...' : submitLabel}
      </button>
    </form>
  )
}
