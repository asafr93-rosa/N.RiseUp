import { format, parseISO } from 'date-fns'
import type { ExpenseCategory, InvestmentType, AssetType } from '../store/useFinanceStore'

// ── Currency ──────────────────────────────────────────────────────────────────

const ilsFmt = new Intl.NumberFormat('he-IL', {
  style: 'currency',
  currency: 'ILS',
  maximumFractionDigits: 0,
})

const ilsFmtDecimal = new Intl.NumberFormat('he-IL', {
  style: 'currency',
  currency: 'ILS',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatCurrency(amount: number, decimals = false): string {
  return decimals ? ilsFmtDecimal.format(amount) : ilsFmt.format(amount)
}

export function formatCompact(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `₪${(amount / 1_000_000).toFixed(1)}M`
  }
  if (Math.abs(amount) >= 1_000) {
    return `₪${(amount / 1_000).toFixed(0)}K`
  }
  return formatCurrency(amount)
}

// ── Percentages ───────────────────────────────────────────────────────────────

export function formatPercent(value: number, decimals = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`
}

export function formatPercentChange(current: number, previous: number): string | null {
  if (previous === 0) return null
  const change = ((current - previous) / Math.abs(previous)) * 100
  return formatPercent(change)
}

// ── Dates ─────────────────────────────────────────────────────────────────────

export function formatDate(iso: string): string {
  try {
    return format(parseISO(iso), 'dd/MM/yyyy')
  } catch {
    return iso
  }
}

export function getMonthLabel(date: Date): string {
  return format(date, 'MMMM yyyy')
}

export function toMonthPrefix(date: Date): string {
  return format(date, 'yyyy-MM')
}

// ── Labels ────────────────────────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  food_restaurants: 'Food & Restaurants',
  fuel_transportation: 'Fuel & Transport',
  insurance: 'Insurance',
  shopping_fashion: 'Shopping & Fashion',
  health: 'Health',
  education: 'Education',
  entertainment_leisure: 'Entertainment',
  housing: 'Housing',
  household_bills: 'Household Bills',
  taxes: 'Taxes',
  other: 'Other',
}

export const INVESTMENT_TYPE_LABELS: Record<InvestmentType, string> = {
  pension_fund: 'Pension Fund',
  education_fund: 'Education Fund (Keren Hishtalmut)',
  provident_fund: 'Provident Fund (Kupat Gemel)',
  investment_portfolio: 'Investment Portfolio',
  deposit: 'Deposit',
  savings: 'Savings',
  mutual_fund: 'Mutual Fund',
  other: 'Other',
}

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  apartment: 'Apartment',
  land: 'Land',
  vehicle: 'Vehicle',
  other: 'Other',
}

// ── Category colors (for charts + badges) ─────────────────────────────────────

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  food_restaurants: '#f97316',
  fuel_transportation: '#3b82f6',
  insurance: '#8b5cf6',
  shopping_fashion: '#ec4899',
  health: '#10b981',
  education: '#06b6d4',
  entertainment_leisure: '#f59e0b',
  housing: '#6366f1',
  household_bills: '#14b8a6',
  taxes: '#ef4444',
  other: '#9ca3af',
}

export const INVESTMENT_TYPE_COLORS: Record<InvestmentType, string> = {
  pension_fund: '#4361ee',
  education_fund: '#10b981',
  provident_fund: '#f59e0b',
  investment_portfolio: '#8b5cf6',
  deposit: '#06b6d4',
  savings: '#22c55e',
  mutual_fund: '#ec4899',
  other: '#9ca3af',
}

export const ASSET_TYPE_COLORS: Record<AssetType, string> = {
  apartment: '#4361ee',
  land: '#10b981',
  vehicle: '#f59e0b',
  other: '#9ca3af',
}
