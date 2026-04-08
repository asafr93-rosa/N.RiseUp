import AnimatedCounter from '../ui/AnimatedCounter'
import { formatCurrency } from '../../lib/formatters'
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
    </div>
  )
}
