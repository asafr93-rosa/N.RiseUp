import {
  subMonths,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  parseISO,
  format,
} from 'date-fns'
import type { Transaction, BankAccount, ExpenseCategory } from '../store/useFinanceStore'
import { CATEGORY_COLORS, CATEGORY_LABELS } from './formatters'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CategorySummary {
  category: ExpenseCategory
  label: string
  total: number
  prevMonthTotal: number
  changePct: number | null
  fill: string
}

export interface MonthlyData {
  month: string // 'Apr 2026'
  monthKey: string // 'yyyy-MM'
  expenses: number
  income: number
}

export interface BalancePoint {
  date: string
  balance: number
}

export interface CategoryComparisonEntry {
  category: string
  [month: string]: string | number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function expensesInRange(transactions: Transaction[], from: Date, to: Date): Transaction[] {
  return transactions.filter((t) => {
    if (t.type !== 'expense') return false
    try {
      const d = parseISO(t.date)
      return isWithinInterval(d, { start: from, end: to })
    } catch {
      return false
    }
  })
}

function allInRange(transactions: Transaction[], from: Date, to: Date): Transaction[] {
  return transactions.filter((t) => {
    try {
      const d = parseISO(t.date)
      return isWithinInterval(d, { start: from, end: to })
    } catch {
      return false
    }
  })
}

// ── getMonthExpenses — used by SpendingInsights ───────────────────────────────

export function getMonthExpenses(
  transactions: Transaction[],
  month: Date
): CategorySummary[] {
  const from = startOfMonth(month)
  const to = endOfMonth(month)
  const prevFrom = startOfMonth(subMonths(month, 1))
  const prevTo = endOfMonth(subMonths(month, 1))

  const current = expensesInRange(transactions, from, to)
  const prev = expensesInRange(transactions, prevFrom, prevTo)

  // Group by category
  const currentMap: Partial<Record<ExpenseCategory, number>> = {}
  const prevMap: Partial<Record<ExpenseCategory, number>> = {}

  for (const t of current) {
    currentMap[t.category] = (currentMap[t.category] ?? 0) + t.amount
  }
  for (const t of prev) {
    prevMap[t.category] = (prevMap[t.category] ?? 0) + t.amount
  }

  // Build summaries only for categories with spend
  const categories = new Set([
    ...Object.keys(currentMap),
    ...Object.keys(prevMap),
  ]) as Set<ExpenseCategory>

  return Array.from(categories)
    .map((category) => {
      const total = currentMap[category] ?? 0
      const prevMonthTotal = prevMap[category] ?? 0
      const changePct =
        prevMonthTotal > 0 ? ((total - prevMonthTotal) / prevMonthTotal) * 100 : null
      return {
        category,
        label: CATEGORY_LABELS[category],
        total,
        prevMonthTotal,
        changePct,
        fill: CATEGORY_COLORS[category],
      }
    })
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total)
}

// ── getExpensesByCategory — for pie / bar chart ───────────────────────────────

export function getExpensesByCategory(
  transactions: Transaction[],
  from: Date,
  to: Date,
  filterCategory: ExpenseCategory | 'all' = 'all'
): { category: ExpenseCategory; label: string; total: number; fill: string }[] {
  let filtered = expensesInRange(transactions, from, to)
  if (filterCategory !== 'all') {
    filtered = filtered.filter((t) => t.category === filterCategory)
  }

  const map: Partial<Record<ExpenseCategory, number>> = {}
  for (const t of filtered) {
    map[t.category] = (map[t.category] ?? 0) + t.amount
  }

  return Object.entries(map)
    .map(([cat, total]) => ({
      category: cat as ExpenseCategory,
      label: CATEGORY_LABELS[cat as ExpenseCategory],
      total: total ?? 0,
      fill: CATEGORY_COLORS[cat as ExpenseCategory],
    }))
    .sort((a, b) => b.total - a.total)
}

// ── getExpensesByMonth — for bar / line chart ─────────────────────────────────

export function getExpensesByMonth(
  transactions: Transaction[],
  months: number,
  filterAccountId: string | null = null
): MonthlyData[] {
  const now = new Date()
  const result: MonthlyData[] = []

  for (let i = months - 1; i >= 0; i--) {
    const month = subMonths(now, i)
    const from = startOfMonth(month)
    const to = endOfMonth(month)

    let inRange = allInRange(transactions, from, to)
    if (filterAccountId) {
      inRange = inRange.filter((t) => t.bankAccountId === filterAccountId)
    }

    const expenses = inRange
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0)

    const income = inRange
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0)

    result.push({
      month: format(month, 'MMM yy'),
      monthKey: format(month, 'yyyy-MM'),
      expenses,
      income,
    })
  }

  return result
}

// ── getCategoryComparison — grouped bar ───────────────────────────────────────

export function getCategoryComparison(
  transactions: Transaction[],
  monthCount: number
): CategoryComparisonEntry[] {
  const now = new Date()
  const months: { key: string; label: string; from: Date; to: Date }[] = []

  for (let i = monthCount - 1; i >= 0; i--) {
    const m = subMonths(now, i)
    months.push({
      key: format(m, 'yyyy-MM'),
      label: format(m, 'MMM yy'),
      from: startOfMonth(m),
      to: endOfMonth(m),
    })
  }

  // Collect all categories that have any spend
  const allCategories = new Set<ExpenseCategory>()
  for (const { from, to } of months) {
    for (const t of expensesInRange(transactions, from, to)) {
      allCategories.add(t.category)
    }
  }

  return Array.from(allCategories).map((category) => {
    const entry: CategoryComparisonEntry = { category: CATEGORY_LABELS[category] }
    for (const { label, from, to } of months) {
      entry[label] = expensesInRange(transactions, from, to)
        .filter((t) => t.category === category)
        .reduce((s, t) => s + t.amount, 0)
    }
    return entry
  })
}

// ── getBalanceOverTime — line chart ───────────────────────────────────────────
// Reconstructs past balances from current balance by reversing transactions.

export function getBalanceOverTime(
  account: BankAccount,
  transactions: Transaction[],
  months: number
): BalancePoint[] {
  const accountTxns = transactions
    .filter((t) => t.bankAccountId === account.id)
    .sort((a, b) => b.date.localeCompare(a.date)) // newest first

  const now = new Date()
  const cutoff = startOfMonth(subMonths(now, months - 1))

  // Walk backwards from current balance
  const currentMonth = new Date().toISOString().slice(0, 7)
  let balance = (account.balanceHistory?.[currentMonth] ?? 0) + (account.depositHistory?.[currentMonth] ?? 0)
  const points: BalancePoint[] = [
    { date: format(now, 'dd/MM'), balance },
  ]

  for (const t of accountTxns) {
    const d = parseISO(t.date)
    if (d < cutoff) break
    // Reverse the transaction
    balance += t.type === 'income' ? -t.amount : t.amount
    points.push({ date: format(d, 'dd/MM'), balance: Math.max(0, balance) })
  }

  return points.reverse()
}

// ── rangeFromTimeRange — maps ChartTimeRange → { from, to } ──────────────────

export function rangeFromTimeRange(timeRange: string): { from: Date; to: Date; months: number } {
  const now = new Date()
  const to = endOfMonth(now)
  let months = 3

  switch (timeRange) {
    case '1m':
      months = 1
      break
    case '3m':
      months = 3
      break
    case '6m':
      months = 6
      break
    case '1y':
      months = 12
      break
    case 'all':
      months = 24
      break
  }

  return { from: startOfMonth(subMonths(now, months - 1)), to, months }
}
