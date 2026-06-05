import {
  ShoppingCart, Fuel, Shield, ShoppingBag, Heart,
  GraduationCap, Music, Home, Zap, Receipt, MoreHorizontal,
  PawPrint, RefreshCw, ShoppingBasket,
  TrendingUp, TrendingDown, Minus,
} from 'lucide-react'
import { formatCurrency } from '../../lib/formatters'
import type { ExpenseCategory } from '../../store/useFinanceStore'
import type { CategorySummary } from '../../lib/chartHelpers'

const CATEGORY_ICONS: Record<ExpenseCategory, React.ElementType> = {
  food_restaurants: ShoppingCart,
  grocery: ShoppingBasket,
  fuel_transportation: Fuel,
  insurance: Shield,
  shopping_fashion: ShoppingBag,
  health: Heart,
  education: GraduationCap,
  entertainment_leisure: Music,
  housing: Home,
  household_bills: Zap,
  taxes: Receipt,
  pets: PawPrint,
  subscriptions: RefreshCw,
  other: MoreHorizontal,
}

interface Props {
  summary: CategorySummary
}

export default function CategoryCard({ summary }: Props) {
  const Icon = CATEGORY_ICONS[summary.category]
  const { changePct, fill } = summary

  const trendIcon = changePct === null ? null : changePct > 0 ? TrendingUp : changePct < 0 ? TrendingDown : Minus
  const trendColor = changePct === null ? 'var(--color-text-secondary)' : changePct > 0 ? '#f43f5e' : '#10b981'
  const TrendIcon = trendIcon

  return (
    <div className="card p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${fill}20` }}>
          <Icon size={16} style={{ color: fill }} />
        </div>
        <span className="text-xs font-medium truncate" style={{ color: 'var(--color-text-secondary)' }}>
          {summary.label}
        </span>
      </div>
      <p className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
        {formatCurrency(summary.total)}
      </p>
      {TrendIcon && changePct !== null && (
        <div className="flex items-center gap-1">
          <TrendIcon size={12} style={{ color: trendColor }} />
          <span className="text-xs font-medium" style={{ color: trendColor }}>
            {Math.abs(changePct).toFixed(0)}%
          </span>
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>vs last month</span>
        </div>
      )}
    </div>
  )
}
