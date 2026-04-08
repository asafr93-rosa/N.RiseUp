import { useEffect, useRef, useState } from 'react'
import { formatCurrency, formatCompact } from '../../lib/formatters'

interface Props {
  value: number
  compact?: boolean
  className?: string
}

export default function AnimatedCounter({ value, compact = false, className = '' }: Props) {
  const [displayed, setDisplayed] = useState(value)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<{ from: number; to: number; startTime: number } | null>(null)

  useEffect(() => {
    const from = displayed
    const to = value
    if (from === to) return

    const duration = 600
    startRef.current = { from, to, startTime: performance.now() }

    const tick = (now: number) => {
      const s = startRef.current!
      const elapsed = now - s.startTime
      const t = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplayed(s.from + (s.to - s.from) * eased)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setDisplayed(s.to)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  const formatted = compact ? formatCompact(displayed) : formatCurrency(displayed)
  return <span className={className}>{formatted}</span>
}
