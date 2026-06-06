import { useMemo } from 'react'
import AnimatedCounter from '../ui/AnimatedCounter'
import { convertAmount, formatCurrencyIn } from '../../lib/formatters'
import { useFinanceStore } from '../../store/useFinanceStore'
import type { Investment, SupportedCurrency } from '../../store/useFinanceStore'

interface Props {
  investments: Investment[]
}

export default function InvestmentSummary({ investments }: Props) {
  const { displayCurrency, exchangeRates } = useFinanceStore((s) => s.appSettings)

  const { total, totalAnnualFee, totalMonthlyChange } = useMemo(() => {
    const t = investments.reduce((s, i) =>
      s + convertAmount(i.currentValue, (i.currency ?? 'ILS') as SupportedCurrency, displayCurrency, exchangeRates), 0)

    const fee = investments.reduce((s, i) => {
      const invCurrency = (i.currency ?? 'ILS') as SupportedCurrency
      const contribCurrency = (i.contributionCurrency ?? 'ILS') as SupportedCurrency
      return s +
        convertAmount(i.currentValue, invCurrency, displayCurrency, exchangeRates) * i.managementFeeAccumulationPct / 100 +
        convertAmount(i.monthlyContribution, contribCurrency, displayCurrency, exchangeRates) * 12 * i.managementFeeContributionPct / 100
    }, 0)

    // Sum monthly changes across all investments (current value vs previous month snapshot)
    let change = 0
    let hasAnyHistory = false
    for (const inv of investments) {
      const sorted = [...(inv.valueHistory ?? [])].sort((a, b) => a.month.localeCompare(b.month))
      if (sorted.length >= 2) {
        const prev = sorted[sorted.length - 2]
        const diff = inv.currentValue - prev.value
        change += convertAmount(diff, (inv.currency ?? 'ILS') as SupportedCurrency, displayCurrency, exchangeRates)
        hasAnyHistory = true
      }
    }

    return { total: t, totalAnnualFee: fee, totalMonthlyChange: hasAnyHistory ? change : null }
  }, [investments, displayCurrency, exchangeRates])

  const changeColor = totalMonthlyChange === null ? 'var(--color-text-secondary)'
    : totalMonthlyChange >= 0 ? '#34d399' : '#f87171'

  return (
    <div className="card p-4 mb-4">
      <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
        Total Investments
      </span>
      <AnimatedCounter value={total} alreadyConverted className="text-3xl font-bold block mt-1" />

      {totalMonthlyChange !== null && (
        <p className="text-sm mt-1 font-medium" style={{ color: changeColor }}>
          {totalMonthlyChange >= 0 ? '▲' : '▼'} {totalMonthlyChange >= 0 ? '+' : ''}
          {formatCurrencyIn(totalMonthlyChange, displayCurrency)} vs last month
        </p>
      )}

      {totalAnnualFee > 0 && (
        <p className="text-sm mt-1" style={{ color: '#f87171' }}>
          ~{formatCurrencyIn(totalAnnualFee, displayCurrency)} estimated annual fees
        </p>
      )}
    </div>
  )
}
