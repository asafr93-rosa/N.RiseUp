import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const VARIANT_STYLES: Record<Variant, string> = {
  primary: 'bg-[#4361EE] text-white hover:bg-[#3451DE] active:bg-[#2a41ce]',
  secondary: 'bg-[var(--color-card)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-border)]',
  danger: 'bg-[#EF4444] text-white hover:bg-[#DC2626] active:bg-[#b91c1c]',
  ghost: 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-card)] hover:text-[var(--color-text-primary)]',
}

const SIZE_STYLES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-5 py-2.5 text-base rounded-xl',
}

export default function Button({ variant = 'primary', size = 'md', className = '', ...props }: Props) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${VARIANT_STYLES[variant]} ${SIZE_STYLES[size]} ${className}`}
    />
  )
}
