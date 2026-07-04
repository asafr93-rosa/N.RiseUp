import { Landmark } from 'lucide-react'
import { formatCurrency } from '../../lib/formatters'

interface Props {
  accountName: string
  monthlyExpenses: number
}

export default function BankTransferCard({ accountName, monthlyExpenses }: Props) {
  return (
    <div className="card p-4 flex flex-col min-h-[140px] animate-fade-in">
      {/* Top: icon */}
      <div className="flex items-center justify-between gap-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: '#0ea5e920' }}
        >
          <Landmark size={16} style={{ color: '#0ea5e9' }} />
        </div>
      </div>

      <div className="flex-1" />

      {/* Bottom: name + details */}
      <div>
        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Bank Transfer
        </p>
        <div className="flex flex-col gap-0.5 mt-0.5">
          <p className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>
            {accountName}
          </p>
          <div className="mt-1.5 mb-1 flex flex-col gap-0.5">
            <div className="flex items-center justify-between border-t pt-0.5" style={{ borderColor: 'var(--color-border)' }}>
              <p className="text-[10px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>Total</p>
              <p
                className="text-xs font-bold"
                style={{ color: monthlyExpenses > 0 ? 'var(--color-expense)' : 'var(--color-text-secondary)' }}
              >
                {formatCurrency(monthlyExpenses)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
