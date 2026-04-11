import { useState } from 'react'
import { Trash2, Pencil, ChevronUp, ChevronDown } from 'lucide-react'
import Badge from '../ui/Badge'
import { formatCurrency, formatDate, CATEGORY_LABELS, CATEGORY_COLORS } from '../../lib/formatters'
import type { Transaction, BankAccount, CreditCard, ExpenseCategory } from '../../store/useFinanceStore'

type SortKey = 'date' | 'amount' | 'description'
type SortDir = 'asc' | 'desc'

interface Props {
  transactions: Transaction[]
  accounts: BankAccount[]
  creditCards?: CreditCard[]
  onDelete: (id: string) => void
  onEdit?: (t: Transaction) => void
  onCategoryChange: (id: string, category: ExpenseCategory) => void
  showEmptyState?: boolean
  selectMode?: boolean
  selectedIds?: Set<string>
  onToggleSelect?: (id: string) => void
  onToggleSelectAll?: (allIds: string[]) => void
}

const CATEGORIES = Object.entries(CATEGORY_LABELS) as [ExpenseCategory, string][]

export default function TransactionTable({
  transactions, accounts, creditCards = [], onDelete, onEdit, onCategoryChange,
  showEmptyState = true, selectMode = false, selectedIds, onToggleSelect, onToggleSelectAll,
}: Props) {
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'date', dir: 'desc' })

  const accountMap: Record<string, string> = {
    ...Object.fromEntries(accounts.map((a) => [a.id, a.name])),
    ...Object.fromEntries(creditCards.map((c) => [c.id, `${c.name}${c.lastFourDigits ? ` ···· ${c.lastFourDigits}` : ''}`])),
  }

  const sorted = [...transactions].sort((a, b) => {
    let cmp = 0
    if (sort.key === 'date') cmp = a.date.localeCompare(b.date)
    else if (sort.key === 'amount') cmp = a.amount - b.amount
    else if (sort.key === 'description') cmp = a.description.localeCompare(b.description)
    return sort.dir === 'asc' ? cmp : -cmp
  })

  function toggleSort(key: SortKey) {
    setSort((s) => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' })
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sort.key !== k) return null
    return sort.dir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
  }

  const allSelected = sorted.length > 0 && sorted.every((t) => selectedIds?.has(t.id))

  if (transactions.length === 0) {
    if (!showEmptyState) return null
    return (
      <div className="text-center py-8 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        No transactions found for this period.
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div
        className="grid px-3 py-2 text-xs font-medium border-b"
        style={{
          gridTemplateColumns: selectMode ? '24px 1fr 2fr 1.5fr 1fr 40px' : '1fr 2fr 1.5fr 1fr 40px',
          color: 'var(--color-text-secondary)',
          borderColor: 'var(--color-border)',
          background: 'var(--color-card)',
        }}
      >
        {selectMode && (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() => onToggleSelectAll?.(sorted.map((t) => t.id))}
              className="rounded"
            />
          </div>
        )}
        <button className="text-left flex items-center gap-1" onClick={() => toggleSort('date')}>Date <SortIcon k="date" /></button>
        <button className="text-left flex items-center gap-1" onClick={() => toggleSort('description')}>Description <SortIcon k="description" /></button>
        <span>Category</span>
        <button className="text-right flex items-center justify-end gap-1" onClick={() => toggleSort('amount')}>Amount <SortIcon k="amount" /></button>
        <span />
      </div>

      <div className="divide-y divide-[var(--color-border)]">
        {sorted.map((t) => (
          <div
            key={t.id}
            className="grid px-3 py-2.5 items-center text-xs"
            style={{
              gridTemplateColumns: selectMode ? '24px 1fr 2fr 1.5fr 1fr 40px' : '1fr 2fr 1.5fr 1fr 40px',
              background: selectedIds?.has(t.id) ? 'var(--color-accent-light)' : undefined,
            }}
          >
            {selectMode && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedIds?.has(t.id) ?? false}
                  onChange={() => onToggleSelect?.(t.id)}
                  className="rounded"
                />
              </div>
            )}
            <span style={{ color: 'var(--color-text-secondary)' }}>{formatDate(t.date)}</span>
            <div className="truncate pr-1">
              <span style={{ color: 'var(--color-text-primary)' }}>{t.description}</span>
              <span className="block text-xs" style={{ color: 'var(--color-text-secondary)' }}>{accountMap[t.creditCardId ?? t.bankAccountId ?? ''] ?? ''}</span>
            </div>
            <div>
              {t.type === 'expense' ? (
                <select
                  value={t.category}
                  onChange={(e) => onCategoryChange(t.id, e.target.value as ExpenseCategory)}
                  className="w-full text-xs px-1 py-0.5 rounded-lg outline-none"
                  style={{ background: `${CATEGORY_COLORS[t.category]}20`, color: CATEGORY_COLORS[t.category], border: 'none', maxWidth: '100%' }}
                >
                  {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              ) : (
                <Badge label="Income" color="#22C55E" small />
              )}
            </div>
            <span className="text-right font-medium" style={{ color: t.type === 'income' ? '#22C55E' : '#EF4444' }}>
              {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
            </span>
            <div className="flex justify-end gap-0.5">
              {onEdit && (
                <button onClick={() => onEdit(t)} className="p-1 rounded" style={{ color: 'var(--color-text-secondary)' }}>
                  <Pencil size={12} />
                </button>
              )}
              {!selectMode && (
                <button onClick={() => onDelete(t.id)} className="p-1 rounded" style={{ color: 'var(--color-text-secondary)' }}>
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
