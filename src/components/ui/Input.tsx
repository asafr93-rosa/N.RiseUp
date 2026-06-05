import type { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export default function Input({ label, error, className = '', ...props }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {label}
        </label>
      )}
      <input
        {...props}
        className={`w-full px-3.5 py-2.5 text-sm rounded-2xl outline-none transition-all ${className}`}
        style={{
          background: 'var(--color-card)',
          color: 'var(--color-text-primary)',
          border: `1px solid ${error ? '#f43f5e' : 'var(--color-border)'}`,
          boxShadow: error ? '0 0 0 3px rgba(244,63,94,0.1)' : undefined,
          ...props.style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.border = `1px solid ${error ? '#f43f5e' : 'rgba(99,102,241,0.5)'}`
          e.currentTarget.style.boxShadow = error ? '0 0 0 3px rgba(244,63,94,0.1)' : '0 0 0 3px rgba(99,102,241,0.12)'
          props.onFocus?.(e)
        }}
        onBlur={(e) => {
          e.currentTarget.style.border = `1px solid ${error ? '#f43f5e' : 'var(--color-border)'}`
          e.currentTarget.style.boxShadow = error ? '0 0 0 3px rgba(244,63,94,0.1)' : ''
          props.onBlur?.(e)
        }}
      />
      {error && <p className="text-xs font-medium" style={{ color: '#f43f5e' }}>{error}</p>}
    </div>
  )
}
