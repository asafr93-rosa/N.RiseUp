interface Props {
  label: string
  color?: string
  small?: boolean
}

export default function Badge({ label, color = '#6366f1', small = false }: Props) {
  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${small ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}`}
      style={{
        background: `${color}20`,
        color: color,
      }}
    >
      {label}
    </span>
  )
}
