import { useState } from 'react'
import { Pencil, Trash2, CreditCard, Check, X } from 'lucide-react'
import { useCurrency } from '../../hooks/useCurrency'
import { useFinanceStore } from '../../store/useFinanceStore'
import type { BankAccount, SupportedCurrency } from '../../store/useFinanceStore'
import { formatCurrencyIn } from '../../lib/formatters'
import CurrencyInput from '../ui/CurrencyInput'

interface Props {
  account: BankAccount
  filterMonthKey: string
  effectiveBalance: number
  onSave: (d: { name: string; lastFourDigits: string; balance: number; deposit: number; currency: SupportedCurrency }) => void
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
  const [form, setForm] = useState({ name: '', lastFourDigits: '', balance: 0, deposit: 0, currency: 'ILS' as SupportedCurrency })
  const { format, displayCurrency } = useCurrency()
  const enabledCurrencies = useFinanceStore((s) => s.appSettings.enabledCurrencies)

  const monthBalance = account.balanceHistory?.[filterMonthKey] ?? 0
  const monthDeposit = account.depositHistory?.[filterMonthKey] ?? 0
  const acctCurrency = account.currency ?? 'ILS'

  function startEdit() {
    setForm({
      name: account.name,
      lastFourDigits: account.lastFourDigits,
      balance: monthBalance,
      deposit: monthDeposit,
      currency: acctCurrency,
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
          <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: 'var(--color-accent-light)', color: '#2dd4bf' }}>
            <CreditCard size={12} />
          </div>
          <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Editing</span>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Account Name</label>
          <input className={inputCls} style={inputStyle} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Bank name" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Last 4 Digits</label>
          <input className={inputCls} style={inputStyle} value={form.lastFourDigits} onChange={(e) => setForm((f) => ({ ...f, lastFourDigits: e.target.value.replace(/\D/g, '').slice(0, 4) }))} placeholder="1234" maxLength={4} />
        </div>

        <CurrencyInput
          label="Balance"
          value={form.balance}
          currency={form.currency}
          enabledCurrencies={enabledCurrencies}
          onValueChange={(v) => setForm((f) => ({ ...f, balance: v }))}
          onCurrencyChange={(c) => setForm((f) => ({ ...f, currency: c }))}
        />

        <CurrencyInput
          label="Deposit"
          value={form.deposit}
          currency={form.currency}
          enabledCurrencies={enabledCurrencies}
          onValueChange={(v) => setForm((f) => ({ ...f, deposit: v }))}
          onCurrencyChange={(c) => setForm((f) => ({ ...f, currency: c }))}
        />

        <div className="flex gap-1.5 pt-1">
          <button onClick={handleCancel} className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded-lg font-medium" style={{ background: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
            <X size={12} /> Cancel
          </button>
          <button onClick={handleSave} className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded-lg font-medium" style={{ background: '#2dd4bf20', color: '#2dd4bf', border: '1px solid #2dd4bf40' }}>
            <Check size={12} /> Save
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-3 flex flex-col gap-3 animate-fade-in">
      <div className="flex items-start justify-between gap-1">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--color-accent-light)', color: '#2dd4bf' }}>
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
          <button onClick={startEdit} className="p-1 rounded" style={{ color: 'var(--color-text-secondary)' }}><Pencil size={11} /></button>
          <button onClick={onDelete} className="p-1 rounded" style={{ color: '#f87171' }}><Trash2 size={11} /></button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Balance</span>
          <div className="flex flex-col items-end">
            <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>{format(monthBalance, acctCurrency)}</span>
            {acctCurrency !== displayCurrency && <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>{formatCurrencyIn(monthBalance, acctCurrency)}</span>}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Deposit</span>
          <div className="flex flex-col items-end">
            <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>{format(monthDeposit, acctCurrency)}</span>
            {acctCurrency !== displayCurrency && <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>{formatCurrencyIn(monthDeposit, acctCurrency)}</span>}
          </div>
        </div>
        <div className="border-t" style={{ borderColor: 'var(--color-border)' }} />
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: '#2dd4bf' }}>Effective</span>
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold" style={{ color: effectiveBalance >= 0 ? '#2dd4bf' : '#f87171' }}>
              {format(effectiveBalance, acctCurrency)}
            </span>
            {acctCurrency !== displayCurrency && <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>{formatCurrencyIn(effectiveBalance, acctCurrency)}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
