import type { BankAccount } from '../store/useFinanceStore'

/** Foreign-currency accounts are left out of Account Recommendations unless the user opts them in. */
export function isExcludedFromRecommendations(a: BankAccount): boolean {
  return !(a.includeInRecommendations ?? (a.currency ?? 'ILS') === 'ILS')
}
