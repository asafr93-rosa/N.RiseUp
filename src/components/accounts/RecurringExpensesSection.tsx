import { useState } from 'react'
import { ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react'
import Badge from '../ui/Badge'
import { formatCurrency, CATEGORY_LABELS, CATEGORY_COLORS } from '../../lib/formatters'
import type { RecurringExpense } from '../../store/useFinanceStore'

interface Props {
  recurringExpenses: RecurringExpense[]
  onAdd: () => void
  onEdit: (expense: RecurringExpense) => void
  onDelete: (id: string) => void
}

export default function RecurringExpensesSection({ recurringExpenses, onAdd, onEdit, onDelete }: Props) {
  const [expanded, setExpanded] = useState(true)

  const activeTotal = recurringExpenses
    .filter((r) => r.isActive)
    .reduce((s, r) => s + r.amount, 0)

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between p-4"
        onClick={() => setExpanded((v) => !v)}
      >
        <div>
          <p className="text-sm font-semibold text-left" style={{ color: 'var(--color-text-primary)' }}>Fixed Monthly Expenses</p>
          <p className="text-xs text-left" style={{ color: '#EF4444' }}>{formatCurrency(activeTotal)} / month</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onAdd() }}
            className="text-xs font-medium px-3 py-1.5 rounded-lg"
            style={{ background: '#EF444420', color: '#EF4444' }}
          >
            + Add
          </button>
          {expanded ? <ChevronUp size={16} style={{ color: 'var(--color-text-secondary)' }} /> : <ChevronDown size={16} style={{ color: 'var(--color-text-secondary)' }} />}
        </div>
      </button>

      {expanded && (
        <div className="border-t" style={{ borderColor: 'var(--color-border)' }}>
          {recurringExpenses.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: 'var(--color-text-secondary)' }}>
              No recurring expenses yet.
            </p>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {recurringExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between px-4 py-3 gap-3"
                  style={{ opacity: expense.isActive ? 1 : 0.45 }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge
                      label={CATEGORY_LABELS[expense.category]}
                      color={CATEGORY_COLORS[expense.category]}
                      small
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                        {expense.description}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        {expense.dayOfMonth ? `Day ${expense.dayOfMonth} · ` : ''}
                        {expense.isActive ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="text-sm font-bold" style={{ color: '#EF4444' }}>{formatCurrency(expense.amount)}</p>
                    <button onClick={() => onEdit(expense)} className="p-1 rounded" style={{ color: 'var(--color-text-secondary)' }}>
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => onDelete(expense.id)} className="p-1 rounded" style={{ color: 'var(--color-text-secondary)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
