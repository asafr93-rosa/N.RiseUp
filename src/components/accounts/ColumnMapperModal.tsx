import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import type { ColumnMapping } from '../../lib/csvParser'

interface Props {
  open: boolean
  onClose: () => void
  headers: string[]
  onConfirm: (mapping: ColumnMapping) => void
}

export default function ColumnMapperModal({ open, onClose, headers, onConfirm }: Props) {
  const [mapping, setMapping] = useState<ColumnMapping>({ date: '', description: '', amount: '' })

  function set<K extends keyof ColumnMapping>(key: K, value: string) {
    setMapping((m) => ({ ...m, [key]: value || undefined }))
  }

  const isValid = !!mapping.date && !!mapping.description && (!!mapping.amount || (!!mapping.credit && !!mapping.debit))

  const options = ['', ...headers]

  return (
    <Modal open={open} onClose={onClose} title="Map CSV Columns">
      <p className="text-xs mb-4" style={{ color: 'var(--color-text-secondary)' }}>
        We couldn't auto-detect your CSV format. Please match each column manually.
      </p>
      <div className="flex flex-col gap-3">
        {([
          { key: 'date', label: 'Date column *' },
          { key: 'description', label: 'Description / Business name *' },
          { key: 'amount', label: 'Amount column (single, +/-)' },
          { key: 'credit', label: 'Credit / Income column' },
          { key: 'debit', label: 'Debit / Expense column' },
        ] as { key: keyof ColumnMapping; label: string }[]).map(({ key, label }) => (
          <div key={key} className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>{label}</label>
            <select
              value={mapping[key] ?? ''}
              onChange={(e) => set(key, e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl outline-none"
              style={{ background: 'var(--color-card)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
            >
              {options.map((h) => <option key={h} value={h}>{h || '— not used —'}</option>)}
            </select>
          </div>
        ))}

        <div className="flex gap-2 pt-1">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button variant="primary" className="flex-1" disabled={!isValid} onClick={() => { onConfirm(mapping); onClose() }}>Apply</Button>
        </div>
      </div>
    </Modal>
  )
}
