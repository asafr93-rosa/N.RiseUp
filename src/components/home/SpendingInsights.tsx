import { useMemo, useState } from 'react'
import { addMonths, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import CategoryCard from './CategoryCard'
import CategoryDetailModal from './CategoryDetailModal'
import { getMonthLabel, formatCurrency, CATEGORY_LABELS, CATEGORY_COLORS } from '../../lib/formatters'
import { getMonthExpenses } from '../../lib/chartHelpers'
import { useFinanceStore } from '../../store/useFinanceStore'
import type { ExpenseCategory } from '../../store/useFinanceStore'

interface Props {
  month: Date
  onMonthChange: (m: Date) => void
}

export default function SpendingInsights({ month, onMonthChange }: Props) {
  const transactions = useFinanceStore((s) => s.transactions)
  const recurringExpenses = useFinanceStore((s) => s.recurringExpenses)
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null)

  const summaries = useMemo(() => {
    const txnSummaries = getMonthExpenses(transactions, month)

    // Merge active recurring expenses into category cards by their category field
    const activeRecurring = recurringExpenses.filter((r) => r.isActive)
    if (activeRecurring.length === 0) return txnSummaries

    const merged = txnSummaries.map((s) => ({ ...s }))

    for (const r of activeRecurring) {
      const existing = merged.find((s) => s.category === r.category)
      if (existing) {
        existing.total += r.amount
      } else {
        merged.push({
          category: r.category as ExpenseCategory,
          label: CATEGORY_LABELS[r.category],
          total: r.amount,
          prevMonthTotal: 0,
          changePct: null,
          fill: CATEGORY_COLORS[r.category],
        })
      }
    }

    return merged.sort((a, b) => b.total - a.total)
  }, [transactions, recurringExpenses, month])

  // Total comes from merged summaries — no double-counting
  const totalExpenses = summaries.reduce((s, c) => s + c.total, 0)
  // Keep for subtitle display only
  const activeRecurringTotal = recurringExpenses.filter((r) => r.isActive).reduce((s, r) => s + r.amount, 0)

  return (
    <div className="mb-4">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Spending Insights
        </p>
        <div className="flex items-center gap-1">
          <button onClick={() => onMonthChange(subMonths(month, 1))} className="p-1 rounded-lg" style={{ color: 'var(--color-text-secondary)', background: 'var(--color-card)' }}>
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-medium px-2" style={{ color: 'var(--color-text-primary)' }}>
            {getMonthLabel(month)}
          </span>
          <button onClick={() => onMonthChange(addMonths(month, 1))} className="p-1 rounded-lg" style={{ color: 'var(--color-text-secondary)', background: 'var(--color-card)' }}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {summaries.length === 0 && activeRecurringTotal === 0 ? (
        <div className="card p-4 text-center">
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No expenses recorded for {getMonthLabel(month)}</p>
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-2 mb-1">
            <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(totalExpenses)}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>total expenses</p>
          </div>
          {activeRecurringTotal > 0 && (
            <p className="text-xs mb-3" style={{ color: 'var(--color-text-secondary)' }}>
              Includes {formatCurrency(activeRecurringTotal)} fixed monthly
            </p>
          )}
          {summaries.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {summaries.map((s) => (
                <CategoryCard key={s.category} summary={s} onClick={() => setSelectedCategory(s.category)} />
              ))}
            </div>
          )}
        </>
      )}
      <CategoryDetailModal
        category={selectedCategory}
        month={month}
        onClose={() => setSelectedCategory(null)}
      />
    </div>
  )
}
