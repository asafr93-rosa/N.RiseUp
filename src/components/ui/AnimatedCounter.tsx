import { useEffect, useRef, useState } from 'react'
import { formatCurrencyIn, formatCompactIn } from '../../lib/formatters'
import { useCurrency } from '../../hooks/useCurrency'
import type { SupportedCurrency } from '../../store/useFinanceStore'

interface Props {
  value: number
  fromCurrency?: SupportedCurrency
  alreadyConverted?: boolean
  compact?: boolean
  className?: string
}

export default function AnimatedCounter({ value, fromCurrency = 'ILS', alreadyConverted = false, compact = false, className = '' }: Props) {
  const [displayed, setDisplayed] = useState(value)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<{ from: number; to: number; startTime: number } | null>(null)
  const { format, formatCompact, displayCurrency } = useCurrency()

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

  const formatted = alreadyConverted
    ? (compact ? formatCompactIn(displayed, displayCurrency) : formatCurrencyIn(displayed, displayCurrency))
    : (compact ? formatCompact(displayed, fromCurrency) : format(displayed, fromCurrency))

  return <span className={className}>{formatted}</span>
}
