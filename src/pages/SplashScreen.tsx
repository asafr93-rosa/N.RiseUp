import { useState, useEffect } from 'react'
import { TrendingUp } from 'lucide-react'

interface Props {
  onDone: () => void
}

export default function SplashScreen({ onDone }: Props) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setVisible(false), 1500)
    const doneTimer = setTimeout(onDone, 1800)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(doneTimer)
    }
  }, [onDone])

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center gap-4"
      style={{
        background: 'var(--color-surface)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease-out',
      }}
    >
      <div
        className="flex items-center justify-center rounded-2xl"
        style={{ width: 72, height: 72, background: '#4361EE' }}
      >
        <TrendingUp size={36} color="#fff" />
      </div>
      <div className="text-center">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          N.RiseUp
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          Your personal finance tracker
        </p>
      </div>
    </div>
  )
}
