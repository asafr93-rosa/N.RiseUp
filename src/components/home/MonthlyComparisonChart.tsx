import { useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { differenceInCalendarMonths, startOfMonth, parseISO } from 'date-fns'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useFinanceStore } from '../../store/useFinanceStore'
import { getExpensesByMonth } from '../../lib/chartHelpers'

const DEFAULT_MONTHS = 3
const BAR_MIN_WIDTH_PX = 56

export default function MonthlyComparisonChart() {
  const transactions = useFinanceStore((s) => s.transactions)
  const recurringExpenses = useFinanceStore((s) => s.recurringExpenses)
  const incomeEntries = useFinanceStore((s) => s.incomeEntries)
  const [expanded, setExpanded] = useState(false)

  // How many months of real history exist (earliest transaction/income to now)
  const totalMonths = useMemo(() => {
    const dates = [...transactions.map((t) => t.date), ...incomeEntries.map((e) => e.date)]
    if (dates.length === 0) return DEFAULT_MONTHS
    const earliest = dates.reduce((min, d) => (d < min ? d : min), dates[0])
    try {
      const diff = differenceInCalendarMonths(startOfMonth(new Date()), startOfMonth(parseISO(earliest))) + 1
      return Math.max(DEFAULT_MONTHS, diff)
    } catch {
      return DEFAULT_MONTHS
    }
  }, [transactions, incomeEntries])

  const hasMore = totalMonths > DEFAULT_MONTHS
  const monthsToShow = expanded ? totalMonths : DEFAULT_MONTHS

  const data = useMemo(() => {
    const months = getExpensesByMonth(transactions, monthsToShow)
    const activeRecurringTotal = recurringExpenses
      .filter((r) => r.isActive)
      .reduce((s, r) => s + r.amount, 0)
    const currentMonthKey = new Date().toISOString().slice(0, 7)
    return months.map((m) => {
      // incomeEntries are stored separately from transactions — add them in
      const entryIncome = incomeEntries
        .filter((e) => e.date.startsWith(m.monthKey))
        .reduce((s, e) => s + e.amount, 0)
      return {
        month: m.month,
        Expenses: m.monthKey === currentMonthKey ? m.expenses + activeRecurringTotal : m.expenses,
        Income: m.income + entryIncome,
      }
    })
  }, [transactions, recurringExpenses, incomeEntries, monthsToShow])

  if (data.every((d) => d.Expenses === 0 && d.Income === 0)) return null

  const needsScroll = monthsToShow > 6
  const chartWidthPx = needsScroll ? monthsToShow * BAR_MIN_WIDTH_PX : undefined

  return (
    <div className="card p-4 mb-4">
      <p className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
        {expanded ? `Last ${monthsToShow} Months` : 'Last 3 Months'}
      </p>
      <div style={{ overflowX: needsScroll ? 'auto' : 'visible' }}>
        <div style={{ width: chartWidthPx ? `${chartWidthPx}px` : '100%', height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barCategoryGap="30%">
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide domain={[0, 'auto']} />
              <Tooltip
                formatter={(v: unknown, name: unknown) => [`₪${Math.round(Number(v)).toLocaleString()}`, String(name)]}
                labelFormatter={(label: unknown) => String(label)}
                contentStyle={{
                  background: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: 'var(--color-text-primary)', fontWeight: 600, marginBottom: 4 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Expenses" fill="#f87171" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Income" fill="#34d399" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {hasMore && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center justify-center gap-1 w-full text-xs mt-2 py-1.5 rounded-lg"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {expanded ? <>Show Less <ChevronUp size={12} /></> : <>Show More <ChevronDown size={12} /></>}
        </button>
      )}
    </div>
  )
}
