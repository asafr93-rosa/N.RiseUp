import { Pencil, Trash2, CreditCard as CreditCardIcon } from 'lucide-react'
import type { CreditCard } from '../../store/useFinanceStore'

interface Props {
  card: CreditCard
  onEdit: () => void
  onDelete: () => void
}

export default function CreditCardCard({ card, onEdit, onDelete }: Props) {
  return (
    <div className="card p-4 flex flex-col min-h-[140px] animate-fade-in">
      {/* Top: icon + actions */}
      <div className="flex items-center justify-between gap-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: '#7c3aed20' }}
        >
          <CreditCardIcon size={16} style={{ color: '#7c3aed' }} />
        </div>
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg"
            style={{ color: 'var(--color-text-secondary)', background: 'var(--color-surface)' }}
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg"
            style={{ color: '#EF4444', background: 'var(--color-surface)' }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom: name + details */}
      <div>
        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {card.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {card.lastFourDigits && (
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              ···· {card.lastFourDigits}
            </p>
          )}
          {card.paymentCycleDay ? (
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              · Day {card.paymentCycleDay}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
