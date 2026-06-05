import { useState, useEffect } from 'react'

interface Props {
  onDone: () => void
}

const ArcIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32,20 A12,12 0 1,1 27.5,29.5"
          stroke="white" strokeWidth="4" strokeLinecap="round"/>
    <path d="M27.5,29.5 L30.5,23.5" stroke="white" strokeWidth="4" strokeLinecap="round"/>
    <path d="M27.5,29.5 L33.5,27.5" stroke="white" strokeWidth="4" strokeLinecap="round"/>
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
      <div
        className="flex items-center justify-center rounded-2xl"
        style={{ width: 72, height: 72, background: '#2dd4bf' }}
      >
        <ArcIcon size={40} />
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
