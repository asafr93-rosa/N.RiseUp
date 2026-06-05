import type { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export default function Input({ label, error, className = '', ...props }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-accent)' }}>
          {label}
        </label>
      )}
      <input
        {...props}
        className={`w-full px-3.5 py-2.5 text-sm rounded-xl outline-none transition-all ${className}`}
        style={{
          background: 'var(--color-card-elevated)',
          color: 'var(--color-text-primary)',
          border: `1px solid ${error ? '#f87171' : 'var(--color-border)'}`,
          ...props.style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = error ? '#f87171' : 'var(--color-accent)'
          e.currentTarget.style.boxShadow = `0 0 0 3px var(--color-accent-light)`
          props.onFocus?.(e)
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? '#f87171' : 'var(--color-border)'
          e.currentTarget.style.boxShadow = ''
          props.onBlur?.(e)
        }}
      />
      {error && <p className="text-xs font-medium" style={{ color: '#f87171' }}>{error}</p>}
    </div>
  )
}
