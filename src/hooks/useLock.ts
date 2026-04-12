import { useState, useEffect, useRef } from 'react'
import { useFinanceStore } from '../store/useFinanceStore'

const SESSION_KEY = 'nriseup-unlocked'
const LOCK_AFTER_MS = 60_000 // 1 minute

export function useLock() {
  const lockSettings = useFinanceStore((s) => s.lockSettings)

  const [isUnlocked, setIsUnlocked] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === 'true'
  )

  const hiddenAtRef = useRef<number | null>(null)

  useEffect(() => {
    if (!lockSettings.enabled) return

    function handleVisibilityChange() {
      if (document.hidden) {
        hiddenAtRef.current = Date.now()
      } else {
        if (hiddenAtRef.current !== null && Date.now() - hiddenAtRef.current > LOCK_AFTER_MS) {
          sessionStorage.removeItem(SESSION_KEY)
          setIsUnlocked(false)
        }
        hiddenAtRef.current = null
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [lockSettings.enabled])

  function unlock() {
    sessionStorage.setItem(SESSION_KEY, 'true')
    setIsUnlocked(true)
  }

  return { isUnlocked, unlock }
}
