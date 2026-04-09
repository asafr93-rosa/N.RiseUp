import { CATEGORY_LABELS } from '../../lib/formatters'
import type { BankAccount, ExpenseCategory } from '../../store/useFinanceStore'

interface Props {
  category: ExpenseCategory | 'all'
  onCategoryChange: (c: ExpenseCategory | 'all') => void
  accountId: string | 'all'
  onAccountChange: (id: string | 'all') => void
  accounts: BankAccount[]
}

export default function TransactionFilters({ category, onCategoryChange, accountId, onAccountChange, accounts }: Props) {
  return (
    <div className="flex gap-2 mb-3">
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
  )
}
