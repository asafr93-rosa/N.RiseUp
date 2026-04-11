import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useFinanceStore } from '../../store/useFinanceStore'
import { getExpensesByMonth } from '../../lib/chartHelpers'
import { formatCompact } from '../../lib/formatters'

export default function MonthlyComparisonChart() {
  const transactions = useFinanceStore((s) => s.transactions)
  const recurringExpenses = useFinanceStore((s) => s.recurringExpenses)

  const data = useMemo(() => {
    const months = getExpensesByMonth(transactions, 3)
    const activeRecurringTotal = recurringExpenses
      .filter((r) => r.isActive)
      .reduce((s, r) => s + r.amount, 0)
    const currentMonthKey = new Date().toISOString().slice(0, 7)
    return months.map((m) => ({
      month: m.month,
      Expenses: m.monthKey === currentMonthKey ? m.expenses + activeRecurringTotal : m.expenses,
      Income: m.income,
    }))
  }, [transactions, recurringExpenses])

  if (data.every((d) => d.Expenses === 0 && d.Income === 0)) return null

  return (
    <div className="card p-4 mb-4">
      <p className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
        Last 3 Months
      </p>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} barCategoryGap="30%">
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            formatter={(v: unknown, name: unknown) => [formatCompact(Number(v)), String(name)]}
            contentStyle={{
              background: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="Expenses" fill="#EF4444" radius={[3, 3, 0, 0]} />
          <Bar dataKey="Income" fill="#22C55E" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
