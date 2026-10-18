import type { BankAccount } from '../store/useFinanceStore'

// Accounts never recommended by default (user can still opt them in from Settings)
const DEFAULT_EXCLUDED_NAMES = /bank\s*of\s*america|\bbofa\b|בנק\s*אוף\s*אמריקה/i

/**
 * Account Recommendations cover the user's ILS accounts (e.g. Bank Yahav, One Zero).
 * Foreign-currency accounts and Bank of America are left out unless the user opts them in.
 */
export function isExcludedFromRecommendations(a: BankAccount): boolean {
  if (a.includeInRecommendations !== undefined) return !a.includeInRecommendations
  return (a.currency ?? 'ILS') !== 'ILS' || DEFAULT_EXCLUDED_NAMES.test(a.name)
}
