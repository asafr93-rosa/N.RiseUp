import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import AnimatedCounter from '../ui/AnimatedCounter'
import { formatCurrency, ASSET_TYPE_LABELS, ASSET_TYPE_COLORS } from '../../lib/formatters'
import type { Asset } from '../../store/useFinanceStore'

interface Props {
  assets: Asset[]
}

export default function AssetSummary({ assets }: Props) {
  const total = assets.reduce((s, a) => s + a.estimatedValue, 0)
  const totalCost = assets.reduce((s, a) => s + a.originalPurchaseCost, 0)
  const profit = total - totalCost
  const isProfit = profit >= 0

  // Group by type for pie chart
  const byType: Record<string, number> = {}
  for (const a of assets) {
    byType[a.type] = (byType[a.type] ?? 0) + a.estimatedValue
  }
  const pieData = Object.entries(byType).map(([type, value]) => ({
    name: ASSET_TYPE_LABELS[type as keyof typeof ASSET_TYPE_LABELS] ?? type,
    value,
    color: ASSET_TYPE_COLORS[type as keyof typeof ASSET_TYPE_COLORS] ?? '#9ca3af',
  }))

  return (
    <div className="card p-4 mb-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
          Total Asset Value
        </span>
      </div>
      <AnimatedCounter value={total} className="text-3xl font-bold" />

      {totalCost > 0 && (
        <p className="text-sm mt-1" style={{ color: isProfit ? '#22C55E' : '#EF4444' }}>
          {isProfit ? '+' : ''}{formatCurrency(profit)} overall {isProfit ? 'gain' : 'loss'}
        </p>
      )}

      {pieData.length > 1 && (
        <div className="mt-4" style={{ height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
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
