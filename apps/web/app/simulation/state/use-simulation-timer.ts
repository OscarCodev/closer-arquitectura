import { useEffect, useRef, useState } from 'react'

/**
 * Cronómetro de la llamada. Corre solo mientras `isRunning` (conectado y sin analizar):
 * en el MVP arrancaba al montar la página y seguía corriendo aunque la conexión fallara.
 * Al llegar a `limitSeconds` llama a `onLimit` una sola vez.
 */
export function useSimulationTimer(isRunning: boolean, limitSeconds: number, onLimit: () => void) {
  const [seconds, setSeconds] = useState(0)
  const secondsRef = useRef(0)
  const onLimitRef = useRef(onLimit)
  const limitReached = useRef(false)

  useEffect(() => {
    onLimitRef.current = onLimit
  }, [onLimit])

  useEffect(() => {
    if (!isRunning) return
    const interval = window.setInterval(() => {
      secondsRef.current += 1
      setSeconds(secondsRef.current)
      if (!limitReached.current && secondsRef.current >= limitSeconds) {
        limitReached.current = true
        window.clearInterval(interval)
        onLimitRef.current()
      }
    }, 1000)
    return () => window.clearInterval(interval)
  }, [isRunning, limitSeconds])

  return { seconds }
}
