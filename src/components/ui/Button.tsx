import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const VARIANT_STYLES: Record<Variant, { className: string; style?: React.CSSProperties }> = {
  primary: {
    className: 'text-white',
    style: {
      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
    },
  },
  secondary: {
    className: '',
    style: {
      background: 'var(--color-card)',
      color: 'var(--color-text-primary)',
      border: '1px solid var(--color-border)',
    },
  },
  danger: {
    className: 'text-white',
    style: {
      background: '#f43f5e',
      boxShadow: '0 4px 12px rgba(244,63,94,0.25)',
    },
  },
  ghost: {
    className: '',
    style: {
      background: 'transparent',
      color: 'var(--color-text-secondary)',
    },
  },
}

const SIZE_STYLES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-xl',
  md: 'px-4 py-2 text-sm rounded-[14px]',
  lg: 'px-5 py-2.5 text-base rounded-2xl',
}

export default function Button({ variant = 'primary', size = 'md', className = '', style, ...props }: Props) {
  const variantDef = VARIANT_STYLES[variant]
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variantDef.className} ${SIZE_STYLES[size]} ${className}`}
      style={{ ...variantDef.style, ...style }}
    />
  )
}
