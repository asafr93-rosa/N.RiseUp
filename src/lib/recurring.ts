import type { RecurringExpense } from '../store/useFinanceStore'

export function toMonthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** True if the recurring expense applies to the given 'YYYY-MM' month. */
export function isRecurringInMonth(r: RecurringExpense, monthKey: string): boolean {
  return r.isActive && (!r.endMonth || monthKey < r.endMonth)
}
