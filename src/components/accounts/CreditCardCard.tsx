import { Pencil, Trash2, CreditCard as CreditCardIcon, Link } from 'lucide-react'
import type { CreditCard } from '../../store/useFinanceStore'
import { formatCurrency } from '../../lib/formatters'

interface Props {
  card: CreditCard
  linkedAccountName?: string
  monthlyTotal: number
  onEdit: () => void
  onDelete: () => void
}

export default function CreditCardCard({ card, linkedAccountName, monthlyTotal, onEdit, onDelete }: Props) {
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
          <button onClick={onEdit} className="p-1.5 rounded-lg" style={{ color: 'var(--color-text-secondary)', background: 'var(--color-surface)' }}>
            <Pencil size={13} />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg" style={{ color: '#EF4444', background: 'var(--color-surface)' }}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="flex-1" />

      {/* Bottom: name + details + linked account */}
      <div>
        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {card.name}
        </p>
        <div className="flex flex-col gap-0.5 mt-0.5">
          {(card.lastFourDigits || card.paymentCycleDay) && (
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {card.lastFourDigits ? `···· ${card.lastFourDigits}` : ''}
              {card.lastFourDigits && card.paymentCycleDay ? '  ·  ' : ''}
              {card.paymentCycleDay ? `Day ${card.paymentCycleDay}` : ''}
            </p>
          )}
          <div className="mt-1.5 mb-1">
            <p
              className="text-sm font-bold"
              style={{ color: monthlyTotal > 0 ? 'var(--color-expense)' : 'var(--color-text-secondary)' }}
            >
              {formatCurrency(monthlyTotal)}
            </p>
            <p className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>this month</p>
          </div>
          {linkedAccountName ? (
            <div className="flex items-center gap-1">
              <Link size={10} style={{ color: '#4361EE' }} />
              <p className="text-xs font-medium truncate" style={{ color: '#4361EE' }}>
                {linkedAccountName}
              </p>
            </div>
          ) : (
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)', opacity: 0.6 }}>No linked account</p>
          )}
        </div>
      </div>
    </div>
  )
}
