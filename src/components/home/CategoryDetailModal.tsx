import { useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import Modal from '../ui/Modal'
import { formatCurrency, CATEGORY_LABELS, CATEGORY_COLORS } from '../../lib/formatters'
import { useFinanceStore, type ExpenseCategory } from '../../store/useFinanceStore'
import {
  ShoppingCart, Fuel, Shield, ShoppingBag, Heart,
  GraduationCap, Music, Home, Zap, Receipt, MoreHorizontal,
  PawPrint, RefreshCw, ShoppingBasket,
} from 'lucide-react'

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
  category: ExpenseCategory | null
  month: Date
  onClose: () => void
}

export default function CategoryDetailModal({ category, month, onClose }: Props) {
  const transactions = useFinanceStore((s) => s.transactions)

  const items = useMemo(() => {
    if (!category) return []
    return transactions
      .filter((t) => {
        if (t.type !== 'expense') return false
        if (t.category !== category) return false
        const d = parseISO(t.date)
        return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth()
      })
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [transactions, category, month])

  if (!category) return null

  const Icon = CATEGORY_ICONS[category]
  const fill = CATEGORY_COLORS[category]
  const label = CATEGORY_LABELS[category]
  const total = items.reduce((s, t) => s + t.amount, 0)

  return (
    <Modal open={!!category} onClose={onClose} title={label}>
      {/* Category header */}
      <div className="flex items-center gap-3 mb-4 pb-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${fill}25` }}>
          <Icon size={20} style={{ color: fill }} />
        </div>
        <div>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {items.length} transaction{items.length !== 1 ? 's' : ''}
          </p>
          <p className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {formatCurrency(total)}
          </p>
        </div>
      </div>

      {/* Transaction list */}
      {items.length === 0 ? (
        <p className="text-sm text-center py-6" style={{ color: 'var(--color-text-secondary)' }}>
          No transactions this month
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between py-2.5 px-3 rounded-xl"
              style={{ background: 'var(--color-card)' }}
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                  {t.description}
                </span>
                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {format(parseISO(t.date), 'MMM d')}
                </span>
              </div>
              <span className="text-sm font-semibold shrink-0 ml-3" style={{ color: 'var(--color-expense)' }}>
                {formatCurrency(t.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
