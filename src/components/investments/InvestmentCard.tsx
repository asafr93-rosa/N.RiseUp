import { Pencil, Trash2 } from 'lucide-react'
import Badge from '../ui/Badge'
import { formatCurrency, INVESTMENT_TYPE_LABELS, INVESTMENT_TYPE_COLORS } from '../../lib/formatters'
import type { Investment } from '../../store/useFinanceStore'

interface Props {
  investment: Investment
  onEdit: () => void
  onDelete: () => void
}

export default function InvestmentCard({ investment: inv, onEdit, onDelete }: Props) {
  const color = INVESTMENT_TYPE_COLORS[inv.type]
  const annualFee =
    (inv.currentValue * inv.managementFeeAccumulationPct) / 100 +
    (inv.monthlyContribution * 12 * inv.managementFeeContributionPct) / 100

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
      </div>

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
