'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/mocks/supabase-client'
import { routes } from '@/lib/routes'
import { AppIcon } from '@/components/brand/app-icon'

export default function SignupPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [step, setStep] = useState<'initial' | 'verify'>('initial')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })
  const tokenInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (window.location.search.includes('code=')) {
      window.location.replace(`${window.location.origin}${routes.authCallback}${window.location.search}`)
      return
    }

    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return
      }

      const onboardingDone = Boolean(user.user_metadata?.onboarding_completed)
      router.replace(onboardingDone ? routes.setup : routes.onboarding)
    }

    checkUser()
  }, [supabase, router])

  useEffect(() => {
    if (step === 'verify' && tokenInputRef.current) {
      tokenInputRef.current.focus()
    }
  }, [step])

  const signUpWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${routes.authCallback}`,
      },
    })
  }

  const handleSendOtp = async () => {
    setLoading(true)
    setMessage({ text: '', type: '' })

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })

    setLoading(false)

    if (error) {
      setMessage({ text: error.message, type: 'error' })
      return
    }

    setStep('verify')
    setMessage({ text: 'Te enviamos un código para confirmar tu cuenta.', type: 'success' })
  }

  const handleVerifyOtp = async () => {
    setLoading(true)
    setMessage({ text: '', type: '' })

    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })

    if (error) {
      setLoading(false)
      setMessage({ text: 'Código incorrecto. Vuelve a intentarlo.', type: 'error' })
      return
    }

    const { data: { user: newUser } } = await supabase.auth.getUser()
    const onboardingDone = Boolean(newUser?.user_metadata?.onboarding_completed)
    router.push(onboardingDone ? routes.setup : routes.onboarding)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step === 'initial') {
      await handleSendOtp()
    } else {
      await handleVerifyOtp()
    }
  }

  return (
    <main className="mx-auto w-full max-w-[360px]">
      <div className="mb-6 text-center">
        <div className="mb-3 flex justify-center">
          <AppIcon size={56} />
        </div>
        <h1 className="typo-page-title font-semibold text-[var(--brand-ink-900)]">Comienza gratis</h1>
        <p className="typo-label mt-2 text-[var(--brand-gray-500)]">
          Crea tu cuenta con Google o recibe un código por correo.
        </p>
      </div>

      <div className="flex flex-col gap-4 w-full">
        {step === 'initial' && (
          <>
            <button
              onClick={signUpWithGoogle}
              type="button"
              className="typo-body w-full px-4 py-[10px] bg-[var(--brand-light-50)] border border-[var(--brand-gray-100)] rounded-[6px] hover:bg-[var(--brand-light-200)] transition-colors flex items-center justify-center gap-2 font-medium text-[var(--brand-ink-800)]"
            >
              <img
                className="w-[18px] h-[18px]"
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                loading="lazy"
                alt="google logo"
              />
              <span>Continuar con Google</span>
            </button>

            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 border-t border-[var(--brand-gray-100)]" />
              <span className="typo-micro text-[var(--brand-gray-500)] uppercase tracking-wider">O</span>
              <div className="flex-1 border-t border-[var(--brand-gray-100)]" />
            </div>
          </>
        )}

        {message.text && (
          <div className={`typo-label p-3 rounded-[6px] border ${message.type === 'error'
              ? 'bg-[var(--color-danger-bg)] text-[var(--color-danger-text)] border-[var(--color-danger-border)]'
              : 'bg-[var(--brand-mist-100)] text-[var(--brand-ink-700)] border-[var(--brand-mist-300)]'
            }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5 w-full">
            <label htmlFor="email" className="typo-label text-[var(--brand-gray-500)] ml-0.5">
              Correo electrónico
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (step === 'verify') {
                    setStep('initial')
                    setToken('')
                    setMessage({ text: '', type: '' })
                  }
                }}
                required
                disabled={loading && step === 'initial'}
                className={`typo-input w-full px-[14px] py-[10px] rounded-[6px] border bg-[var(--brand-light-50)] focus:outline-none focus:ring-[3px] focus:ring-[var(--brand-blue-100)] focus:border-[var(--brand-blue-500)] text-[var(--brand-ink-800)] transition-all ${step === 'verify'
                    ? 'border-[var(--brand-gray-100)] bg-[var(--brand-light-200)]'
                    : 'border-[var(--brand-gray-100)]'
                  }`}
              />
              {email && (
                <button
                  type="button"
                  onClick={() => {
                    setEmail('')
                    setStep('initial')
                    setToken('')
                    setMessage({ text: '', type: '' })
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-[var(--brand-gray-200)] hover:bg-[var(--brand-gray-300)] transition-colors p-[2px] flex items-center justify-center focus:outline-none"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-[12px] h-[12px] text-white"
                  >
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              )}
            </div>
            {step === 'initial' && (
              <p className="typo-caption text-[var(--brand-gray-400)] ml-0.5 mt-0.5">
                Te enviaremos un código para verificar tu correo y activar tu cuenta.
              </p>
            )}
          </div>

          {step === 'verify' && (
            <div className="flex flex-col gap-1.5 w-full mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <label htmlFor="token" className="typo-label text-[var(--brand-gray-500)] ml-0.5">
                Código de verificación
              </label>
              <input
                id="token"
                ref={tokenInputRef}
                type="text"
                placeholder="Ingresa el código de 6 dígitos"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                className="typo-input w-full px-[14px] py-[10px] rounded-[6px] border border-[var(--brand-blue-500)] ring-[3px] ring-[var(--brand-blue-100)] bg-[var(--brand-light-50)] focus:outline-none text-[var(--brand-ink-800)] transition-all"
              />
              <p className="typo-caption text-[var(--brand-gray-400)] ml-0.5 mt-0.5">
                Revisa tu bandeja de entrada o spam.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email}
            className="typo-body w-full mt-3 px-4 py-[10px] bg-[var(--brand-blue-500)] text-white rounded-[6px] hover:bg-[var(--brand-blue-600)] transition-colors font-medium"
          >
            {step === 'initial'
              ? loading
                ? 'Enviando...'
                : 'Crear cuenta con correo'
              : loading
                ? 'Verificando...'
                : 'Confirmar y empezar'}
          </button>
        </form>

        <p className="typo-body text-[var(--brand-gray-600)]">
          Ya tienes cuenta?{' '}
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
