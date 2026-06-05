import { CATEGORY_LABELS } from '../../lib/formatters'
import type { ExpenseCategory } from '../../store/useFinanceStore'

interface Props {
  category: ExpenseCategory | 'all'
  onCategoryChange: (c: ExpenseCategory | 'all') => void
}

export default function TransactionFilters({ category, onCategoryChange }: Props) {
  return (
    <div className="mb-3">
      <select
        value={category}
        onChange={(e) => onCategoryChange(e.target.value as ExpenseCategory | 'all')}
        className="w-full px-3 py-1.5 text-xs rounded-xl outline-none"
        style={{ background: 'var(--color-card)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
      >
        <option value="all">All categories</option>
        {(Object.entries(CATEGORY_LABELS) as [ExpenseCategory, string][]).map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </div>
  )
}
