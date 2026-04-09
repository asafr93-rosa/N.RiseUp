import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import type { RecurringExpense, ExpenseCategory } from '../../store/useFinanceStore'
import { CATEGORY_LABELS } from '../../lib/formatters'

type FormData = Omit<RecurringExpense, 'id' | 'createdAt'>

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: FormData) => void
  initial?: RecurringExpense
}

const CATEGORIES = Object.entries(CATEGORY_LABELS) as [ExpenseCategory, string][]

const EMPTY: FormData = {
  description: '',
  amount: 0,
  category: 'household_bills',
  dayOfMonth: null,
  isActive: true,
}

export default function RecurringExpenseModal({ open, onClose, onSave, initial }: Props) {
  const [form, setForm] = useState<FormData>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  useEffect(() => {
    if (initial) {
      const { id: _id, createdAt: _c, ...rest } = initial
      setForm(rest)
    } else {
      setForm(EMPTY)
    }
    setErrors({})
  }, [open, initial])

  function validate(): boolean {
    const e: typeof errors = {}
    if (!form.description.trim()) e.description = 'Description is required'
    if (form.amount <= 0) e.amount = 'Amount must be greater than 0'
    if (form.dayOfMonth !== null && (form.dayOfMonth < 1 || form.dayOfMonth > 31)) {
      e.dayOfMonth = 'Enter a day between 1 and 31'
    }
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
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Recurring Expense' : 'Add Recurring Expense'}>
      <div className="flex flex-col gap-4">
        <Input
          label="Description"
          placeholder="e.g. Rent, Internet, Insurance"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          error={errors.description}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Monthly Amount (₪)"
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={form.amount || ''}
            onChange={(e) => set('amount', parseFloat(e.target.value) || 0)}
            error={errors.amount}
          />
          <Input
            label="Day of Month (optional)"
            type="number"
            inputMode="decimal"
            min={1}
            max={31}
            placeholder="—"
            value={form.dayOfMonth ?? ''}
            onChange={(e) => {
              const v = e.target.value
              set('dayOfMonth', v === '' ? null : Math.min(31, Math.max(1, parseInt(v) || 1)))
            }}
            error={errors.dayOfMonth}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Category</label>
          <select
            value={form.category}
            onChange={(e) => set('category', e.target.value as ExpenseCategory)}
            className="w-full px-3 py-2 text-sm rounded-xl outline-none"
            style={{ background: 'var(--color-card)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
          >
            {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>

        <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'var(--color-surface)' }}>
          <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>Active</span>
          <button
            onClick={() => set('isActive', !form.isActive)}
            className="relative w-11 h-6 rounded-full transition-colors"
            style={{ background: form.isActive ? '#4361EE' : 'var(--color-border)' }}
          >
            <span
              className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
              style={{ transform: form.isActive ? 'translateX(20px)' : 'translateX(0)' }}
            />
          </button>
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button variant="primary" className="flex-1" onClick={handleSubmit}>
            {initial ? 'Save Changes' : 'Add'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
