import { AlertTriangle } from 'lucide-react'
import { formatCurrency } from '../../lib/formatters'
import type { BankAccount, Investment, RecommendationResource } from '../../store/useFinanceStore'

interface Props {
  accounts: BankAccount[]
  effectiveBalances: Record<string, number>
  filterMonthKey: string
  investments: Investment[]
  priorities: RecommendationResource[]
}

function buildSuggestions(
  negativeAccount: BankAccount,
  deficit: number,
  allAccounts: BankAccount[],
  effectiveBalances: Record<string, number>,
  filterMonthKey: string,
  investments: Investment[],
  priorities: RecommendationResource[]
): string[] {
  const suggestions: string[] = []

  const tryAdd = (text: string) => {
    if (suggestions.length < 3) suggestions.push(text)
  }

  // If no priorities configured, generate generic fallback suggestions
  if (priorities.length === 0) {
    const donor = allAccounts
      .filter((a) => a.id !== negativeAccount.id && (effectiveBalances[a.id] ?? 0) > 0)
      .sort((a, b) => (effectiveBalances[b.id] ?? 0) - (effectiveBalances[a.id] ?? 0))[0]
    if (donor) tryAdd(`Transfer funds from ${donor.name} (${formatCurrency(effectiveBalances[donor.id] ?? 0)} available)`)
    const dep = negativeAccount.depositHistory?.[filterMonthKey] ?? 0
    if (dep > 0) tryAdd(`Use ${negativeAccount.name} deposit (${formatCurrency(dep)} available)`)
    if (investments.length > 0) {
      const inv = investments.sort((a, b) => b.currentValue - a.currentValue)[0]
      tryAdd(`Consider liquidating part of ${inv.name} (${formatCurrency(inv.currentValue)} available)`)
    }
    return suggestions
  }

  for (const resource of priorities) {
    if (suggestions.length >= 3) break

    if (resource.type === 'account') {
      if (resource.accountId === negativeAccount.id) continue
      const bal = effectiveBalances[resource.accountId] ?? 0
      if (bal <= 0) continue
      const acc = allAccounts.find((a) => a.id === resource.accountId)
      if (!acc) continue
      tryAdd(`Transfer from ${acc.name} (${formatCurrency(bal)} available)`)
    } else if (resource.type === 'deposit') {
      const acc = allAccounts.find((a) => a.id === resource.accountId)
      if (!acc) continue
      const dep = acc.depositHistory?.[filterMonthKey] ?? 0
      if (dep <= 0) continue
      const use = Math.min(dep, Math.abs(deficit))
      tryAdd(`Use ${acc.name} deposit — ${formatCurrency(use)} of ${formatCurrency(dep)} available`)
    } else if (resource.type === 'investment') {
      const inv = investments.find((i) => i.id === resource.investmentId)
      if (!inv) continue
      tryAdd(`Consider liquidating part of ${inv.name} (${formatCurrency(inv.currentValue)} available)`)
    }
  }

  return suggestions
}

export default function RecommendationSection({ accounts, effectiveBalances, filterMonthKey, investments, priorities }: Props) {
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
          const suggestions = buildSuggestions(account, balance, accounts, effectiveBalances, filterMonthKey, investments, priorities)

          return (
            <div key={account.id} className="px-4 py-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {account.name}{account.lastFourDigits ? ` ···· ${account.lastFourDigits}` : ''}
                </p>
                <p className="text-sm font-bold" style={{ color: '#EF4444' }}>{formatCurrency(balance)}</p>
              </div>

              {suggestions.length > 0 && (
                <ol className="flex flex-col gap-1.5 pl-1">
                  {suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      <span className="shrink-0 font-semibold" style={{ color: '#F59E0B' }}>{i + 1}.</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
