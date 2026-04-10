import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import type { IncomeEntry, IncomeSource, BankAccount } from '../../store/useFinanceStore'
import { INCOME_SOURCE_LABELS } from '../../lib/formatters'

type FormData = Omit<IncomeEntry, 'id' | 'createdAt'>

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: FormData) => void
  accounts: BankAccount[]
}

const SOURCES = Object.entries(INCOME_SOURCE_LABELS) as [IncomeSource, string][]

const EMPTY: FormData = {
  date: new Date().toISOString().slice(0, 10),
  amount: 0,
  description: '',
  source: 'salary',
  bankAccountId: null,
}

export default function IncomeModal({ open, onClose, onSave, accounts }: Props) {
  const [form, setForm] = useState<FormData>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  useEffect(() => {
    if (open) { setForm(EMPTY); setErrors({}) }
  }, [open])

  function validate(): boolean {
    const e: typeof errors = {}
    if (!form.description.trim()) e.description = 'Description is required'
    if (form.amount <= 0) e.amount = 'Amount must be greater than 0'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    onSave(form)
    onClose()
  }

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  return (
    <Modal open={open} onClose={onClose} title="Add Income">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Date"
            type="date"
            value={form.date}
            onChange={(e) => set('date', e.target.value)}
          />
          <Input
            label="Amount (₪)"
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={form.amount || ''}
            onChange={(e) => set('amount', parseFloat(e.target.value) || 0)}
            error={errors.amount}
          />
        </div>

        <Input
          label="Description / Source"
          placeholder="e.g. Monthly salary, Freelance project"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          error={errors.description}
        />

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Type</label>
          <select
            value={form.source}
            onChange={(e) => set('source', e.target.value as IncomeSource)}
            className="w-full px-3 py-2 text-sm rounded-xl outline-none"
            style={{ background: 'var(--color-card)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
          >
            {SOURCES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>

        {accounts.length > 0 && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              Add to Bank Account
            </label>
            <select
              value={form.bankAccountId ?? ''}
              onChange={(e) => set('bankAccountId', e.target.value || null)}
              className="w-full px-3 py-2 text-sm rounded-xl outline-none"
              style={{ background: 'var(--color-card)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
            >
              <option value="">Don't update balance</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}{a.lastFourDigits ? ` ···· ${a.lastFourDigits}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button variant="primary" className="flex-1" onClick={handleSubmit}>Add Income</Button>
        </div>
      </div>
    </Modal>
  )
}
