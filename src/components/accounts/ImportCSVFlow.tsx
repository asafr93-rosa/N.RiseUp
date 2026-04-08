import { useState, useRef } from 'react'
import { Upload, CheckCircle, X } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../ui/Button'
import CSVPreviewTable from './CSVPreviewTable'
import ColumnMapperModal from './ColumnMapperModal'
import { parseCSVFile, applyMapping } from '../../lib/csvParser'
import type { ParsedRow, ColumnMapping } from '../../lib/csvParser'
import type { Transaction, BankAccount, ExpenseCategory } from '../../store/useFinanceStore'

interface Props {
  accounts: BankAccount[]
  categoryRules: Record<string, ExpenseCategory>
  onImport: (txns: Omit<Transaction, 'id' | 'createdAt'>[], batchMeta: { bankAccountId: string; fileName: string; transactionCount: number; totalAmount: number; importedAt: string }) => void
}

type Stage = 'idle' | 'preview' | 'mapping'

export default function ImportCSVFlow({ accounts, categoryRules, onImport }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [stage, setStage] = useState<Stage>('idle')
  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [rawHeaders, setRawHeaders] = useState<string[]>([])
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([])
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '')
  const [isDragging, setIsDragging] = useState(false)

  async function handleFile(file: File) {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      toast.error('Please select a CSV file')
      return
    }
    setFileName(file.name)
    const result = await parseCSVFile(file, categoryRules)
    setRawHeaders(result.rawHeaders)
    setRawRows(result.rawRows)

    if (result.needsMapping) {
      setStage('mapping')
    } else {
      setRows(result.rows)
      setStage('preview')
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleMappingConfirm(mapping: ColumnMapping) {
    const mapped = applyMapping(rawRows, mapping, categoryRules)
    setRows(mapped)
    setStage('preview')
  }

  function updateCategory(index: number, category: ExpenseCategory) {
    setRows((r) => r.map((row, i) => i === index ? { ...row, category } : row))
  }

  function handleConfirm() {
    if (!accountId) { toast.error('Select an account first'); return }
    const txns: Omit<Transaction, 'id' | 'createdAt'>[] = rows.map((r) => ({
      date: r.date,
      amount: r.amount,
      type: r.type,
      category: r.category,
      categorySource: 'keyword' as const,
      description: r.description,
      bankAccountId: accountId,
      importBatchId: null,
    }))
    const totalAmount = rows.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0)
    onImport(txns, { bankAccountId: accountId, fileName, transactionCount: rows.length, totalAmount, importedAt: new Date().toISOString() })
    setStage('idle')
    setRows([])
    toast.success(`Imported ${rows.length} transactions`)
  }

  if (stage === 'idle') {
    return (
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors"
        style={{ borderColor: isDragging ? '#4361EE' : 'var(--color-border)', background: isDragging ? '#4361EE10' : 'transparent' }}
      >
        <Upload size={24} className="mx-auto mb-2" style={{ color: 'var(--color-text-secondary)' }} />
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Drop CSV file here</p>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>or click to browse · supports Hebrew bank exports</p>
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      </div>
    )
  }

  if (stage === 'preview') {
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

        {accounts.length > 1 && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Import to account</label>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full px-3 py-2 text-sm rounded-xl outline-none" style={{ background: 'var(--color-card)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        )}

        <CSVPreviewTable rows={rows} onCategoryChange={updateCategory} />

        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setStage('idle')}>Cancel</Button>
          <Button variant="primary" className="flex-1" onClick={handleConfirm}>Import {rows.length} transactions</Button>
        </div>
      </div>
    )
  }

  return (
    <ColumnMapperModal
      open={stage === 'mapping'}
      onClose={() => setStage('idle')}
      headers={rawHeaders}
      onConfirm={handleMappingConfirm}
    />
  )
}
