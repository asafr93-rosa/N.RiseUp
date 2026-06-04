import { useState, useRef } from 'react'
import { Upload, CheckCircle, X, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../ui/Button'
import CSVPreviewTable, { type PreviewRow } from './CSVPreviewTable'
import ColumnMapperModal from './ColumnMapperModal'
import { parseCSVFile, applyMapping } from '../../lib/csvParser'
import type { ParsedRow, ColumnMapping } from '../../lib/csvParser'
import { aiClassifyTransactions } from '../../lib/aiClassifier'
import type { Transaction, BankAccount, ExpenseCategory } from '../../store/useFinanceStore'

function toPreviewRows(rows: ParsedRow[]): PreviewRow[] {
  return rows.map(r => ({ ...r, excluded: false }))
}

interface Props {
  accounts: BankAccount[]
  categoryRules: Record<string, ExpenseCategory>
  onImport: (txns: Omit<Transaction, 'id' | 'createdAt'>[], batchMeta: { bankAccountId: string | null; creditCardId: string | null; fileName: string; transactionCount: number; totalAmount: number; importedAt: string }) => void
}

type Stage = 'idle' | 'parsing' | 'preview' | 'mapping'

export default function ImportCSVFlow({ accounts, categoryRules, onImport }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [stage, setStage] = useState<Stage>('idle')
  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState<PreviewRow[]>([])
  const [rawHeaders, setRawHeaders] = useState<string[]>([])
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([])
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '')
  const [isDragging, setIsDragging] = useState(false)
  const [aiClassifying, setAiClassifying] = useState(false)

  const ACCEPTED_TYPES = '.csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel'

  function isAccepted(file: File) {
    return file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls') ||
      file.type === 'text/csv' ||
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel'
  }

  async function handleFile(file: File) {
    if (!isAccepted(file)) {
      toast.error('Please select a CSV or Excel file')
      return
    }
    setFileName(file.name)
    setStage('parsing')
    try {
      const result = await parseCSVFile(file, categoryRules)
      setRawHeaders(result.rawHeaders)
      setRawRows(result.rawRows)

      if (result.needsMapping) {
        setStage('mapping')
        return
      }

      const parsed = result.rows
      // Run AI classification if API key is available
      if (import.meta.env.VITE_ANTHROPIC_API_KEY && parsed.length > 0) {
        setAiClassifying(true)
        setRows(toPreviewRows(parsed))
        setStage('preview')
        try {
          const descriptions = parsed.map((r) => r.description)
          const categories = await aiClassifyTransactions(descriptions)
          setRows(parsed.map((r, i) => ({ ...r, category: categories[i] ?? r.category, excluded: false })))
        } catch {
          // fall back to keyword-classified rows already shown
        } finally {
          setAiClassifying(false)
        }
      } else {
        setRows(toPreviewRows(parsed))
        setStage('preview')
      }
    } catch (err) {
      toast.error('Failed to parse file')
      setStage('idle')
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  async function handleMappingConfirm(mapping: ColumnMapping) {
    const mapped = applyMapping(rawRows, mapping, categoryRules)
    if (import.meta.env.VITE_ANTHROPIC_API_KEY && mapped.length > 0) {
      setAiClassifying(true)
      setRows(toPreviewRows(mapped))
      setStage('preview')
      try {
        const categories = await aiClassifyTransactions(mapped.map((r) => r.description))
        setRows(mapped.map((r, i) => ({ ...r, category: categories[i] ?? r.category, excluded: false })))
      } catch {
        // keep keyword-classified rows
      } finally {
        setAiClassifying(false)
      }
    } else {
      setRows(toPreviewRows(mapped))
      setStage('preview')
    }
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
      creditCardId: null,
      importBatchId: null,
    }))
    const totalAmount = rows.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0)
    onImport(txns, { bankAccountId: accountId, creditCardId: null, fileName, transactionCount: rows.length, totalAmount, importedAt: new Date().toISOString() })
    setStage('idle')
    setRows([])
    toast.success(`Imported ${rows.length} transactions`)
  }

  if (stage === 'idle' || stage === 'parsing') {
    return (
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => stage === 'idle' && fileRef.current?.click()}
        className="border-2 border-dashed rounded-xl p-6 text-center transition-colors"
        style={{
          borderColor: isDragging ? '#4361EE' : 'var(--color-border)',
          background: isDragging ? '#4361EE10' : 'transparent',
          cursor: stage === 'parsing' ? 'default' : 'pointer',
        }}
      >
        {stage === 'parsing' ? (
          <>
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-2" style={{ borderColor: '#4361EE', borderTopColor: 'transparent' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Reading file…</p>
          </>
        ) : (
          <>
            <Upload size={24} className="mx-auto mb-2" style={{ color: 'var(--color-text-secondary)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Drop CSV or Excel file here</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              or click to browse · .csv, .xlsx · Hebrew bank exports supported
            </p>
            {import.meta.env.VITE_ANTHROPIC_API_KEY && (
              <p className="text-xs mt-1 flex items-center justify-center gap-1" style={{ color: '#4361EE' }}>
                <Sparkles size={11} /> AI-powered classification
              </p>
            )}
          </>
        )}
        <input ref={fileRef} type="file" accept={ACCEPTED_TYPES} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
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

        {aiClassifying && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs" style={{ background: '#4361EE15', color: '#4361EE' }}>
            <div className="w-3 h-3 border border-t-transparent rounded-full animate-spin" style={{ borderColor: '#4361EE', borderTopColor: 'transparent' }} />
            <Sparkles size={12} />
            AI is classifying transactions…
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
