import { Pencil, Trash2 } from 'lucide-react'
import Badge from '../ui/Badge'
import { formatCurrency, formatPercent, ASSET_TYPE_LABELS, ASSET_TYPE_COLORS } from '../../lib/formatters'
import type { Asset } from '../../store/useFinanceStore'

interface Props {
  asset: Asset
  onEdit: () => void
  onDelete: () => void
}

export default function AssetCard({ asset, onEdit, onDelete }: Props) {
  const profit = asset.estimatedValue - asset.originalPurchaseCost
  const profitPct = asset.originalPurchaseCost > 0
    ? (profit / asset.originalPurchaseCost) * 100
    : null
  const isProfit = profit >= 0
  const color = ASSET_TYPE_COLORS[asset.type]

  return (
    <div className="card p-4 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge label={ASSET_TYPE_LABELS[asset.type]} color={color} small />
          </div>
          <h3 className="font-semibold text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>
            {asset.name}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            Purchased {new Date(asset.purchaseDate).toLocaleDateString('en-GB')}
          </p>
        </div>

        <div className="flex gap-1 shrink-0">
          <button
            onClick={onEdit}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--color-text-secondary)', background: 'var(--color-card)' }}
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg transition-colors"
            style={{ color: '#EF4444', background: 'var(--color-card)' }}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="flex items-end justify-between mt-3">
        <div>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Current Value</p>
          <p className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {formatCurrency(asset.estimatedValue)}
          </p>
        </div>

        {asset.originalPurchaseCost > 0 && (
          <div className="text-right">
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>vs. Purchase</p>
            <p
              className="text-sm font-semibold"
              style={{ color: isProfit ? '#22C55E' : '#EF4444' }}
            >
              {isProfit ? '+' : ''}{formatCurrency(profit)}
              {profitPct !== null && (
                <span className="text-xs ml-1">({formatPercent(profitPct, 1)})</span>
              )}
            </p>
          </div>
        )}
      </div>

      {asset.notes && (
        <p className="text-xs mt-2 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
          {asset.notes}
        </p>
      )}
    </div>
  )
}
