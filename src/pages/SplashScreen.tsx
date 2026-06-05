import { useState, useEffect } from 'react'

interface Props {
  onDone: () => void
}

const HalfCircleDot = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="30" cy="14" r="5" fill="#0A0A0A"/>
    <path d="M6,40 A24,24 0 0,1 54,40 Z" fill="#0A0A0A"/>
  </svg>
)

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
      <HalfCircleDot size={72} />
      <div className="text-center">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.03em' }}>
          N.RiseUp
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          Your personal finance tracker
        </p>
      </div>
    </div>
  )
}
