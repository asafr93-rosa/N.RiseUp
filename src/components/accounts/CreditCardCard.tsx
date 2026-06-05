import { Pencil, Trash2, CreditCard as CreditCardIcon, Link } from 'lucide-react'
import type { CreditCard } from '../../store/useFinanceStore'
import { formatCurrency } from '../../lib/formatters'

interface Props {
  card: CreditCard
  linkedAccountName?: string
  monthlyExpenses: number
  monthlyRecurring: number
  onEdit: () => void
  onDelete: () => void
}

export default function CreditCardCard({ card, linkedAccountName, monthlyExpenses, monthlyRecurring, onEdit, onDelete }: Props) {
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
          <button onClick={onDelete} className="p-1.5 rounded-lg" style={{ color: '#f87171', background: 'var(--color-surface)' }}>
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
          <div className="mt-1.5 mb-1 flex flex-col gap-0.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>Expenses</p>
              <p
                className="text-xs font-semibold"
                style={{ color: monthlyExpenses > 0 ? 'var(--color-expense)' : 'var(--color-text-secondary)' }}
              >
                {formatCurrency(monthlyExpenses)}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>Fixed</p>
              <p
                className="text-xs font-semibold"
                style={{ color: monthlyRecurring > 0 ? 'var(--color-expense)' : 'var(--color-text-secondary)' }}
              >
                {formatCurrency(monthlyRecurring)}
              </p>
            </div>
            <div className="flex items-center justify-between border-t pt-0.5" style={{ borderColor: 'var(--color-border)' }}>
              <p className="text-[10px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>Total</p>
              <p
                className="text-xs font-bold"
                style={{ color: (monthlyExpenses + monthlyRecurring) > 0 ? 'var(--color-expense)' : 'var(--color-text-secondary)' }}
              >
                {formatCurrency(monthlyExpenses + monthlyRecurring)}
              </p>
            </div>
          </div>
          {linkedAccountName ? (
            <div className="flex items-center gap-1">
              <Link size={10} style={{ color: '#2dd4bf' }} />
              <p className="text-xs font-medium truncate" style={{ color: '#2dd4bf' }}>
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
