import { useMemo } from 'react'
import AnimatedCounter from '../ui/AnimatedCounter'
import { convertAmount, formatCurrencyIn } from '../../lib/formatters'
import { useFinanceStore } from '../../store/useFinanceStore'
import type { Asset } from '../../store/useFinanceStore'

interface Props {
  assets: Asset[]
}

export default function AssetSummary({ assets }: Props) {
  const { displayCurrency, exchangeRates } = useFinanceStore((s) => s.appSettings)

  const { total, profit, totalCost } = useMemo(() => {
    const t = assets.reduce((s, a) =>
      s + convertAmount(a.estimatedValue, a.currency ?? 'ILS', displayCurrency, exchangeRates), 0)
    const tc = assets.reduce((s, a) =>
      s + convertAmount(a.originalPurchaseCost, a.currency ?? 'ILS', displayCurrency, exchangeRates), 0)
    return { total: t, totalCost: tc, profit: t - tc }
  }, [assets, displayCurrency, exchangeRates])

  const isProfit = profit >= 0

  return (
    <div className="card p-4 mb-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
          Total Asset Value
        </span>
      </div>
      <AnimatedCounter value={total} alreadyConverted className="text-3xl font-bold" />

      {totalCost > 0 && (
        <p className="text-sm mt-1" style={{ color: isProfit ? '#34d399' : '#f87171' }}>
          {isProfit ? '+' : ''}{formatCurrencyIn(profit, displayCurrency)} overall {isProfit ? 'gain' : 'loss'}
        </p>
      )}
    </div>
  )
}
