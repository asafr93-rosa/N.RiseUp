import { useState } from 'react'
import { Pencil, Trash2, CreditCard, Plus, Check, X } from 'lucide-react'
import { formatCurrency } from '../../lib/formatters'
import type { BankAccount } from '../../store/useFinanceStore'

interface Props {
  account: BankAccount
  onEdit: () => void
  onDelete: () => void
  onDeposit: (amount: number) => void
}

export default function BankAccountCard({ account, onEdit, onDelete, onDeposit }: Props) {
  const [showDeposit, setShowDeposit] = useState(false)
  const [depositVal, setDepositVal] = useState('')

  function handleConfirm() {
    const amt = parseFloat(depositVal)
    if (!isNaN(amt) && amt > 0) {
      onDeposit(amt)
      setDepositVal('')
      setShowDeposit(false)
    }
  }

  return (
    <div className="card p-4 flex flex-col min-h-[140px] animate-fade-in">
      {/* Top row */}
      <div className="flex items-start justify-between gap-1">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'var(--color-accent-light)', color: '#4361EE' }}
          >
            <CreditCard size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
              {account.name}
            </p>
            {account.lastFourDigits && (
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                ···· {account.lastFourDigits}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
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

      {/* Balance */}
      <p className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
        {formatCurrency(account.balance)}
      </p>

      {/* Add Funds */}
      {showDeposit ? (
        <div className="flex gap-1.5 items-center">
          <input
            type="number"
            inputMode="decimal"
            placeholder="Amount"
            value={depositVal}
            onChange={(e) => setDepositVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            autoFocus
            className="flex-1 text-xs px-2 py-1.5 rounded-lg outline-none"
            style={{
              background: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
            }}
          />
          <button
            onClick={handleConfirm}
            className="p-1.5 rounded-lg"
            style={{ background: '#22C55E20', color: '#22C55E' }}
          >
            <Check size={13} />
          </button>
          <button
            onClick={() => { setShowDeposit(false); setDepositVal('') }}
            className="p-1.5 rounded-lg"
            style={{ background: 'var(--color-surface)', color: 'var(--color-text-secondary)' }}
          >
            <X size={13} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowDeposit(true)}
          className="text-xs font-medium flex items-center gap-1 self-start"
          style={{ color: '#4361EE' }}
        >
          <Plus size={12} /> Add Funds
        </button>
      )}
    </div>
  )
}
