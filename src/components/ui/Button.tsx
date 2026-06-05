import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const SIZE_STYLES: Record<Size, string> = {
  sm: 'px-3.5 py-1.5 text-xs',
  md: 'px-4.5 py-2 text-sm',
  lg: 'px-6 py-2.5 text-base',
}

export default function Button({ variant = 'primary', size = 'md', className = '', style, ...props }: Props) {
  const base = `inline-flex items-center justify-center gap-1.5 font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed`
  const pill = 'rounded-[999px]'

  const variantStyle: React.CSSProperties = (() => {
    switch (variant) {
      case 'primary':
        return {
          background: 'var(--color-accent)',
          color: '#09090b',
          boxShadow: '0 2px 12px var(--color-glow)',
        }
      case 'secondary':
        return {
          background: 'var(--color-card-elevated)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border)',
        }
      case 'danger':
        return {
          background: '#f87171',
          color: '#09090b',
        }
      case 'ghost':
        return {
          background: 'transparent',
          color: 'var(--color-text-secondary)',
        }
    }
  })()

  return (
    <button
      {...props}
      className={`${base} ${pill} ${SIZE_STYLES[size]} ${className}`}
      style={{ ...variantStyle, ...style }}
    />
  )
}
