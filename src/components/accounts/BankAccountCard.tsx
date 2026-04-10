import { useState } from 'react'
import { Pencil, Trash2, CreditCard } from 'lucide-react'
import type { BankAccount } from '../../store/useFinanceStore'

interface Props {
  account: BankAccount
  onEdit: () => void
  onDelete: () => void
  onBalanceChange: (newBalance: number) => void
  onDeposit: (amount: number) => void
}

const inputStyle = {
  background: 'var(--color-surface)',
  color: 'var(--color-text-primary)',
  border: '1px solid var(--color-border)',
}

export default function BankAccountCard({ account, onEdit, onDelete, onBalanceChange, onDeposit }: Props) {
  const [balanceVal, setBalanceVal] = useState(String(account.balance))
  const [depositVal, setDepositVal] = useState('')
  const [editingBalance, setEditingBalance] = useState(false)

  function commitBalance() {
    const v = parseFloat(balanceVal)
    if (!isNaN(v)) onBalanceChange(v)
    else setBalanceVal(String(account.balance))
    setEditingBalance(false)
  }

  function handleDeposit() {
    const amt = parseFloat(depositVal)
    if (!isNaN(amt) && amt > 0) {
      onDeposit(amt)
      setDepositVal('')
    }
  }

  // Keep local balance in sync if external update arrives (e.g. balance adjusted by expense)
  if (!editingBalance && String(account.balance) !== balanceVal && depositVal === '') {
    setBalanceVal(String(account.balance))
  }

  return (
    <div className="card p-3 flex flex-col gap-3 min-h-[180px] animate-fade-in">
      {/* Top: icon + name + actions */}
      <div className="flex items-start justify-between gap-1">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'var(--color-accent-light)', color: '#4361EE' }}
          >
            <CreditCard size={14} />
          </div>
          <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
            {account.name}
            {account.lastFourDigits && (
              <span className="font-normal ml-1" style={{ color: 'var(--color-text-secondary)' }}>···· {account.lastFourDigits}</span>
            )}
          </p>
        </div>
        <div className="flex gap-0.5 shrink-0">
          <button onClick={onEdit} className="p-1 rounded" style={{ color: 'var(--color-text-secondary)' }}>
            <Pencil size={11} />
          </button>
          <button onClick={onDelete} className="p-1 rounded" style={{ color: '#EF4444' }}>
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {/* Current Balance */}
      <div className="flex flex-col gap-1">
        <label className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Current Balance</label>
        <input
          type="number"
          inputMode="decimal"
          value={editingBalance ? balanceVal : account.balance}
          onFocus={() => { setEditingBalance(true); setBalanceVal(String(account.balance)) }}
          onChange={(e) => setBalanceVal(e.target.value)}
          onBlur={commitBalance}
          onKeyDown={(e) => e.key === 'Enter' && commitBalance()}
          className="w-full text-sm font-bold px-2 py-1.5 rounded-lg outline-none"
          style={inputStyle}
        />
      </div>

      {/* Divider */}
      <div className="border-t" style={{ borderColor: 'var(--color-border)' }} />

      {/* Add Deposit */}
      <div className="flex flex-col gap-1">
        <label className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Add Deposit</label>
        <div className="flex gap-1.5">
          <input
            type="number"
            inputMode="decimal"
            placeholder="Amount"
            value={depositVal}
            onChange={(e) => setDepositVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleDeposit()}
            className="flex-1 text-sm px-2 py-1.5 rounded-lg outline-none min-w-0"
            style={inputStyle}
          />
          <button
            onClick={handleDeposit}
            className="text-xs px-2 py-1.5 rounded-lg font-medium shrink-0"
            style={{ background: '#4361EE20', color: '#4361EE' }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
