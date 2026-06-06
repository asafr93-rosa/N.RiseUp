import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useFinanceStore } from '../../store/useFinanceStore'
import { getExpensesByMonth } from '../../lib/chartHelpers'

export default function MonthlyComparisonChart() {
  const transactions = useFinanceStore((s) => s.transactions)
  const recurringExpenses = useFinanceStore((s) => s.recurringExpenses)
  const incomeEntries = useFinanceStore((s) => s.incomeEntries)

  const data = useMemo(() => {
    const months = getExpensesByMonth(transactions, 3)
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
  }, [transactions, recurringExpenses, incomeEntries])

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
  )
}
