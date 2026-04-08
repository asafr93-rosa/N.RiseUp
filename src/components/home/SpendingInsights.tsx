import { useState, useMemo } from 'react'
import { addMonths, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import CategoryCard from './CategoryCard'
import { getMonthLabel, formatCurrency } from '../../lib/formatters'
import { getMonthExpenses } from '../../lib/chartHelpers'
import { useFinanceStore } from '../../store/useFinanceStore'

export default function SpendingInsights() {
  const transactions = useFinanceStore((s) => s.transactions)
  const [month, setMonth] = useState(new Date())

  const summaries = useMemo(() => getMonthExpenses(transactions, month), [transactions, month])
  const totalExpenses = summaries.reduce((s, c) => s + c.total, 0)

  return (
    <div className="mb-4">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Spending Insights
        </p>
        <div className="flex items-center gap-1">
          <button onClick={() => setMonth((m) => subMonths(m, 1))} className="p-1 rounded-lg" style={{ color: 'var(--color-text-secondary)', background: 'var(--color-card)' }}>
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-medium px-2" style={{ color: 'var(--color-text-primary)' }}>
            {getMonthLabel(month)}
          </span>
          <button onClick={() => setMonth((m) => addMonths(m, 1))} className="p-1 rounded-lg" style={{ color: 'var(--color-text-secondary)', background: 'var(--color-card)' }}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {summaries.length === 0 ? (
        <div className="card p-4 text-center">
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No expenses recorded for {getMonthLabel(month)}</p>
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-2 mb-3">
            <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(totalExpenses)}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>total expenses</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {summaries.map((s) => <CategoryCard key={s.category} summary={s} />)}
          </div>
        </>
      )}
    </div>
  )
}
