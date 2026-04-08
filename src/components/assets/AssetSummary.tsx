import AnimatedCounter from '../ui/AnimatedCounter'
import { formatCurrency } from '../../lib/formatters'
import type { Asset } from '../../store/useFinanceStore'

interface Props {
  assets: Asset[]
}

export default function AssetSummary({ assets }: Props) {
  const total = assets.reduce((s, a) => s + a.estimatedValue, 0)
  const totalCost = assets.reduce((s, a) => s + a.originalPurchaseCost, 0)
  const profit = total - totalCost
  const isProfit = profit >= 0

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
    </div>
  )
}
