import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import AnimatedCounter from '../ui/AnimatedCounter'
import { formatCurrency, INVESTMENT_TYPE_LABELS, INVESTMENT_TYPE_COLORS } from '../../lib/formatters'
import type { Investment } from '../../store/useFinanceStore'

interface Props {
  investments: Investment[]
}

export default function InvestmentSummary({ investments }: Props) {
  const total = investments.reduce((s, i) => s + i.currentValue, 0)
  const totalAnnualFee = investments.reduce((s, i) => {
    return s +
      (i.currentValue * i.managementFeeAccumulationPct) / 100 +
      (i.monthlyContribution * 12 * i.managementFeeContributionPct) / 100
  }, 0)

  const byType: Record<string, number> = {}
  for (const inv of investments) {
    byType[inv.type] = (byType[inv.type] ?? 0) + inv.currentValue
  }
  const pieData = Object.entries(byType).map(([type, value]) => ({
    name: INVESTMENT_TYPE_LABELS[type as keyof typeof INVESTMENT_TYPE_LABELS] ?? type,
    value,
    color: INVESTMENT_TYPE_COLORS[type as keyof typeof INVESTMENT_TYPE_COLORS] ?? '#9ca3af',
  }))

  return (
    <div className="card p-4 mb-4">
      <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
        Total Investments
      </span>
      <AnimatedCounter value={total} className="text-3xl font-bold block mt-1" />

      {totalAnnualFee > 0 && (
        <p className="text-sm mt-1" style={{ color: '#EF4444' }}>
          ~{formatCurrency(totalAnnualFee)} estimated annual fees
        </p>
      )}

      {pieData.length > 1 && (
        <div className="mt-4" style={{ height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v) => [formatCurrency(Number(v)), '']} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
