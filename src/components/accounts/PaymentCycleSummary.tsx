import { formatCurrency, formatDate } from '../../lib/formatters'
import type { CreditCard, Transaction } from '../../store/useFinanceStore'

interface Props {
  creditCards: CreditCard[]
  transactions: Transaction[]
}

function getNextCycleInfo(card: CreditCard, today: Date): { cycleStart: string; nextPaymentDate: string } {
  const year = today.getFullYear()
  const month = today.getMonth()
  const day = today.getDate()

  const pad = (n: number) => String(n).padStart(2, '0')

  if (day < card.paymentCycleDay) {
    // Next payment is this month's cycle day; cycle started on 1st of this month
    const cycleStart = `${year}-${pad(month + 1)}-01`
    const nextPaymentDate = `${year}-${pad(month + 1)}-${pad(card.paymentCycleDay)}`
    return { cycleStart, nextPaymentDate }
  } else {
    // Next payment is next month's cycle day; cycle started on this month's cycle day
    const cycleStart = `${year}-${pad(month + 1)}-${pad(card.paymentCycleDay)}`
    const nextDate = new Date(year, month + 1, card.paymentCycleDay)
    const nextPaymentDate = `${nextDate.getFullYear()}-${pad(nextDate.getMonth() + 1)}-${pad(card.paymentCycleDay)}`
    return { cycleStart, nextPaymentDate }
  }
}

export default function PaymentCycleSummary({ creditCards, transactions }: Props) {
  if (creditCards.length === 0) return null

  const today = new Date()

  const cardSummaries = creditCards.map((card) => {
    const { cycleStart, nextPaymentDate } = getNextCycleInfo(card, today)
    const cardTxns = transactions.filter(
      (t) =>
        t.creditCardId === card.id &&
        t.type === 'expense' &&
        t.date >= cycleStart &&
        t.date < nextPaymentDate
    )
    const total = cardTxns.reduce((s, t) => s + t.amount, 0)
    return { card, total, nextPaymentDate, count: cardTxns.length }
  })

  const combinedTotal = cardSummaries.reduce((s, c) => s + c.total, 0)

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
          Next Payment Cycle
        </p>
        <p className="text-base font-bold" style={{ color: '#EF4444' }}>
          {formatCurrency(combinedTotal)}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {cardSummaries.map(({ card, total, nextPaymentDate, count }) => (
          <div key={card.id} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: 'var(--color-surface)' }}>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {card.name}{card.lastFourDigits ? ` ···· ${card.lastFourDigits}` : ''}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                Due {formatDate(nextPaymentDate)} · {count} transactions
              </p>
            </div>
            <p className="text-sm font-bold" style={{ color: total > 0 ? '#EF4444' : 'var(--color-text-secondary)' }}>
              {formatCurrency(total)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
