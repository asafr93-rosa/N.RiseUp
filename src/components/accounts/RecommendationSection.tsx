import { AlertTriangle } from 'lucide-react'
import { formatCurrency, convertAmount } from '../../lib/formatters'
import { isExcludedFromRecommendations } from '../../lib/recommendations'
import type { BankAccount, Investment, RecommendationResource, ExchangeRates, SupportedCurrency } from '../../store/useFinanceStore'

interface Props {
  accounts: BankAccount[]
  effectiveBalances: Record<string, number>
  filterMonthKey: string
  investments: Investment[]
  priorities: RecommendationResource[]
  minBalance: number
  rates: ExchangeRates
}

function buildSuggestions(
  needy: BankAccount,
  deficit: number,
  allAccounts: BankAccount[],
  effectiveBalances: Record<string, number>,
  filterMonthKey: string,
  investments: Investment[],
  priorities: RecommendationResource[],
  minBalance: number,
  rates: ExchangeRates
): string[] {
  const suggestions: string[] = []
  let remaining = deficit
  const usedDeposits = new Set<string>()

  // Amounts below are all in ILS (effective balances are already converted)
  const toILS = (amount: number, currency: SupportedCurrency | undefined) =>
    convertAmount(amount, currency ?? 'ILS', 'ILS', rates)
  // What another account can give without dropping below the minimum
  const spare = (id: string) => Math.max(0, (effectiveBalances[id] ?? 0) - minBalance)
  const depositOf = (acc: BankAccount) => toILS(acc.depositHistory?.[filterMonthKey] ?? 0, acc.currency)
  const eligible = (acc: BankAccount | undefined): acc is BankAccount => !!acc && !isExcludedFromRecommendations(acc)

  const consume = (text: string, amount: number) => {
    suggestions.push(text)
    remaining -= amount
  }

  const useDeposit = (acc: BankAccount) => {
    if (remaining <= 0 || usedDeposits.has(acc.id)) return
    usedDeposits.add(acc.id)
    const dep = depositOf(acc)
    if (dep <= 0) return
    const use = Math.min(dep, remaining)
    consume(acc.id === needy.id
      ? `Withdraw ${formatCurrency(use)} from your ${acc.name} deposit`
      : `Withdraw ${formatCurrency(use)} from ${acc.name} deposit`, use)
  }

  // 1. The account's own deposit always comes first — no transfer needed
  useDeposit(needy)

  if (priorities.length === 0) {
    // Fallback: drain donors largest-first, then their deposits, then investments
    const donors = allAccounts
      .filter((a) => a.id !== needy.id && eligible(a) && spare(a.id) > 0)
      .sort((a, b) => spare(b.id) - spare(a.id))
    for (const donor of donors) {
      if (remaining <= 0) break
      const use = Math.min(spare(donor.id), remaining)
      consume(`Transfer ${formatCurrency(use)} from ${donor.name}`, use)
    }
    for (const acc of allAccounts) {
      if (acc.id !== needy.id && eligible(acc)) useDeposit(acc)
    }
    if (remaining > 0) {
      const sorted = [...investments].sort((a, b) => toILS(b.currentValue, b.currency) - toILS(a.currentValue, a.currency))
      for (const inv of sorted) {
        if (remaining <= 0) break
        const use = Math.min(toILS(inv.currentValue, inv.currency), remaining)
        if (use > 0) consume(`Liquidate ${formatCurrency(use)} from ${inv.name}`, use)
      }
    }
    return suggestions
  }

  for (const resource of priorities) {
    if (remaining <= 0) break

    if (resource.type === 'account') {
      if (resource.accountId === needy.id) continue
      const acc = allAccounts.find((a) => a.id === resource.accountId)
      if (!eligible(acc)) continue
      const avail = spare(acc.id)
      if (avail <= 0) continue
      const use = Math.min(avail, remaining)
      consume(`Transfer ${formatCurrency(use)} from ${acc.name}`, use)
    } else if (resource.type === 'deposit') {
      const acc = allAccounts.find((a) => a.id === resource.accountId)
      if (!eligible(acc)) continue
      useDeposit(acc)
    } else if (resource.type === 'investment') {
      const inv = investments.find((i) => i.id === resource.investmentId)
      if (!inv) continue
      const use = Math.min(toILS(inv.currentValue, inv.currency), remaining)
      if (use > 0) consume(`Liquidate ${formatCurrency(use)} from ${inv.name}`, use)
    }
  }

  return suggestions
}

export default function RecommendationSection({ accounts, effectiveBalances, filterMonthKey, investments, priorities, minBalance, rates }: Props) {
  const negativeAccounts = accounts.filter((a) => !isExcludedFromRecommendations(a) && (effectiveBalances[a.id] ?? 0) < minBalance)

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
          const shortfall = minBalance - balance
          const suggestions = buildSuggestions(account, shortfall, accounts, effectiveBalances, filterMonthKey, investments, priorities, minBalance, rates)

          return (
            <div key={account.id} className="px-4 py-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {account.name}{account.lastFourDigits ? ` ···· ${account.lastFourDigits}` : ''}
                </p>
                <p className="text-sm font-bold" style={{ color: '#f87171' }}>{formatCurrency(balance)}</p>
              </div>
              {minBalance > 0 && (
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {formatCurrency(shortfall)} needed to reach the {formatCurrency(minBalance)} minimum
                </p>
              )}

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
