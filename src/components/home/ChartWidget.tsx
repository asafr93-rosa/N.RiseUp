import { useMemo } from 'react'
import { X } from 'lucide-react'
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { useFinanceStore } from '../../store/useFinanceStore'
import type { ChartWidget as ChartWidgetType } from '../../store/useFinanceStore'
import { formatCurrency, CATEGORY_COLORS } from '../../lib/formatters'
import {
  getExpensesByCategory,
  getExpensesByMonth,
  getCategoryComparison,
  getBalanceOverTime,
  rangeFromTimeRange,
} from '../../lib/chartHelpers'

interface Props {
  widget: ChartWidgetType
  onDelete: () => void
}

export default function ChartWidget({ widget, onDelete }: Props) {
  const transactions = useFinanceStore((s) => s.transactions)
  const accounts = useFinanceStore((s) => s.accounts)

  const { from, to, months } = rangeFromTimeRange(widget.timeRange)

  const filteredTxns = useMemo(() => {
    if (!widget.filterAccountId) return transactions
    return transactions.filter((t) => t.bankAccountId === widget.filterAccountId)
  }, [transactions, widget.filterAccountId])

  const data = useMemo(() => {
    switch (widget.dataSource) {
      case 'expenses_by_category':
        return getExpensesByCategory(filteredTxns, from, to, widget.filterCategory)
      case 'expenses_by_month':
        return getExpensesByMonth(filteredTxns, months, widget.filterAccountId)
      case 'balance_over_time': {
        const account = widget.filterAccountId
          ? accounts.find((a) => a.id === widget.filterAccountId)
          : accounts[0]
        if (!account) return []
        return getBalanceOverTime(account, filteredTxns, months)
      }
      case 'category_comparison':
        return getCategoryComparison(filteredTxns, months)
      default:
        return []
    }
  }, [filteredTxns, widget, accounts, from, to, months])

  const tooltipStyle = {
    background: 'var(--color-card)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    fontSize: '12px',
    color: 'var(--color-text-primary)',
  }

  function renderChart() {
    if ((data as unknown[]).length === 0) {
      return (
        <div className="flex items-center justify-center h-40 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          No data for this period
        </div>
      )
    }

    if (widget.chartType === 'pie' && widget.dataSource === 'expenses_by_category') {
      const d = data as ReturnType<typeof getExpensesByCategory>
      return (
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={d} cx="50%" cy="50%" innerRadius={40} outerRadius={75} paddingAngle={2} dataKey="total" nameKey="label">
              {d.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </Pie>
            <Tooltip formatter={(v) => [formatCurrency(Number(v)), '']} contentStyle={tooltipStyle} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      )
    }

    if (widget.dataSource === 'expenses_by_month') {
      const d = data as ReturnType<typeof getExpensesByMonth>
      return (
        <ResponsiveContainer width="100%" height={180}>
          {widget.chartType === 'line' ? (
            <LineChart data={d}>
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={(v) => `₪${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} width={40} />
              <Tooltip formatter={(v) => [formatCurrency(Number(v)), '']} contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="expenses" stroke="#EF4444" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="income" stroke="#22C55E" dot={false} strokeWidth={2} />
            </LineChart>
          ) : (
            <BarChart data={d}>
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={(v) => `₪${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} width={40} />
              <Tooltip formatter={(v) => [formatCurrency(Number(v)), '']} contentStyle={tooltipStyle} />
              <Bar dataKey="expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="income" fill="#22C55E" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      )
    }

    if (widget.dataSource === 'balance_over_time') {
      const d = data as ReturnType<typeof getBalanceOverTime>
      return (
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={d}>
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tickFormatter={(v) => `₪${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} width={40} />
            <Tooltip formatter={(v) => [formatCurrency(Number(v)), 'Balance']} contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="balance" stroke="#4361EE" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      )
    }

    if (widget.dataSource === 'category_comparison') {
      const d = data as ReturnType<typeof getCategoryComparison>
      const months = d.length > 0 ? Object.keys(d[0]).filter((k) => k !== 'category') : []
      const colors = ['#4361EE', '#EF4444', '#22C55E', '#f59e0b', '#8b5cf6']
      return (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={d}>
            <XAxis dataKey="category" tick={{ fontSize: 9 }} />
            <YAxis tickFormatter={(v) => `₪${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} width={40} />
            <Tooltip formatter={(v) => [formatCurrency(Number(v)), '']} contentStyle={tooltipStyle} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
            {months.map((m, i) => <Bar key={m} dataKey={m} fill={colors[i % colors.length]} radius={[3, 3, 0, 0]} />)}
          </BarChart>
        </ResponsiveContainer>
      )
    }

    // Bar chart fallback for expenses_by_category
    const d = data as ReturnType<typeof getExpensesByCategory>
    return (
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={d}>
          <XAxis dataKey="label" tick={{ fontSize: 9 }} />
          <YAxis tickFormatter={(v) => `₪${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} width={40} />
          <Tooltip formatter={(v) => [formatCurrency(Number(v)), '']} contentStyle={tooltipStyle} />
          <Bar dataKey="total" radius={[4, 4, 0, 0]}>
            {d.map((entry, i) => <Cell key={i} fill={CATEGORY_COLORS[entry.category]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <div className="card p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>{widget.title}</p>
        <button onClick={onDelete} className="p-1 rounded-lg" style={{ color: 'var(--color-text-secondary)' }}>
          <X size={14} />
        </button>
      </div>
      {renderChart()}
    </div>
  )
}
