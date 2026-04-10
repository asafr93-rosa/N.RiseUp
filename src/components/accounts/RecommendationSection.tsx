import { AlertTriangle } from 'lucide-react'
import { formatCurrency } from '../../lib/formatters'
import type { BankAccount, RecommendationPriority } from '../../store/useFinanceStore'

interface Props {
  accounts: BankAccount[]
  effectiveBalances: Record<string, number>
  priorities: RecommendationPriority[]
}

const PRIORITY_LABELS: Record<RecommendationPriority, string> = {
  deposit: 'Use account deposit',
  transfer: 'Transfer between accounts',
  reduce_recurring: 'Reduce fixed expenses',
  reduce_spending: 'Reduce variable spending',
}

function buildSuggestions(
  account: BankAccount,
  deficit: number,
  allAccounts: BankAccount[],
  effectiveBalances: Record<string, number>,
  priorities: RecommendationPriority[]
): string[] {
  const suggestions: string[] = []

  for (const p of priorities) {
    if (suggestions.length >= 3) break
    if (p === 'deposit' && account.deposit > 0) {
      suggestions.push(
        `Use ₪${formatCurrency(Math.min(account.deposit, Math.abs(deficit))).replace(/[^\d,]/g, '')} from your deposit to cover the deficit (₪${formatCurrency(account.deposit)} available)`
      )
    } else if (p === 'transfer') {
      const donor = allAccounts
        .filter((a) => a.id !== account.id && (effectiveBalances[a.id] ?? 0) > 0)
        .sort((a, b) => (effectiveBalances[b.id] ?? 0) - (effectiveBalances[a.id] ?? 0))[0]
      if (donor) {
        suggestions.push(
          `Transfer funds from ${donor.name} (${formatCurrency(effectiveBalances[donor.id] ?? 0)} available)`
        )
      }
    } else if (p === 'reduce_recurring') {
      suggestions.push('Review and pause non-essential fixed expenses linked to this account')
    } else if (p === 'reduce_spending') {
      suggestions.push('Reduce discretionary spending this month to bring balance positive')
    }
  }

  return suggestions
}

export default function RecommendationSection({ accounts, effectiveBalances, priorities }: Props) {
  const negativeAccounts = accounts.filter((a) => (effectiveBalances[a.id] ?? 0) < 0)

  if (negativeAccounts.length === 0) return null

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#F59E0B15', borderLeft: '4px solid #F59E0B' }}
    >
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <AlertTriangle size={16} style={{ color: '#F59E0B' }} />
        <p className="text-sm font-semibold" style={{ color: '#F59E0B' }}>Account Recommendations</p>
      </div>

      <div className="flex flex-col divide-y" style={{ borderColor: '#F59E0B20' }}>
        {negativeAccounts.map((account) => {
          const balance = effectiveBalances[account.id] ?? 0
          const suggestions = buildSuggestions(account, balance, accounts, effectiveBalances, priorities)

          return (
            <div key={account.id} className="px-4 py-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {account.name}
                  {account.lastFourDigits ? ` ···· ${account.lastFourDigits}` : ''}
                </p>
                <p className="text-sm font-bold" style={{ color: '#EF4444' }}>{formatCurrency(balance)}</p>
              </div>

              <ol className="flex flex-col gap-1.5 pl-1">
                {suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    <span className="shrink-0 font-semibold" style={{ color: '#F59E0B' }}>{i + 1}.</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            </div>
          )
        })}
      </div>

      <div className="px-4 pb-3 pt-1">
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          Priority order: {priorities.map((p) => PRIORITY_LABELS[p]).join(' → ')}
        </p>
      </div>
    </div>
  )
}
