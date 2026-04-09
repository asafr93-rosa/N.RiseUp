import { Pencil, Trash2, CreditCard as CreditCardIcon } from 'lucide-react'
import type { CreditCard } from '../../store/useFinanceStore'

interface Props {
  card: CreditCard
  onEdit: () => void
  onDelete: () => void
}

export default function CreditCardCard({ card, onEdit, onDelete }: Props) {
  return (
    <div className="card p-4 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-xl shrink-0" style={{ width: 40, height: 40, background: '#7c3aed20' }}>
            <CreditCardIcon size={20} style={{ color: '#7c3aed' }} />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{card.name}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              {card.lastFourDigits ? `···· ${card.lastFourDigits}` : ''}
              {card.lastFourDigits && card.paymentCycleDay ? '  ·  ' : ''}
              {card.paymentCycleDay ? `Billing day ${card.paymentCycleDay}` : ''}
            </p>
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={onEdit} className="p-2 rounded-lg" style={{ color: 'var(--color-text-secondary)', background: 'var(--color-surface)' }}>
            <Pencil size={15} />
          </button>
          <button onClick={onDelete} className="p-2 rounded-lg" style={{ color: '#EF4444', background: 'var(--color-surface)' }}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
