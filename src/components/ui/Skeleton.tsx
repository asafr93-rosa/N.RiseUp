interface Props {
  className?: string
}

export default function Skeleton({ className = '' }: Props) {
  return (
    <div
      className={`animate-pulse rounded-lg ${className}`}
      style={{ background: 'var(--color-border)' }}
    />
  )
}
