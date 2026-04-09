import { useState, useRef } from 'react'
import { Upload, CheckCircle, X } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../ui/Button'
import CSVPreviewTable from './CSVPreviewTable'
import { parseCSVFile } from '../../lib/csvParser'
import type { ParsedRow } from '../../lib/csvParser'
import type { Transaction, CreditCard, ExpenseCategory } from '../../store/useFinanceStore'

interface Props {
  creditCards: CreditCard[]
  categoryRules: Record<string, ExpenseCategory>
  onImport: (
    txns: Omit<Transaction, 'id' | 'createdAt'>[],
    batchMeta: { bankAccountId: null; creditCardId: string; fileName: string; transactionCount: number; totalAmount: number; importedAt: string }
  ) => void
}

type Stage = 'idle' | 'preview'

export default function CreditCardCSVFlow({ creditCards, categoryRules, onImport }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [stage, setStage] = useState<Stage>('idle')
  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [cardId, setCardId] = useState(creditCards[0]?.id ?? '')
  const [isDragging, setIsDragging] = useState(false)

  async function handleFile(file: File) {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      toast.error('Please select a CSV file')
      return
    }
    setFileName(file.name)
    const result = await parseCSVFile(file, categoryRules)
    if (result.needsMapping) {
      toast.error('CSV format not recognized. Expected columns: Date, Description, Amount.')
      return
    }
    setRows(result.rows)
    setStage('preview')
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) void handleFile(file)
  }

  function updateCategory(index: number, category: ExpenseCategory) {
    setRows((r) => r.map((row, i) => i === index ? { ...row, category } : row))
  }

  function updateDescription(index: number, value: string) {
    setRows((r) => r.map((row, i) => i === index ? { ...row, description: value } : row))
  }

  function handleConfirm() {
    if (!cardId) { toast.error('Select a credit card first'); return }
    const txns: Omit<Transaction, 'id' | 'createdAt'>[] = rows.map((r) => ({
      date: r.date,
      amount: r.amount,
      type: 'expense' as const,
      category: r.category,
      categorySource: 'keyword' as const,
      description: r.description,
      bankAccountId: null,
      creditCardId: cardId,
      importBatchId: null,
    }))
    const totalAmount = rows.reduce((s, r) => s + r.amount, 0)
    onImport(txns, { bankAccountId: null, creditCardId: cardId, fileName, transactionCount: rows.length, totalAmount, importedAt: new Date().toISOString() })
    setStage('idle')
    setRows([])
    toast.success(`Imported ${rows.length} transactions`)
  }

  if (stage === 'idle') {
    return (
      <div className="flex flex-col gap-3">
        {creditCards.length > 1 && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Import to card</label>
            <select
              value={cardId}
              onChange={(e) => setCardId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl outline-none"
              style={{ background: 'var(--color-card)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
            >
              {creditCards.map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.lastFourDigits ? ` ···· ${c.lastFourDigits}` : ''}</option>
              ))}
            </select>
          </div>
        )}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors"
          style={{ borderColor: isDragging ? '#7c3aed' : 'var(--color-border)', background: isDragging ? '#7c3aed10' : 'transparent' }}
        >
          <Upload size={24} className="mx-auto mb-2" style={{ color: 'var(--color-text-secondary)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Drop credit card CSV here</p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>or click to browse · columns: Date, Description, Amount</p>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f) }} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle size={16} style={{ color: '#22C55E' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {rows.length} transactions from <span className="font-semibold">{fileName}</span>
          </span>
        </div>
        <button onClick={() => setStage('idle')} style={{ color: 'var(--color-text-secondary)' }}><X size={16} /></button>
      </div>

      <CSVPreviewTable rows={rows} onCategoryChange={updateCategory} onDescriptionChange={updateDescription} />

      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={() => setStage('idle')}>Cancel</Button>
        <Button variant="primary" className="flex-1" onClick={handleConfirm}>Import {rows.length} transactions</Button>
      </div>
    </div>
  )
}
