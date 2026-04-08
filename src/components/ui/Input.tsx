import type { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export default function Input({ label, error, className = '', ...props }: Props) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          {label}
        </label>
      )}
      <input
        {...props}
        className={`w-full px-3 py-2 text-sm rounded-xl outline-none transition-colors ${className}`}
        style={{
          background: 'var(--color-card)',
          color: 'var(--color-text-primary)',
          border: `1px solid ${error ? '#EF4444' : 'var(--color-border)'}`,
          ...props.style,
        }}
      />
      {error && <p className="text-xs text-[#EF4444]">{error}</p>}
    </div>
  )
}
