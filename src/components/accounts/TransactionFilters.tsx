import { addMonths, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getMonthLabel } from '../../lib/formatters'
import { CATEGORY_LABELS } from '../../lib/formatters'
import type { BankAccount, ExpenseCategory } from '../../store/useFinanceStore'

interface Props {
  month: Date
  onMonthChange: (d: Date) => void
  category: ExpenseCategory | 'all'
  onCategoryChange: (c: ExpenseCategory | 'all') => void
  accountId: string | 'all'
  onAccountChange: (id: string | 'all') => void
  accounts: BankAccount[]
}

export default function TransactionFilters({ month, onMonthChange, category, onCategoryChange, accountId, onAccountChange, accounts }: Props) {
  return (
    <div className="flex flex-col gap-2 mb-3">
      {/* Month navigator */}
      <div className="flex items-center gap-2">
        <button onClick={() => onMonthChange(subMonths(month, 1))} className="p-1.5 rounded-lg" style={{ color: 'var(--color-text-secondary)', background: 'var(--color-card)' }}>
          <ChevronLeft size={16} />
        </button>
        <span className="flex-1 text-center text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          {getMonthLabel(month)}
        </span>
        <button onClick={() => onMonthChange(addMonths(month, 1))} className="p-1.5 rounded-lg" style={{ color: 'var(--color-text-secondary)', background: 'var(--color-card)' }}>
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="flex gap-2">
        <select value={category} onChange={(e) => onCategoryChange(e.target.value as ExpenseCategory | 'all')} className="flex-1 px-3 py-1.5 text-xs rounded-xl outline-none" style={{ background: 'var(--color-card)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}>
          <option value="all">All categories</option>
          {(Object.entries(CATEGORY_LABELS) as [ExpenseCategory, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>

        {accounts.length > 1 && (
          <select value={accountId} onChange={(e) => onAccountChange(e.target.value)} className="flex-1 px-3 py-1.5 text-xs rounded-xl outline-none" style={{ background: 'var(--color-card)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}>
            <option value="all">All accounts</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        )}
      </div>
    </div>
  )
}
