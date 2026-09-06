import { useState, useRef, useEffect, useCallback } from 'react'

export function useTimer(initialTime = 0) {
  const [time, setTime] = useState(initialTime)
  const [isActive, setIsActive] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const start = useCallback(() => {
    setIsActive(true)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTime(prev => prev + 1)
    }, 1000)
  }, [])

  const stop = useCallback(() => {
    setIsActive(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  const reset = useCallback((newTime = 0) => {
    setIsActive(false)
    setTime(newTime)
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  return { time, isActive, start, stop, reset, setTime }
}
