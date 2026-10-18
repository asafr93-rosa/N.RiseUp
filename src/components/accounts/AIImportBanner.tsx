import { useState, useEffect } from 'react'
import { Sparkles, X } from 'lucide-react'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import type { CreditCard, Transaction } from '../../store/useFinanceStore'
import { formatCurrency } from '../../lib/formatters'

interface PendingImport {
  transactions: Omit<Transaction, 'id' | 'createdAt'>[]
  sourceFile: string
  cardLastFour: string
  statementDate: string
  createdAt: string
}

type BatchMeta = {
  bankAccountId: null
  creditCardId: string
  fileName: string
  transactionCount: number
  totalAmount: number
  importedAt: string
}

interface Props {
  creditCards: CreditCard[]
  onImport: (txns: Omit<Transaction, 'id' | 'createdAt'>[], meta: BatchMeta) => void
}

const PROCESSED_KEY = 'nriseup-processed-imports'

export default function AIImportBanner({ creditCards, onImport }: Props) {
  const [pending, setPending] = useState<PendingImport | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedCardId, setSelectedCardId] = useState('')

  useEffect(() => {
    fetch('/pending-import.json', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data: PendingImport) => {
        if (!data.transactions?.length) return
        const processed: string[] = JSON.parse(localStorage.getItem(PROCESSED_KEY) ?? '[]')
        if (processed.includes(data.sourceFile + data.createdAt)) return
        setPending(data)
        const match = creditCards.find((c) => c.lastFourDigits === data.cardLastFour)
        setSelectedCardId(match?.id ?? creditCards[0]?.id ?? '')
      })
      .catch(() => {})
  }, [creditCards])

  if (!pending || dismissed) return null

  function handleImport() {
    if (!pending || !selectedCardId) return
    const txns = pending.transactions.map((t) => ({ ...t, creditCardId: selectedCardId }))
    const totalAmount = txns.reduce((s, t) => s + t.amount, 0)
    onImport(txns, {
      bankAccountId: null,
      creditCardId: selectedCardId,
      fileName: pending.sourceFile,
      transactionCount: txns.length,
      totalAmount,
      importedAt: new Date().toISOString(),
    })
    const processed: string[] = JSON.parse(localStorage.getItem(PROCESSED_KEY) ?? '[]')
    processed.push(pending.sourceFile + pending.createdAt)
    localStorage.setItem(PROCESSED_KEY, JSON.stringify(processed))
    setPending(null)
    setShowModal(false)
  }

  const total = pending.transactions.reduce((s, t) => s + t.amount, 0)

  return (
    <>
      <div
        className="rounded-xl p-3 flex items-center gap-3"
        style={{ background: 'var(--color-accent)1a', border: '1px solid var(--color-accent)40' }}
      >
        <Sparkles size={16} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {pending.transactions.length} transactions ready to import
          </p>
          <p className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>
            {pending.sourceFile}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowModal(true)}>Import</Button>
        <button onClick={() => setDismissed(true)} style={{ color: 'var(--color-text-secondary)' }}>
          <X size={14} />
        </button>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Import AI-Classified Transactions">
        <div className="flex flex-col gap-4">
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {pending.transactions.length} expenses · {formatCurrency(total)} total
            <br />
            <span className="text-xs">Recurring purchases already excluded.</span>
          </p>

          <div className="flex flex-col gap-2">
            {creditCards.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCardId(c.id)}
                className="flex items-center justify-between px-4 py-3 rounded-xl transition-colors"
                style={{
                  background: selectedCardId === c.id ? 'var(--color-accent)20' : 'var(--color-surface)',
                  border: `2px solid ${selectedCardId === c.id ? 'var(--color-accent)' : 'transparent'}`,
                }}
              >
                <div className="text-left">
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{c.name}</p>
                  {c.lastFourDigits && (
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>···· {c.lastFourDigits}</p>
                  )}
                </div>
                <div
                  className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                  style={{ borderColor: selectedCardId === c.id ? 'var(--color-accent)' : 'var(--color-border)' }}
                >
                  {selectedCardId === c.id && (
                    <div className="w-2 h-2 rounded-full" style={{ background: 'var(--color-accent)' }} />
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>Back</Button>
            <Button variant="primary" className="flex-1" onClick={handleImport} disabled={!selectedCardId}>
              Import {pending.transactions.length} expenses
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
