import { useState } from 'react'

/** Boolean UI state remembered in localStorage (e.g. a section's expanded/collapsed state). */
export function usePersistedToggle(key: string, initial: boolean): [boolean, () => void] {
  const storageKey = `nriseup-ui:${key}`
  const [value, setValue] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      return raw === null ? initial : raw === '1'
    } catch {
      return initial
    }
  })

  function toggle() {
    setValue((v) => {
      try { localStorage.setItem(storageKey, v ? '0' : '1') } catch { /* ignore */ }
      return !v
    })
  }

  return [value, toggle]
}
