'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { routes } from '@/lib/routes'

export function OAuthCodeForwarder() {
  const pathname = usePathname()

  useEffect(() => {
    if (!window.location.search.includes('code=')) return
    if (pathname === routes.authCallback || pathname === routes.authCodeError) return

    window.location.replace(`${window.location.origin}${routes.authCallback}${window.location.search}`)
  }, [pathname])

  return null
}