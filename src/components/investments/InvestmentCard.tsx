import { Pencil, Trash2 } from 'lucide-react'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Badge from '../ui/Badge'
import { formatCurrency, formatCompact, formatPercent, INVESTMENT_TYPE_LABELS, INVESTMENT_TYPE_COLORS } from '../../lib/formatters'
import type { Investment } from '../../store/useFinanceStore'

interface Props {
  investment: Investment
  onEdit: () => void
  onDelete: () => void
}

function shortMonth(yyyyMM: string): string {
  const [year, month] = yyyyMM.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleString('en-US', { month: 'short', year: '2-digit' })
}

export default function InvestmentCard({ investment: inv, onEdit, onDelete }: Props) {
  const color = INVESTMENT_TYPE_COLORS[inv.type]
  const annualFee =
    (inv.currentValue * inv.managementFeeAccumulationPct) / 100 +
    (inv.monthlyContribution * 12 * inv.managementFeeContributionPct) / 100

  const showChart = inv.valueHistory && inv.valueHistory.length >= 2
  const chartData = showChart
    ? inv.valueHistory.map((h) => ({ month: shortMonth(h.month), value: h.value }))
    : []

  const sortedHistory = [...(inv.valueHistory ?? [])].sort((a, b) => a.month.localeCompare(b.month))
  const prevEntry = sortedHistory.length >= 2 ? sortedHistory[sortedHistory.length - 2] : null
  const monthlyDiff = prevEntry !== null ? inv.currentValue - prevEntry.value : null
  const monthlyPct = prevEntry !== null && prevEntry.value !== 0
    ? ((inv.currentValue - prevEntry.value) / Math.abs(prevEntry.value)) * 100
    : null

  return (
    <div className="card p-4 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge label={INVESTMENT_TYPE_LABELS[inv.type]} color={color} small />
          </div>
          <h3 className="font-semibold text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>
            {inv.name}
          </h3>
          {inv.managingInstitution && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              {inv.managingInstitution}
            </p>
          )}
        </div>

        <div className="flex gap-1 shrink-0">
          <button onClick={onEdit} className="p-2 rounded-lg" style={{ color: 'var(--color-text-secondary)', background: 'var(--color-card)' }}>
            <Pencil size={15} />
          </button>
          <button onClick={onDelete} className="p-2 rounded-lg" style={{ color: '#EF4444', background: 'var(--color-card)' }}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="mt-3">
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Current Value</p>
        <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {formatCurrency(inv.currentValue)}
        </p>
        {monthlyDiff !== null && monthlyPct !== null && (
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>vs last month</span>
            <span className="text-xs font-semibold" style={{ color: monthlyDiff >= 0 ? '#22C55E' : '#EF4444' }}>
              {monthlyDiff >= 0 ? '+' : ''}{formatCurrency(monthlyDiff)}
            </span>
            <span className="text-xs" style={{ color: monthlyDiff >= 0 ? '#22C55E' : '#EF4444' }}>
              ({formatPercent(monthlyPct)})
            </span>
          </div>
        )}
      </div>

      {showChart && (
        <div className="mt-3" style={{ height: 80 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v) => [formatCompact(Number(v)), 'Value']}
                contentStyle={{
                  background: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  fontSize: 12,
                  color: 'var(--color-text-primary)',
                }}
                cursor={{ fill: 'var(--color-border)', opacity: 0.4 }}
              />
              <Bar dataKey="value" fill="#4361EE" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        {inv.monthlyContribution > 0 && (
          <div className="rounded-lg px-3 py-2" style={{ background: 'var(--color-surface)' }}>
            <p style={{ color: 'var(--color-text-secondary)' }}>Monthly</p>
            <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {formatCurrency(inv.monthlyContribution)}
            </p>
          </div>
        )}
        {(inv.managementFeeContributionPct > 0 || inv.managementFeeAccumulationPct > 0) && (
          <div className="rounded-lg px-3 py-2" style={{ background: 'var(--color-surface)' }}>
            <p style={{ color: 'var(--color-text-secondary)' }}>Fees / yr</p>
            <p className="font-medium" style={{ color: '#EF4444' }}>
              {formatCurrency(annualFee)}
            </p>
          </div>
        )}
      </div>

      {inv.description && (
        <p className="text-xs mt-2 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
          {inv.description}
        </p>
      )}
    </div>
  )
}
