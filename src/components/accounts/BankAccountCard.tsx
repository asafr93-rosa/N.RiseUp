import { useState } from 'react'
import { Pencil, Trash2, CreditCard, Check, X } from 'lucide-react'
import { formatCurrency } from '../../lib/formatters'
import type { BankAccount } from '../../store/useFinanceStore'

interface Props {
  account: BankAccount
  filterMonthKey: string
  effectiveBalance: number
  onSave: (d: { name: string; lastFourDigits: string; balance: number; deposit: number }) => void
  onDelete: () => void
}

const inputCls = 'w-full text-xs px-2 py-1.5 rounded-lg outline-none'
const inputStyle = {
  background: 'var(--color-surface)',
  color: 'var(--color-text-primary)',
  border: '1px solid var(--color-border)',
}

export default function BankAccountCard({ account, filterMonthKey, effectiveBalance, onSave, onDelete }: Props) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', lastFourDigits: '', balance: 0, deposit: 0 })

  const monthBalance = account.balanceHistory?.[filterMonthKey] ?? 0
  const monthDeposit = account.depositHistory?.[filterMonthKey] ?? 0

  function startEdit() {
    setForm({
      name: account.name,
      lastFourDigits: account.lastFourDigits,
      balance: monthBalance,
      deposit: monthDeposit,
    })
    setEditing(true)
  }

  function handleSave() {
    onSave(form)
    setEditing(false)
  }

  function handleCancel() {
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="card p-3 flex flex-col gap-2.5 animate-fade-in">
        <div className="flex items-center gap-1.5 mb-0.5">
          <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: 'var(--color-accent-light)', color: '#4361EE' }}>
            <CreditCard size={12} />
          </div>
          <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Editing</span>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Account Name</label>
          <input
            className={inputCls}
            style={inputStyle}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Bank name"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Last 4 Digits</label>
          <input
            className={inputCls}
            style={inputStyle}
            value={form.lastFourDigits}
            onChange={(e) => setForm((f) => ({ ...f, lastFourDigits: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
            placeholder="1234"
            maxLength={4}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Balance (₪)</label>
          <input
            type="number"
            inputMode="decimal"
            className={inputCls}
            style={inputStyle}
            value={form.balance || ''}
            onChange={(e) => setForm((f) => ({ ...f, balance: parseFloat(e.target.value) || 0 }))}
            placeholder="0"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Deposit (₪)</label>
          <input
            type="number"
            inputMode="decimal"
            className={inputCls}
            style={inputStyle}
            value={form.deposit || ''}
            onChange={(e) => setForm((f) => ({ ...f, deposit: parseFloat(e.target.value) || 0 }))}
            placeholder="0"
          />
        </div>

        <div className="flex gap-1.5 pt-1">
          <button
            onClick={handleCancel}
            className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded-lg font-medium"
            style={{ background: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
          >
            <X size={12} /> Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded-lg font-medium"
            style={{ background: '#4361EE20', color: '#4361EE', border: '1px solid #4361EE40' }}
          >
            <Check size={12} /> Save
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-3 flex flex-col gap-3 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-1">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--color-accent-light)', color: '#4361EE' }}>
            <CreditCard size={13} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{account.name}</p>
            {account.lastFourDigits && (
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>···· {account.lastFourDigits}</p>
            )}
          </div>
        </div>
        <div className="flex gap-0.5 shrink-0">
          <button onClick={startEdit} className="p-1 rounded" style={{ color: 'var(--color-text-secondary)' }}>
            <Pencil size={11} />
          </button>
          <button onClick={onDelete} className="p-1 rounded" style={{ color: '#EF4444' }}>
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {/* Balance rows */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Balance</span>
          <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(monthBalance)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Deposit</span>
          <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(monthDeposit)}</span>
        </div>

        <div className="border-t" style={{ borderColor: 'var(--color-border)' }} />

        <div className="flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: '#4361EE' }}>Effective</span>
          <span className="text-sm font-bold" style={{ color: effectiveBalance >= 0 ? '#4361EE' : '#EF4444' }}>
            {formatCurrency(effectiveBalance)}
          </span>
        </div>
      </div>
    </div>
  )
}
