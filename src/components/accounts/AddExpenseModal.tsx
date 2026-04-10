import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import type { Transaction, CreditCard, ExpenseCategory } from '../../store/useFinanceStore'
import { CATEGORY_LABELS } from '../../lib/formatters'
import { categorizeByKeyword } from '../../lib/categorizer'

type FormData = {
  date: string
  amount: number
  description: string
  creditCardId: string
  category: ExpenseCategory
}

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: Omit<Transaction, 'id' | 'createdAt'>) => void
  creditCards: CreditCard[]
  categoryRules: Record<string, ExpenseCategory>
  initial?: Transaction
}

const CATEGORIES = Object.entries(CATEGORY_LABELS) as [ExpenseCategory, string][]

function emptyForm(cardId: string): FormData {
  return {
    date: new Date().toISOString().slice(0, 10),
    amount: 0,
    description: '',
    creditCardId: cardId,
    category: 'other',
  }
}

export default function AddExpenseModal({ open, onClose, onSave, creditCards, categoryRules, initial }: Props) {
  const firstCardId = creditCards[0]?.id ?? ''
  const [form, setForm] = useState<FormData>(emptyForm(firstCardId))
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  useEffect(() => {
    if (!open) return
    if (initial) {
      setForm({
        date: initial.date,
        amount: initial.amount,
        description: initial.description,
        creditCardId: initial.creditCardId ?? firstCardId,
        category: initial.category,
      })
    } else {
      setForm(emptyForm(firstCardId))
    }
    setErrors({})
  }, [open, initial, firstCardId])

  function validate(): boolean {
    const e: typeof errors = {}
    if (!form.description.trim()) e.description = 'Description is required'
    if (form.amount <= 0) e.amount = 'Amount must be greater than 0'
    if (!form.creditCardId) e.creditCardId = 'Select a credit card'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    onSave({
      date: form.date,
      amount: form.amount,
      type: 'expense',
      category: form.category,
      categorySource: 'manual',
      description: form.description,
      bankAccountId: null,
      creditCardId: form.creditCardId,
      importBatchId: initial?.importBatchId ?? null,
    })
    onClose()
  }

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  function handleDescriptionBlur() {
    if (form.description && form.category === 'other') {
      const auto = categorizeByKeyword(form.description, categoryRules)
      if (auto !== 'other') set('category', auto)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Expense' : 'Add Expense'}>
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
          label="Description"
          placeholder="e.g. Shufersal, Amazon"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          onBlur={handleDescriptionBlur}
          error={errors.description}
        />

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

        {creditCards.length > 0 && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Credit Card</label>
            <select
              value={form.creditCardId}
              onChange={(e) => set('creditCardId', e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl outline-none"
              style={{ background: 'var(--color-card)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
            >
              {creditCards.map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.lastFourDigits ? ` ···· ${c.lastFourDigits}` : ''}</option>
              ))}
            </select>
            {errors.creditCardId && <p className="text-xs" style={{ color: '#EF4444' }}>{errors.creditCardId}</p>}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button variant="primary" className="flex-1" onClick={handleSubmit}>
            {initial ? 'Save Changes' : 'Add Expense'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
