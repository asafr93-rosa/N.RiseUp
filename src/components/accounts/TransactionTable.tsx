import { useState } from 'react'
import { Trash2, ChevronUp, ChevronDown } from 'lucide-react'
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
  onCategoryChange: (id: string, category: ExpenseCategory) => void
  showEmptyState?: boolean
}

const CATEGORIES = Object.entries(CATEGORY_LABELS) as [ExpenseCategory, string][]

export default function TransactionTable({ transactions, accounts, creditCards = [], onDelete, onCategoryChange, showEmptyState = true }: Props) {
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

  const totalExpenses = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)

  function toggleSort(key: SortKey) {
    setSort((s) => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' })
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sort.key !== k) return null
    return sort.dir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
  }

  if (transactions.length === 0) {
    if (!showEmptyState) return null
    return (
      <div className="text-center py-8 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        No transactions found for this period.
      </div>
    )
  }

  return (
    <div>
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: 'Expenses', value: totalExpenses, color: '#EF4444' },
          { label: 'Income', value: totalIncome, color: '#22C55E' },
          { label: 'Net', value: totalIncome - totalExpenses, color: totalIncome >= totalExpenses ? '#22C55E' : '#EF4444' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-3 text-center">
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{label}</p>
            <p className="text-sm font-bold" style={{ color }}>{formatCurrency(Math.abs(value))}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 px-3 py-2 text-xs font-medium border-b" style={{ color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)', background: 'var(--color-card)' }}>
          <button className="col-span-2 text-left flex items-center gap-1" onClick={() => toggleSort('date')}>Date <SortIcon k="date" /></button>
          <button className="col-span-4 text-left flex items-center gap-1" onClick={() => toggleSort('description')}>Description <SortIcon k="description" /></button>
          <span className="col-span-3">Category</span>
          <button className="col-span-2 text-right flex items-center justify-end gap-1" onClick={() => toggleSort('amount')}>Amount <SortIcon k="amount" /></button>
          <span className="col-span-1" />
        </div>

        <div className="divide-y divide-[var(--color-border)]">
          {sorted.map((t) => (
            <div key={t.id} className="grid grid-cols-12 px-3 py-2.5 items-center text-xs" style={{ borderColor: 'var(--color-border)' }}>
              <span className="col-span-2" style={{ color: 'var(--color-text-secondary)' }}>{formatDate(t.date)}</span>
              <div className="col-span-4 truncate pr-1">
                <span style={{ color: 'var(--color-text-primary)' }}>{t.description}</span>
                <span className="block text-xs" style={{ color: 'var(--color-text-secondary)' }}>{accountMap[t.creditCardId ?? t.bankAccountId ?? ''] ?? ''}</span>
              </div>
              <div className="col-span-3">
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
              <span className="col-span-2 text-right font-medium" style={{ color: t.type === 'income' ? '#22C55E' : '#EF4444' }}>
                {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
              </span>
              <div className="col-span-1 flex justify-end">
                <button onClick={() => onDelete(t.id)} className="p-1 rounded" style={{ color: 'var(--color-text-secondary)' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
