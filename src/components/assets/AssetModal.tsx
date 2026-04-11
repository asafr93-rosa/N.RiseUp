import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import type { Asset, AssetType } from '../../store/useFinanceStore'

type FormData = Omit<Asset, 'id' | 'createdAt'>

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: FormData) => void
  initial?: Asset
}

const ASSET_TYPES: { value: AssetType; label: string }[] = [
  { value: 'apartment', label: 'Apartment / Property' },
  { value: 'land', label: 'Land' },
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'other', label: 'Other' },
]

const EMPTY: FormData = {
  name: '',
  type: 'apartment',
  estimatedValue: 0,
  purchaseDate: new Date().toISOString().slice(0, 10),
  originalPurchaseCost: 0,
  notes: '',
  currency: 'ILS',
}

export default function AssetModal({ open, onClose, onSave, initial }: Props) {
  const [form, setForm] = useState<FormData>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  useEffect(() => {
    setForm(initial ? { name: initial.name, type: initial.type, estimatedValue: initial.estimatedValue, purchaseDate: initial.purchaseDate, originalPurchaseCost: initial.originalPurchaseCost, notes: initial.notes, currency: initial.currency ?? 'ILS' } : EMPTY)
    setErrors({})
  }, [open, initial])

  function validate(): boolean {
    const e: typeof errors = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (form.estimatedValue <= 0) e.estimatedValue = 'Value must be greater than 0'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    onSave(form)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Asset' : 'Add Asset'}>
      <div className="flex flex-col gap-4">
        <Input
          label="Asset Name"
          placeholder="e.g. Apartment in Tel Aviv"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          error={errors.name}
        />

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            Asset Type
          </label>
          <select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as AssetType }))}
            className="w-full px-3 py-2 text-sm rounded-xl outline-none"
            style={{ background: 'var(--color-card)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
          >
            {ASSET_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <Input
          label="Estimated Current Value (₪)"
          type="number"
          inputMode="decimal"
          placeholder="0"
          value={form.estimatedValue || ''}
          onChange={(e) => setForm((f) => ({ ...f, estimatedValue: parseFloat(e.target.value) || 0 }))}
          error={errors.estimatedValue}
        />

        <Input
          label="Original Purchase Cost (₪)"
          type="number"
          inputMode="decimal"
          placeholder="0"
          value={form.originalPurchaseCost || ''}
          onChange={(e) => setForm((f) => ({ ...f, originalPurchaseCost: parseFloat(e.target.value) || 0 }))}
        />

        <Input
          label="Purchase Date"
          type="date"
          value={form.purchaseDate}
          onChange={(e) => setForm((f) => ({ ...f, purchaseDate: e.target.value }))}
        />

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            Notes
          </label>
          <textarea
            rows={3}
            placeholder="Optional notes..."
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="w-full px-3 py-2 text-sm rounded-xl outline-none resize-none"
            style={{ background: 'var(--color-card)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
          />
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button variant="primary" className="flex-1" onClick={handleSubmit}>
            {initial ? 'Save Changes' : 'Add Asset'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
