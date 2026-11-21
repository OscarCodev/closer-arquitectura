import { useEffect, useState } from 'react'

export function useSimulationTimer(isPaused: boolean) {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    if (isPaused) {
      return
    }

    const interval = window.setInterval(() => {
      setSeconds((prev) => prev + 1)
    }, 1000)

    return () => window.clearInterval(interval)
  }, [isPaused])

  return { seconds }
}
