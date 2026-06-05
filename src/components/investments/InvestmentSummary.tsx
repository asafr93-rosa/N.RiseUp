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

  const { total, totalAnnualFee } = useMemo(() => {
    const t = investments.reduce((s, i) =>
      s + convertAmount(i.currentValue, (i.currency ?? 'ILS') as SupportedCurrency, displayCurrency, exchangeRates), 0)
    const fee = investments.reduce((s, i) => {
      const invCurrency = (i.currency ?? 'ILS') as SupportedCurrency
      const contribCurrency = (i.contributionCurrency ?? 'ILS') as SupportedCurrency
      return s +
        convertAmount(i.currentValue, invCurrency, displayCurrency, exchangeRates) * i.managementFeeAccumulationPct / 100 +
        convertAmount(i.monthlyContribution, contribCurrency, displayCurrency, exchangeRates) * 12 * i.managementFeeContributionPct / 100
    }, 0)
    return { total: t, totalAnnualFee: fee }
  }, [investments, displayCurrency, exchangeRates])

  return (
    <div className="card p-4 mb-4">
      <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
        Total Investments
      </span>
      <AnimatedCounter value={total} alreadyConverted className="text-3xl font-bold block mt-1" />

      {totalAnnualFee > 0 && (
        <p className="text-sm mt-1" style={{ color: '#f43f5e' }}>
          ~{formatCurrencyIn(totalAnnualFee, displayCurrency)} estimated annual fees
        </p>
      )}
    </div>
  )
}
