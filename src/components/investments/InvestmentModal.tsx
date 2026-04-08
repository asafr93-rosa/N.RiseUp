import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import type { Investment, InvestmentType } from '../../store/useFinanceStore'
import { INVESTMENT_TYPE_LABELS } from '../../lib/formatters'

type FormData = Omit<Investment, 'id' | 'createdAt'>

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: FormData) => void
  initial?: Investment
}

const INVESTMENT_TYPES = Object.entries(INVESTMENT_TYPE_LABELS) as [InvestmentType, string][]

const EMPTY: FormData = {
  name: '',
  type: 'pension_fund',
  currentValue: 0,
  monthlyContribution: 0,
  managementFeeContributionPct: 0,
  managementFeeAccumulationPct: 0,
  managingInstitution: '',
  description: '',
  openingDate: new Date().toISOString().slice(0, 10),
  valueHistory: [],
}

export default function InvestmentModal({ open, onClose, onSave, initial }: Props) {
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
    if (form.currentValue <= 0) e.currentValue = 'Value must be greater than 0'
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
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Investment' : 'Add Investment'} maxWidth="max-w-lg">
      <div className="flex flex-col gap-4">
        <Input
          label="Investment Name"
          placeholder="e.g. Menora Pension Fund"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          error={errors.name}
        />

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            Type
          </label>
          <select
            value={form.type}
            onChange={(e) => set('type', e.target.value as InvestmentType)}
            className="w-full px-3 py-2 text-sm rounded-xl outline-none"
            style={{ background: 'var(--color-card)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
          >
            {INVESTMENT_TYPES.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Current Value (₪)"
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={form.currentValue || ''}
            onChange={(e) => set('currentValue', parseFloat(e.target.value) || 0)}
            error={errors.currentValue}
          />
          <Input
            label="Monthly Contribution (₪)"
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={form.monthlyContribution || ''}
            onChange={(e) => set('monthlyContribution', parseFloat(e.target.value) || 0)}
          />
        </div>

        <div>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            Management Fees
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Contribution fee (%)"
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={form.managementFeeContributionPct || ''}
              onChange={(e) => set('managementFeeContributionPct', parseFloat(e.target.value) || 0)}
            />
            <Input
              label="Accumulation fee (%)"
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={form.managementFeeAccumulationPct || ''}
              onChange={(e) => set('managementFeeAccumulationPct', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        <Input
          label="Managing Institution"
          placeholder="e.g. Menora, Harel, Bank Hapoalim"
          value={form.managingInstitution}
          onChange={(e) => set('managingInstitution', e.target.value)}
        />

        <Input
          label="Opening Date"
          type="date"
          value={form.openingDate}
          onChange={(e) => set('openingDate', e.target.value)}
        />

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            Description / Notes
          </label>
          <textarea
            rows={2}
            placeholder="Optional notes..."
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl outline-none resize-none"
            style={{ background: 'var(--color-card)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
          />
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button variant="primary" className="flex-1" onClick={handleSubmit}>
            {initial ? 'Save Changes' : 'Add Investment'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
