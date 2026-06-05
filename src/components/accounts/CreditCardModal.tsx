import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import type { CreditCard, BankAccount } from '../../store/useFinanceStore'

type FormData = Omit<CreditCard, 'id' | 'createdAt'>

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: FormData) => void
  initial?: CreditCard
  accounts: BankAccount[]
}

const EMPTY: FormData = { name: '', lastFourDigits: '', paymentCycleDay: 10, bankAccountId: null }

export default function CreditCardModal({ open, onClose, onSave, initial, accounts }: Props) {
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
    if (!form.name.trim()) e.name = 'Name is required'
    if (form.lastFourDigits && !/^\d{4}$/.test(form.lastFourDigits)) e.lastFourDigits = 'Must be 4 digits'
    if (!form.paymentCycleDay || form.paymentCycleDay < 1 || form.paymentCycleDay > 28) e.paymentCycleDay = 'Enter a day between 1 and 28'
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
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Credit Card' : 'Add Credit Card'}>
      <div className="flex flex-col gap-4">
        <Input
          label="Card Name"
          placeholder="e.g. Visa Max, Isracard"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          error={errors.name}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Last 4 Digits"
            placeholder="4521"
            maxLength={4}
            value={form.lastFourDigits}
            onChange={(e) => set('lastFourDigits', e.target.value.replace(/\D/g, '').slice(0, 4))}
            error={errors.lastFourDigits}
          />
          <Input
            label="Billing Day (1–28)"
            type="number"
            inputMode="decimal"
            min={1}
            max={28}
            placeholder="10"
            value={form.paymentCycleDay || ''}
            onChange={(e) => set('paymentCycleDay', Math.min(28, Math.max(1, parseInt(e.target.value) || 1)))}
            error={errors.paymentCycleDay}
          />
        </div>

        {accounts.length > 0 && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              Linked Bank Account
            </label>
            <select
              value={form.bankAccountId ?? ''}
              onChange={(e) => set('bankAccountId', e.target.value || null)}
              className="w-full px-3 py-2 text-sm rounded-xl outline-none"
              style={{ background: 'var(--color-card)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
            >
              <option value="">No linked account</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}{a.lastFourDigits ? ` ···· ${a.lastFourDigits}` : ''}
                </option>
              ))}
            </select>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Expenses on this card will automatically adjust the linked account balance.
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button variant="primary" className="flex-1" onClick={handleSubmit}>
            {initial ? 'Save Changes' : 'Add Card'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
