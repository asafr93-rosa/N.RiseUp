import { useState } from 'react'
import { Pencil, Trash2, CreditCard } from 'lucide-react'
import { formatCurrency } from '../../lib/formatters'
import type { BankAccount } from '../../store/useFinanceStore'

interface Props {
  account: BankAccount
  onEdit: () => void
  onDelete: () => void
  onDeposit: (amount: number) => void
}

export default function BankAccountCard({ account, onEdit, onDelete, onDeposit }: Props) {
  const [depositVal, setDepositVal] = useState('')

  function handleDeposit() {
    const amt = parseFloat(depositVal)
    if (!isNaN(amt) && amt > 0) {
      onDeposit(amt)
      setDepositVal('')
    }
  }

  return (
    <div className="card p-4 flex flex-col gap-3 min-h-[160px] animate-fade-in">
      {/* Top: icon + name + actions */}
      <div className="flex items-start justify-between gap-1">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'var(--color-accent-light)', color: '#4361EE' }}
          >
            <CreditCard size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
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
          <button onClick={onEdit} className="p-1 rounded-lg" style={{ color: 'var(--color-text-secondary)' }}>
            <Pencil size={12} />
          </button>
          <button onClick={onDelete} className="p-1 rounded-lg" style={{ color: '#EF4444' }}>
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Balance */}
      <div className="flex-1">
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Balance</p>
        <p className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {formatCurrency(account.balance)}
        </p>
      </div>

      {/* Deposit input — always visible */}
      <div className="border-t pt-2" style={{ borderColor: 'var(--color-border)' }}>
        <p className="text-xs mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Add Deposit</p>
        <div className="flex gap-1.5">
          <input
            type="number"
            inputMode="decimal"
            placeholder="Amount"
            value={depositVal}
            onChange={(e) => setDepositVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleDeposit()}
            className="flex-1 text-xs px-2 py-1.5 rounded-lg outline-none min-w-0"
            style={{
              background: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
            }}
          />
          <button
            onClick={handleDeposit}
            className="text-xs px-2.5 py-1.5 rounded-lg font-medium shrink-0"
            style={{ background: '#4361EE20', color: '#4361EE' }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
