import { useState } from 'react'
import Papa from 'papaparse'
import { Upload, CheckCircle, X } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../ui/Button'
import CSVPreviewTable from './CSVPreviewTable'
import { parseDate } from '../../lib/csvParser'
import type { ParsedRow } from '../../lib/csvParser'
import { categorizeByKeyword } from '../../lib/categorizer'
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

const UNIQUE_INPUT_ID = 'cc-csv-file-input'

function findColumn(headers: string[], patterns: string[]): string | undefined {
  return headers.find((h) =>
    patterns.some((p) => h.toLowerCase().trim().includes(p.toLowerCase()))
  )
}

export default function CreditCardCSVFlow({ creditCards, categoryRules, onImport }: Props) {
  const [stage, setStage] = useState<Stage>('idle')
  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [cardId, setCardId] = useState(creditCards[0]?.id ?? '')
  const [isDragging, setIsDragging] = useState(false)

  async function handleFile(file: File) {
    try {
      // Parse the file directly — let PapaParse handle encoding
      const result = await new Promise<Papa.ParseResult<Record<string, string>>>((resolve, reject) => {
        Papa.parse<Record<string, string>>(file, {
          header: true,
          skipEmptyLines: true,
          complete: resolve,
          error: (err: Error) => reject(err),
        })
      })

      const headers = result.meta.fields ?? []

      // Detect required columns
      const dateCol = findColumn(headers, ['date', 'תאריך'])
      const descCol = findColumn(headers, ['description', 'desc', 'name', 'תיאור', 'שם', 'פירוט', 'עסק', 'מוטב'])
      const amountCol = findColumn(headers, ['amount', 'sum', 'total', 'סכום', 'חיוב'])

      const missing: string[] = []
      if (!dateCol) missing.push('Date')
      if (!descCol) missing.push('Description')
      if (!amountCol) missing.push('Amount')

      if (missing.length > 0) {
        const foundList = headers.length > 0
          ? `Detected columns: ${headers.join(', ')}`
          : 'No column headers were found — make sure the first row is the header.'
        toast.error(`Missing required column${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}. ${foundList}`, { duration: 6000 })
        return
      }

      const parsed: ParsedRow[] = result.data
        .map((row): ParsedRow | null => {
          const rawAmt = (row[amountCol!] ?? '').replace(/[₪$€£,\s]/g, '').replace(/\((.+)\)/, '-$1')
          const amount = parseFloat(rawAmt)
          const description = (row[descCol!] ?? '').trim()
          if (!description || isNaN(amount) || amount === 0) return null
          return {
            date: parseDate(row[dateCol!] ?? ''),
            description,
            amount: Math.abs(amount),
            type: 'expense' as const,
            category: categorizeByKeyword(description, categoryRules),
          }
        })
        .filter((r): r is ParsedRow => r !== null)

      if (parsed.length === 0) {
        toast.error('No valid expense rows found in the CSV.')
        return
      }

      setFileName(file.name)
      setRows(parsed)
      setStage('preview')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to read file.'
      toast.error(`CSV error: ${msg}`)
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) void handleFile(file)
    // Reset so the same file can be selected again
    e.target.value = ''
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
    onImport(txns, {
      bankAccountId: null,
      creditCardId: cardId,
      fileName,
      transactionCount: rows.length,
      totalAmount,
      importedAt: new Date().toISOString(),
    })
    setStage('idle')
    setRows([])
    toast.success(`Imported ${rows.length} transactions`)
  }

  if (stage === 'idle') {
    return (
      <div className="flex flex-col gap-3">
        {/* Card selector — only shown when multiple cards exist */}
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

        {/* Drop zone — using <label> for reliable file input triggering */}
        <label
          htmlFor={UNIQUE_INPUT_ID}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors block"
          style={{
            borderColor: isDragging ? '#7c3aed' : 'var(--color-border)',
            background: isDragging ? '#7c3aed10' : 'transparent',
          }}
        >
          <Upload size={24} className="mx-auto mb-2" style={{ color: 'var(--color-text-secondary)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            Drop CSV here or tap to browse
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Required columns: Date · Description · Amount
          </p>
          <input
            id={UNIQUE_INPUT_ID}
            type="file"
            accept=".csv,text/csv,application/csv"
            className="hidden"
            onChange={handleInputChange}
          />
        </label>
      </div>
    )
  }

  // ── Preview stage ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle size={16} style={{ color: '#22C55E' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {rows.length} expenses from <span className="font-semibold">{fileName}</span>
          </span>
        </div>
        <button onClick={() => { setStage('idle'); setRows([]) }} style={{ color: 'var(--color-text-secondary)' }}>
          <X size={16} />
        </button>
      </div>

      <CSVPreviewTable rows={rows} onCategoryChange={updateCategory} onDescriptionChange={updateDescription} />

      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={() => { setStage('idle'); setRows([]) }}>Cancel</Button>
        <Button variant="primary" className="flex-1" onClick={handleConfirm}>
          Import {rows.length} expenses
        </Button>
      </div>
    </div>
  )
}
