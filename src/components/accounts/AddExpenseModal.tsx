import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import type { Transaction, CreditCard, BankAccount, ExpenseCategory } from '../../store/useFinanceStore'
import { CATEGORY_LABELS } from '../../lib/formatters'
import { categorizeByKeyword } from '../../lib/categorizer'

const BANK_TRANSFER = '__bank_transfer__'

type FormData = {
  date: string
  amount: number
  description: string
  paymentMethod: string   // credit card id, or BANK_TRANSFER
  transferAccountId: string
  category: ExpenseCategory
}

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: Omit<Transaction, 'id' | 'createdAt'>) => void
  creditCards: CreditCard[]
  accounts: BankAccount[]
  categoryRules: Record<string, ExpenseCategory>
  initial?: Transaction
}

const CATEGORIES = Object.entries(CATEGORY_LABELS) as [ExpenseCategory, string][]

function emptyForm(paymentMethod: string, transferAccountId: string): FormData {
  return {
    date: new Date().toISOString().slice(0, 10),
    amount: 0,
    description: '',
    paymentMethod,
    transferAccountId,
    category: 'other',
  }
}

export default function AddExpenseModal({ open, onClose, onSave, creditCards, accounts, categoryRules, initial }: Props) {
  const firstCardId = creditCards[0]?.id ?? ''
  const firstAccountId = accounts[0]?.id ?? ''
  const defaultPaymentMethod = firstCardId || (accounts.length > 0 ? BANK_TRANSFER : '')
  const [form, setForm] = useState<FormData>(emptyForm(defaultPaymentMethod, firstAccountId))
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  useEffect(() => {
    if (!open) return
    if (initial) {
      setForm({
        date: initial.date,
        amount: initial.amount,
        description: initial.description,
        paymentMethod: initial.transferAccountId ? BANK_TRANSFER : (initial.creditCardId ?? defaultPaymentMethod),
        transferAccountId: initial.transferAccountId ?? firstAccountId,
        category: initial.category,
      })
    } else {
      setForm(emptyForm(defaultPaymentMethod, firstAccountId))
    }
    setErrors({})
  }, [open, initial, defaultPaymentMethod, firstAccountId])

  function validate(): boolean {
    const e: typeof errors = {}
    if (!form.description.trim()) e.description = 'Description is required'
    if (form.amount <= 0) e.amount = 'Amount must be greater than 0'
    if (form.paymentMethod === BANK_TRANSFER) {
      if (!form.transferAccountId) e.transferAccountId = 'Select a bank account'
    } else if (!form.paymentMethod) {
      e.paymentMethod = 'Select a payment method'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    const isTransfer = form.paymentMethod === BANK_TRANSFER
    onSave({
      date: form.date,
      amount: form.amount,
      type: 'expense',
      category: form.category,
      categorySource: 'manual',
      description: form.description,
      bankAccountId: null,
      creditCardId: isTransfer ? null : form.paymentMethod,
      transferAccountId: isTransfer ? form.transferAccountId : null,
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

        {(creditCards.length > 0 || accounts.length > 0) && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Payment Method</label>
            <select
              value={form.paymentMethod}
              onChange={(e) => set('paymentMethod', e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl outline-none"
              style={{ background: 'var(--color-card)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
            >
              {creditCards.map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.lastFourDigits ? ` ···· ${c.lastFourDigits}` : ''}</option>
              ))}
              {accounts.length > 0 && <option value={BANK_TRANSFER}>Bank Transfer</option>}
            </select>
            {errors.paymentMethod && <p className="text-xs" style={{ color: '#f87171' }}>{errors.paymentMethod}</p>}
          </div>
        )}

        {form.paymentMethod === BANK_TRANSFER && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Bank Account</label>
            <select
              value={form.transferAccountId}
              onChange={(e) => set('transferAccountId', e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl outline-none"
              style={{ background: 'var(--color-card)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}{a.lastFourDigits ? ` ···· ${a.lastFourDigits}` : ''}</option>
              ))}
            </select>
            {errors.transferAccountId && <p className="text-xs" style={{ color: '#f87171' }}>{errors.transferAccountId}</p>}
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
