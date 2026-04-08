import { Pencil, Trash2, CreditCard } from 'lucide-react'
import { formatCurrency } from '../../lib/formatters'
import type { BankAccount } from '../../store/useFinanceStore'

interface Props {
  account: BankAccount
  onEdit: () => void
  onDelete: () => void
}

export default function BankAccountCard({ account, onEdit, onDelete }: Props) {
  return (
    <div className="card p-4 flex items-center gap-3 animate-fade-in">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: 'var(--color-accent-light)', color: '#4361EE' }}
      >
        <CreditCard size={20} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {account.name}
          {account.lastFourDigits && (
            <span className="font-normal text-xs ml-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              ···· {account.lastFourDigits}
            </span>
          )}
        </p>
        <p className="text-base font-bold mt-0.5" style={{ color: 'var(--color-text-primary)' }}>
          {formatCurrency(account.balance)}
        </p>
      </div>

      <div className="flex gap-1 shrink-0">
        <button onClick={onEdit} className="p-2 rounded-lg" style={{ color: 'var(--color-text-secondary)', background: 'var(--color-card)' }}>
          <Pencil size={15} />
        </button>
        <button onClick={onDelete} className="p-2 rounded-lg" style={{ color: '#EF4444', background: 'var(--color-card)' }}>
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}
