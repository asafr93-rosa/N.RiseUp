import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import type { Transaction, BankAccount, ExpenseCategory } from '../../store/useFinanceStore'
import { CATEGORY_LABELS } from '../../lib/formatters'

type FormData = Omit<Transaction, 'id' | 'createdAt' | 'categorySource' | 'importBatchId'>

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: Omit<Transaction, 'id' | 'createdAt'>) => void
  accounts: BankAccount[]
  defaultAccountId?: string
}

const EMPTY = (accountId: string): FormData => ({
  date: new Date().toISOString().slice(0, 10),
  amount: 0,
  type: 'expense',
  category: 'other',
  description: '',
  bankAccountId: accountId || null,
  creditCardId: null,
})

const CATEGORIES = Object.entries(CATEGORY_LABELS) as [ExpenseCategory, string][]

export default function TransactionModal({ open, onClose, onSave, accounts, defaultAccountId }: Props) {
  const firstAccountId = accounts[0]?.id ?? ''
  const [form, setForm] = useState<FormData>(EMPTY(defaultAccountId ?? firstAccountId))
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  useEffect(() => {
    setForm(EMPTY(defaultAccountId ?? firstAccountId))
    setErrors({})
  }, [open, defaultAccountId, firstAccountId])

  function validate(): boolean {
    const e: typeof errors = {}
    if (!form.description.trim()) e.description = 'Description is required'
    if (form.amount <= 0) e.amount = 'Amount must be greater than 0'
    if (!form.bankAccountId && !form.creditCardId) e.bankAccountId = 'Select an account'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    onSave({ ...form, bankAccountId: form.bankAccountId ?? null, creditCardId: null, categorySource: 'manual', importBatchId: null })
    onClose()
  }

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  return (
    <Modal open={open} onClose={onClose} title="Add Transaction">
      <div className="flex flex-col gap-4">
        {/* Type toggle */}
        <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
          {(['expense', 'income'] as const).map((t) => (
            <button
              key={t}
              onClick={() => set('type', t)}
              className="flex-1 py-2 text-sm font-medium capitalize transition-colors"
              style={{
                background: form.type === t ? (t === 'expense' ? '#f87171' : '#34d399') : 'var(--color-card)',
                color: form.type === t ? '#fff' : 'var(--color-text-secondary)',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Date" type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
          <Input label="Amount (₪)" type="number" inputMode="decimal" placeholder="0" value={form.amount || ''} onChange={(e) => set('amount', parseFloat(e.target.value) || 0)} error={errors.amount} />
        </div>

        <Input label="Description" placeholder="e.g. Shufersal, Salary" value={form.description} onChange={(e) => set('description', e.target.value)} error={errors.description} />

        {form.type === 'expense' && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Category</label>
            <select value={form.category} onChange={(e) => set('category', e.target.value as ExpenseCategory)} className="w-full px-3 py-2 text-sm rounded-xl outline-none" style={{ background: 'var(--color-card)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}>
              {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        )}

        {accounts.length > 1 && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Account</label>
            <select value={form.bankAccountId ?? ''} onChange={(e) => set('bankAccountId', e.target.value)} className="w-full px-3 py-2 text-sm rounded-xl outline-none" style={{ background: 'var(--color-card)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}{a.lastFourDigits ? ` ···· ${a.lastFourDigits}` : ''}</option>)}
            </select>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button variant="primary" className="flex-1" onClick={handleSubmit}>Add</Button>
        </div>
      </div>
    </Modal>
  )
}
