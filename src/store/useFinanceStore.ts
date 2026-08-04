import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ── Types ─────────────────────────────────────────────────────────────────────

export type ExpenseCategory =
  | 'food_restaurants'
  | 'grocery'
  | 'fuel_transportation'
  | 'insurance'
  | 'shopping_fashion'
  | 'health'
  | 'education'
  | 'entertainment_leisure'
  | 'housing'
  | 'household_bills'
  | 'taxes'
  | 'pets'
  | 'subscriptions'
  | 'other'

export type AssetType = 'apartment' | 'land' | 'vehicle' | 'other'

export type InvestmentType =
  | 'pension_fund'
  | 'education_fund'
  | 'provident_fund'
  | 'investment_portfolio'
  | 'deposit'
  | 'savings'
  | 'mutual_fund'
  | 'other'

export type IncomeSource = 'salary' | 'freelance' | 'rental' | 'dividends' | 'other'

export type ChartType = 'bar' | 'pie' | 'line'

export type ChartDataSource =
  | 'expenses_by_category'
  | 'expenses_by_month'
  | 'balance_over_time'
  | 'category_comparison'

export type ChartTimeRange = '1m' | '3m' | '6m' | '1y' | 'all'

export type AppTheme = 'light' | 'dark'

export type SupportedCurrency = 'ILS' | 'USD' | 'EUR' | 'GBP'

export interface ExchangeRates {
  USD_ILS: number
  EUR_ILS: number
  GBP_ILS: number
  lastUpdated: string
}

export interface AppSettings {
  displayCurrency: SupportedCurrency
  enabledCurrencies: SupportedCurrency[]
  exchangeRates: ExchangeRates
}

export interface LockSettings {
  enabled: boolean
  pinHash: string | null          // SHA-256 hex of the 6-digit PIN
  biometricEnabled: boolean       // WebAuthn credential registered
  biometricCredentialId: string | null  // base64-encoded rawId
}

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface BankAccount {
  id: string
  name: string
  lastFourDigits: string
  balanceHistory: Record<string, number>   // 'YYYY-MM' → balance entered by user
  depositHistory: Record<string, number>   // 'YYYY-MM' → deposit entered by user
  currency: SupportedCurrency
  createdAt: string
}

export interface CreditCard {
  id: string
  name: string
  lastFourDigits: string
  paymentCycleDay: number  // 1–28
  bankAccountId: string | null  // linked bank account for balance tracking
  createdAt: string
}

export interface Transaction {
  id: string
  date: string              // ISO YYYY-MM-DD
  amount: number            // always positive
  type: 'expense' | 'income'
  category: ExpenseCategory
  categorySource: 'keyword' | 'user' | 'manual'
  description: string
  bankAccountId: string | null   // null for credit-card-linked transactions
  creditCardId: string | null    // null for bank-account-linked transactions
  transferAccountId: string | null  // bank account chosen for a "Bank Transfer" payment — display only, never affects balance calculations
  importBatchId: string | null
  createdAt: string
}

export interface ImportBatch {
  id: string
  bankAccountId: string | null
  creditCardId: string | null
  fileName: string
  transactionCount: number
  totalAmount: number
  importedAt: string
}

export interface IncomeEntry {
  id: string
  date: string              // ISO YYYY-MM-DD
  amount: number            // always positive
  description: string
  source: IncomeSource
  bankAccountId: string | null  // account to credit when income is added
  createdAt: string
}

export interface RecurringExpense {
  id: string
  description: string
  amount: number
  category: ExpenseCategory
  dayOfMonth: number | null
  isActive: boolean
  bankAccountId: string | null
  creditCardId: string | null
  createdAt: string
}

export type RecommendationResource =
  | { type: 'account'; accountId: string }
  | { type: 'deposit'; accountId: string }
  | { type: 'investment'; investmentId: string }

export interface UserProfile {
  displayName: string
  avatar: string   // base64 dataURL or empty string
  age: number | null
  recommendationPriorities: RecommendationResource[]
}

export interface Asset {
  id: string
  name: string
  type: AssetType
  estimatedValue: number
  purchaseDate: string
  originalPurchaseCost: number
  notes: string
  currency: SupportedCurrency
  createdAt: string
}

export interface ValueHistoryEntry {
  month: string  // 'YYYY-MM'
  value: number
}

export interface Investment {
  id: string
  name: string
  type: InvestmentType
  currentValue: number
  monthlyContribution: number
  managementFeeContributionPct: number
  managementFeeAccumulationPct: number
  managingInstitution: string
  description: string
  openingDate: string
  valueHistory: ValueHistoryEntry[]
  currency: SupportedCurrency
  contributionCurrency: SupportedCurrency
  createdAt: string
  excludeFromNetWorth: boolean
}

export interface ChartWidget {
  id: string
  chartType: ChartType
  dataSource: ChartDataSource
  timeRange: ChartTimeRange
  filterCategory: ExpenseCategory | 'all'
  filterAccountId: string | null
  title: string
  order: number
}

export type CategoryRules = Record<string, ExpenseCategory>

// ── State ─────────────────────────────────────────────────────────────────────

interface FinanceState {
  accounts: BankAccount[]
  creditCards: CreditCard[]
  transactions: Transaction[]
  importBatches: ImportBatch[]
  incomeEntries: IncomeEntry[]
  recurringExpenses: RecurringExpense[]
  assets: Asset[]
  investments: Investment[]
  chartWidgets: ChartWidget[]
  categoryRules: CategoryRules
  theme: AppTheme
  sampleDataLoaded: boolean
  sampleDataDismissed: boolean
  userProfile: UserProfile

  // Account actions
  addAccount: (data: Omit<BankAccount, 'id' | 'createdAt'>) => void
  updateAccount: (id: string, data: Partial<Omit<BankAccount, 'id' | 'createdAt'>>) => void
  deleteAccount: (id: string) => void
  adjustAccountBalance: (id: string, delta: number) => void
  setAccountMonthBalance: (id: string, month: string, balance: number, deposit: number) => void

  // Credit card actions
  addCreditCard: (data: Omit<CreditCard, 'id' | 'createdAt'>) => void
  updateCreditCard: (id: string, data: Partial<Omit<CreditCard, 'id' | 'createdAt'>>) => void
  deleteCreditCard: (id: string) => void

  // Transaction actions
  addTransaction: (data: Omit<Transaction, 'id' | 'createdAt'>) => void
  updateTransaction: (id: string, data: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => void
  updateTransactionCategory: (id: string, category: ExpenseCategory, description: string) => void
  deleteTransaction: (id: string) => void
  deleteTransactions: (ids: string[]) => void
  bulkUpdateTransactionCategory: (ids: string[], category: ExpenseCategory) => void
  addTransactionsBatch: (
    txns: Omit<Transaction, 'id' | 'createdAt'>[],
    batch: Omit<ImportBatch, 'id'>
  ) => void
  deleteImportBatch: (batchId: string) => void

  // Income actions
  addIncomeEntry: (data: Omit<IncomeEntry, 'id' | 'createdAt'>) => void
  updateIncomeEntry: (id: string, data: Partial<Omit<IncomeEntry, 'id' | 'createdAt'>>) => void
  deleteIncomeEntry: (id: string) => void

  // Recurring expense actions
  addRecurringExpense: (data: Omit<RecurringExpense, 'id' | 'createdAt'>) => void
  updateRecurringExpense: (id: string, data: Partial<Omit<RecurringExpense, 'id' | 'createdAt'>>) => void
  deleteRecurringExpense: (id: string) => void

  // Asset actions
  addAsset: (data: Omit<Asset, 'id' | 'createdAt'>) => void
  updateAsset: (id: string, data: Partial<Omit<Asset, 'id' | 'createdAt'>>) => void
  deleteAsset: (id: string) => void

  // Investment actions
  addInvestment: (data: Omit<Investment, 'id' | 'createdAt'>) => void
  updateInvestment: (id: string, data: Partial<Omit<Investment, 'id' | 'createdAt'>>) => void
  deleteInvestment: (id: string) => void
  addInvestmentHistoryEntry: (id: string, month: string, value: number) => void
  removeInvestmentHistoryEntry: (id: string, month: string) => void

  // Chart widget actions
  addChartWidget: (data: Omit<ChartWidget, 'id' | 'order'>) => void
  deleteChartWidget: (id: string) => void
  reorderChartWidgets: (widgets: ChartWidget[]) => void
  dashboardSectionOrder: string[]
  reorderDashboardSections: (order: string[]) => void

  // Theme
  updateTheme: (theme: AppTheme) => void

  appSettings: AppSettings
  updateAppSettings: (partial: Partial<AppSettings>) => void

  dismissSampleBanner: () => void

  lockSettings: LockSettings
  updateLockSettings: (partial: Partial<LockSettings>) => void

  // User profile
  updateUserProfile: (data: Partial<UserProfile>) => void

  // Sync helpers (called by syncService)
  seedSampleData: () => void
  hydrateFromBlob: (blob: Record<string, unknown>) => void
  clearStore: () => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7) // 'YYYY-MM'
}

function upsertValueHistory(
  history: ValueHistoryEntry[],
  month: string,
  value: number
): ValueHistoryEntry[] {
  const filtered = history.filter((h) => h.month !== month)
  return [...filtered, { month, value }].sort((a, b) => a.month.localeCompare(b.month))
}

const DEFAULT_APP_SETTINGS: AppSettings = {
  displayCurrency: 'ILS',
  enabledCurrencies: ['ILS', 'USD', 'EUR'],
  exchangeRates: {
    USD_ILS: 3.65,
    EUR_ILS: 3.95,
    GBP_ILS: 4.60,
    lastUpdated: '',
  },
}

// Fixed localStorage key
const STORE_KEY = 'nriseup-finance'

// ── Sample data ───────────────────────────────────────────────────────────────

function buildSampleData(): Pick<
  FinanceState,
  'accounts' | 'creditCards' | 'transactions' | 'importBatches' | 'incomeEntries' | 'recurringExpenses' | 'assets' | 'investments' | 'chartWidgets'
> {
  const accountId = uid()
  const now = new Date()

  const months = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(now)
    d.setMonth(d.getMonth() - i)
    return d.toISOString().slice(0, 7)
  })

  const sampleTxns: Omit<Transaction, 'id' | 'createdAt'>[] = [
    { date: `${months[0]}-05`, amount: 850, type: 'expense', category: 'food_restaurants', categorySource: 'keyword', description: 'סופרסל', bankAccountId: accountId, creditCardId: null, transferAccountId: null, importBatchId: null },
    { date: `${months[0]}-08`, amount: 320, type: 'expense', category: 'fuel_transportation', categorySource: 'keyword', description: 'סונול', bankAccountId: accountId, creditCardId: null, transferAccountId: null, importBatchId: null },
    { date: `${months[0]}-10`, amount: 1200, type: 'expense', category: 'insurance', categorySource: 'keyword', description: 'הראל ביטוח', bankAccountId: accountId, creditCardId: null, transferAccountId: null, importBatchId: null },
    { date: `${months[0]}-12`, amount: 650, type: 'expense', category: 'shopping_fashion', categorySource: 'keyword', description: 'זארה', bankAccountId: accountId, creditCardId: null, transferAccountId: null, importBatchId: null },
    { date: `${months[0]}-15`, amount: 18000, type: 'income', category: 'other', categorySource: 'manual', description: 'משכורת', bankAccountId: accountId, creditCardId: null, transferAccountId: null, importBatchId: null },
    { date: `${months[1]}-04`, amount: 920, type: 'expense', category: 'food_restaurants', categorySource: 'keyword', description: 'רמי לוי', bankAccountId: accountId, creditCardId: null, transferAccountId: null, importBatchId: null },
    { date: `${months[1]}-09`, amount: 280, type: 'expense', category: 'fuel_transportation', categorySource: 'keyword', description: 'פז', bankAccountId: accountId, creditCardId: null, transferAccountId: null, importBatchId: null },
    { date: `${months[1]}-11`, amount: 1200, type: 'expense', category: 'insurance', categorySource: 'keyword', description: 'מגדל ביטוח', bankAccountId: accountId, creditCardId: null, transferAccountId: null, importBatchId: null },
    { date: `${months[1]}-15`, amount: 18000, type: 'income', category: 'other', categorySource: 'manual', description: 'משכורת', bankAccountId: accountId, creditCardId: null, transferAccountId: null, importBatchId: null },
    { date: `${months[2]}-03`, amount: 750, type: 'expense', category: 'food_restaurants', categorySource: 'keyword', description: 'יוחננוף', bankAccountId: accountId, creditCardId: null, transferAccountId: null, importBatchId: null },
    { date: `${months[2]}-07`, amount: 410, type: 'expense', category: 'fuel_transportation', categorySource: 'keyword', description: 'דלק', bankAccountId: accountId, creditCardId: null, transferAccountId: null, importBatchId: null },
    { date: `${months[2]}-15`, amount: 18000, type: 'income', category: 'other', categorySource: 'manual', description: 'משכורת', bankAccountId: accountId, creditCardId: null, transferAccountId: null, importBatchId: null },
  ]

  const transactions: Transaction[] = sampleTxns.map((t) => ({
    ...t,
    id: uid(),
    createdAt: new Date().toISOString(),
  }))

  const inv1Base = 320000
  const inv2Base = 95000
  const inv1History: ValueHistoryEntry[] = [
    { month: months[2], value: inv1Base - 14000 },
    { month: months[1], value: inv1Base - 6000 },
    { month: months[0], value: inv1Base },
  ].sort((a, b) => a.month.localeCompare(b.month))
  const inv2History: ValueHistoryEntry[] = [
    { month: months[2], value: inv2Base - 4500 },
    { month: months[1], value: inv2Base - 2000 },
    { month: months[0], value: inv2Base },
  ].sort((a, b) => a.month.localeCompare(b.month))

  return {
    accounts: [
      { id: accountId, name: 'Bank Hapoalim', lastFourDigits: '4521', balanceHistory: { [months[0]]: 42500 }, depositHistory: { [months[0]]: 0 }, currency: 'ILS' as SupportedCurrency, createdAt: new Date().toISOString() },
    ],
    creditCards: [],
    transactions,
    importBatches: [],
    incomeEntries: [],
    recurringExpenses: [],
    assets: [
      { id: uid(), name: 'Apartment – Tel Aviv', type: 'apartment', estimatedValue: 2200000, purchaseDate: '2018-06-15', originalPurchaseCost: 1650000, notes: '3 bedroom, Ramat Gan area', currency: 'ILS' as SupportedCurrency, createdAt: new Date().toISOString() },
      { id: uid(), name: 'Toyota Corolla 2021', type: 'vehicle', estimatedValue: 85000, purchaseDate: '2021-03-01', originalPurchaseCost: 105000, notes: '', currency: 'ILS' as SupportedCurrency, createdAt: new Date().toISOString() },
    ],
    investments: [
      { id: uid(), name: 'Menora Pension Fund', type: 'pension_fund', currentValue: inv1Base, monthlyContribution: 2500, managementFeeContributionPct: 1.5, managementFeeAccumulationPct: 0.5, managingInstitution: 'מנורה מבטחים', description: 'Employee pension', openingDate: '2016-01-01', valueHistory: inv1History, currency: 'ILS' as SupportedCurrency, contributionCurrency: 'ILS' as SupportedCurrency, createdAt: new Date().toISOString(), excludeFromNetWorth: false },
      { id: uid(), name: 'Harel Keren Hishtalmut', type: 'education_fund', currentValue: inv2Base, monthlyContribution: 1800, managementFeeContributionPct: 0.5, managementFeeAccumulationPct: 0.3, managingInstitution: 'הראל', description: '', openingDate: '2019-04-01', valueHistory: inv2History, currency: 'ILS' as SupportedCurrency, contributionCurrency: 'ILS' as SupportedCurrency, createdAt: new Date().toISOString(), excludeFromNetWorth: false },
    ],
    chartWidgets: [
      { id: uid(), chartType: 'pie', dataSource: 'expenses_by_category', timeRange: '1m', filterCategory: 'all', filterAccountId: null, title: 'Expenses This Month', order: 0 },
      { id: uid(), chartType: 'bar', dataSource: 'expenses_by_month', timeRange: '3m', filterCategory: 'all', filterAccountId: null, title: 'Monthly Expenses', order: 1 },
    ],
  }
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set) => ({
      accounts: [],
      creditCards: [],
      transactions: [],
      importBatches: [],
      incomeEntries: [],
      recurringExpenses: [],
      assets: [],
      investments: [],
      chartWidgets: [],
      categoryRules: {},
      theme: 'light',
      sampleDataLoaded: false,
      sampleDataDismissed: false,
      userProfile: {
        displayName: 'User',
        avatar: '',
        age: null,
        recommendationPriorities: [],
      },
      appSettings: DEFAULT_APP_SETTINGS,
      dashboardSectionOrder: ['monthly', 'spending', 'charts'],
      lockSettings: { enabled: false, pinHash: null, biometricEnabled: false, biometricCredentialId: null },

      // ── Account actions ────────────────────────────────────────────────────
      addAccount: (data) =>
        set((s) => ({
          accounts: [...s.accounts, { ...data, id: uid(), createdAt: new Date().toISOString() }],
        })),

      updateAccount: (id, data) =>
        set((s) => ({
          accounts: s.accounts.map((a) => (a.id === id ? { ...a, ...data } : a)),
        })),

      adjustAccountBalance: (id, delta) =>
        set((s) => ({
          accounts: s.accounts.map((a) => {
            if (a.id !== id) return a
            const month = currentMonth()
            const cur = a.balanceHistory?.[month] ?? 0
            return { ...a, balanceHistory: { ...a.balanceHistory, [month]: cur + delta } }
          }),
        })),

      setAccountMonthBalance: (id, month, balance, deposit) =>
        set((s) => ({
          accounts: s.accounts.map((a) =>
            a.id === id ? {
              ...a,
              balanceHistory: { ...a.balanceHistory, [month]: balance },
              depositHistory: { ...a.depositHistory, [month]: deposit },
            } : a
          ),
        })),

      deleteAccount: (id) =>
        set((s) => {
          const batchIds = s.importBatches.filter((b) => b.bankAccountId === id).map((b) => b.id)
          return {
            accounts: s.accounts.filter((a) => a.id !== id),
            transactions: s.transactions.filter((t) => t.bankAccountId !== id && t.transferAccountId !== id),
            importBatches: s.importBatches.filter((b) => b.bankAccountId !== id && !batchIds.includes(b.id)),
          }
        }),

      // ── Credit card actions ────────────────────────────────────────────────
      addCreditCard: (data) =>
        set((s) => ({
          creditCards: [...s.creditCards, { ...data, id: uid(), createdAt: new Date().toISOString() }],
        })),

      updateCreditCard: (id, data) =>
        set((s) => ({
          creditCards: s.creditCards.map((c) => (c.id === id ? { ...c, ...data } : c)),
        })),

      deleteCreditCard: (id) =>
        set((s) => {
          const batchIds = s.importBatches.filter((b) => b.creditCardId === id).map((b) => b.id)
          return {
            creditCards: s.creditCards.filter((c) => c.id !== id),
            transactions: s.transactions.filter((t) => t.creditCardId !== id),
            importBatches: s.importBatches.filter((b) => b.creditCardId !== id && !batchIds.includes(b.id)),
          }
        }),

      // ── Transaction actions ────────────────────────────────────────────────
      addTransaction: (data) =>
        set((s) => ({
          transactions: [
            { ...data, id: uid(), createdAt: new Date().toISOString() },
            ...s.transactions,
          ],
        })),

      updateTransaction: (id, data) =>
        set((s) => ({
          transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...data } : t)),
        })),

      updateTransactionCategory: (id, category, description) =>
        set((s) => ({
          transactions: s.transactions.map((t) =>
            t.id === id ? { ...t, category, categorySource: 'user' as const } : t
          ),
          categoryRules: {
            ...s.categoryRules,
            [description.toLowerCase().trim()]: category,
          },
        })),

      deleteTransaction: (id) =>
        set((s) => ({
          transactions: s.transactions.filter((t) => t.id !== id),
        })),

      deleteTransactions: (ids) =>
        set((s) => ({
          transactions: s.transactions.filter((t) => !ids.includes(t.id)),
        })),

      bulkUpdateTransactionCategory: (ids, category) =>
        set((s) => ({
          transactions: s.transactions.map((t) =>
            ids.includes(t.id) ? { ...t, category, categorySource: 'user' as const } : t
          ),
        })),

      addTransactionsBatch: (txns, batch) =>
        set((s) => ({
          transactions: [
            ...txns.map((t) => ({ ...t, id: uid(), createdAt: new Date().toISOString() })),
            ...s.transactions,
          ],
          importBatches: [
            { ...batch, id: uid() },
            ...s.importBatches,
          ],
        })),

      deleteImportBatch: (batchId) =>
        set((s) => ({
          transactions: s.transactions.filter((t) => t.importBatchId !== batchId),
          importBatches: s.importBatches.filter((b) => b.id !== batchId),
        })),

      // ── Income actions ─────────────────────────────────────────────────────
      addIncomeEntry: (data) =>
        set((s) => ({
          incomeEntries: [
            { ...data, id: uid(), createdAt: new Date().toISOString() },
            ...s.incomeEntries,
          ],
        })),

      updateIncomeEntry: (id, data) =>
        set((s) => ({
          incomeEntries: s.incomeEntries.map((e) => (e.id === id ? { ...e, ...data } : e)),
        })),

      deleteIncomeEntry: (id) =>
        set((s) => ({
          incomeEntries: s.incomeEntries.filter((e) => e.id !== id),
        })),

      // ── Recurring expense actions ──────────────────────────────────────────
      addRecurringExpense: (data) =>
        set((s) => ({
          recurringExpenses: [
            ...s.recurringExpenses,
            { ...data, id: uid(), createdAt: new Date().toISOString() },
          ],
        })),

      updateRecurringExpense: (id, data) =>
        set((s) => ({
          recurringExpenses: s.recurringExpenses.map((r) => (r.id === id ? { ...r, ...data } : r)),
        })),

      deleteRecurringExpense: (id) =>
        set((s) => ({
          recurringExpenses: s.recurringExpenses.filter((r) => r.id !== id),
        })),

      // ── Asset actions ──────────────────────────────────────────────────────
      addAsset: (data) =>
        set((s) => ({
          assets: [...s.assets, { ...data, id: uid(), createdAt: new Date().toISOString() }],
        })),

      updateAsset: (id, data) =>
        set((s) => ({
          assets: s.assets.map((a) => (a.id === id ? { ...a, ...data } : a)),
        })),

      deleteAsset: (id) =>
        set((s) => ({ assets: s.assets.filter((a) => a.id !== id) })),

      // ── Investment actions ─────────────────────────────────────────────────
      addInvestment: (data) =>
        set((s) => {
          const month = currentMonth()
          const history = upsertValueHistory(data.valueHistory ?? [], month, data.currentValue)
          return {
            investments: [
              ...s.investments,
              { ...data, valueHistory: history, id: uid(), createdAt: new Date().toISOString() },
            ],
          }
        }),

      updateInvestment: (id, data) =>
        set((s) => ({
          investments: s.investments.map((inv) => {
            if (inv.id !== id) return inv
            const newValue = data.currentValue ?? inv.currentValue
            const updatedHistory = upsertValueHistory(inv.valueHistory ?? [], currentMonth(), newValue)
            return { ...inv, ...data, valueHistory: updatedHistory }
          }),
        })),

      deleteInvestment: (id) =>
        set((s) => ({ investments: s.investments.filter((i) => i.id !== id) })),

      addInvestmentHistoryEntry: (id, month, value) =>
        set((s) => ({
          investments: s.investments.map((i) =>
            i.id === id
              ? {
                  ...i,
                  valueHistory: upsertValueHistory(i.valueHistory ?? [], month, value),
                  currentValue: month >= currentMonth() ? value : i.currentValue,
                }
              : i
          ),
        })),

      removeInvestmentHistoryEntry: (id, month) =>
        set((s) => ({
          investments: s.investments.map((i) => {
            if (i.id !== id) return i
            const newHistory = (i.valueHistory ?? []).filter((h) => h.month !== month)
            const sorted = [...newHistory].sort((a, b) => b.month.localeCompare(a.month))
            return {
              ...i,
              valueHistory: newHistory,
              currentValue: sorted.length > 0 ? sorted[0].value : i.currentValue,
            }
          }),
        })),

      // ── Chart widget actions ───────────────────────────────────────────────
      addChartWidget: (data) =>
        set((s) => ({
          chartWidgets: [
            ...s.chartWidgets,
            { ...data, id: uid(), order: s.chartWidgets.length },
          ],
        })),

      deleteChartWidget: (id) =>
        set((s) => ({ chartWidgets: s.chartWidgets.filter((w) => w.id !== id) })),

      reorderChartWidgets: (widgets) => set({ chartWidgets: widgets }),

      reorderDashboardSections: (order) => set({ dashboardSectionOrder: order }),

      // ── Theme ──────────────────────────────────────────────────────────────
      updateTheme: (theme) => {
        document.documentElement.dataset.theme = theme
        set({ theme })
      },

      updateAppSettings: (partial) =>
        set((s) => ({
          appSettings: { ...s.appSettings, ...partial },
        })),

      dismissSampleBanner: () => set({ sampleDataDismissed: true }),

      updateLockSettings: (partial) =>
        set((s) => ({ lockSettings: { ...s.lockSettings, ...partial } })),

      updateUserProfile: (data) =>
        set((s) => ({ userProfile: { ...s.userProfile, ...data } })),

      // ── Sync helpers ───────────────────────────────────────────────────────
      seedSampleData: () =>
        set(() => ({ ...buildSampleData(), sampleDataLoaded: true })),

      hydrateFromBlob: (blob) => {
        const b = blob as Partial<FinanceState>
        const month = currentMonth()
        const investments = (b.investments ?? []).map((inv) =>
          inv.valueHistory ? inv : { ...inv, valueHistory: [{ month, value: inv.currentValue }] }
        )
        const transactions = (b.transactions ?? []).map((t) => ({
          ...t,
          creditCardId: (t as { creditCardId?: string | null }).creditCardId ?? null,
          bankAccountId: (t as { bankAccountId?: string | null }).bankAccountId ?? null,
          transferAccountId: (t as { transferAccountId?: string | null }).transferAccountId ?? null,
        }))
        const importBatches = (b.importBatches ?? []).map((batch) => ({
          ...batch,
          creditCardId: (batch as { creditCardId?: string | null }).creditCardId ?? null,
          bankAccountId: (batch as { bankAccountId?: string | null }).bankAccountId ?? null,
        }))
        set({
          accounts: b.accounts ?? [],
          creditCards: b.creditCards ?? [],
          transactions,
          importBatches,
          incomeEntries: b.incomeEntries ?? [],
          recurringExpenses: b.recurringExpenses ?? [],
          assets: b.assets ?? [],
          investments,
          chartWidgets: b.chartWidgets ?? [],
          categoryRules: b.categoryRules ?? {},
          theme: b.theme ?? 'light',
          sampleDataLoaded: b.sampleDataLoaded ?? false,
          sampleDataDismissed: b.sampleDataDismissed ?? false,
        })
      },

      clearStore: () => {
        localStorage.removeItem(STORE_KEY)
        set({
          accounts: [],
          creditCards: [],
          transactions: [],
          importBatches: [],
          incomeEntries: [],
          recurringExpenses: [],
          assets: [],
          investments: [],
          chartWidgets: [],
          categoryRules: {},
          theme: 'light',
          sampleDataLoaded: false,
          sampleDataDismissed: false,
          userProfile: {
            displayName: 'User',
            avatar: '',
            age: null,
            recommendationPriorities: [],
          },
        })
      },
    }),
    {
      name: STORE_KEY,
      onRehydrateStorage: () => (state) => {
        if (!state) return

        document.documentElement.dataset.theme = state.theme ?? 'light'

        if (!state.sampleDataLoaded) {
          const sample = buildSampleData()
          Object.assign(state, { ...sample, sampleDataLoaded: true })
        }

        if (state.theme === undefined) state.theme = 'light'
        if (!state.categoryRules) state.categoryRules = {}
        if (!state.creditCards) state.creditCards = []
        if (!state.incomeEntries) state.incomeEntries = []
        if (!state.recurringExpenses) state.recurringExpenses = []

        if (!state.dashboardSectionOrder) state.dashboardSectionOrder = ['monthly', 'spending', 'charts']
        if (!state.lockSettings) state.lockSettings = { enabled: false, pinHash: null, biometricEnabled: false, biometricCredentialId: null }

        if (!state.appSettings) state.appSettings = DEFAULT_APP_SETTINGS
        if (!state.appSettings.enabledCurrencies) {
          state.appSettings = { ...state.appSettings, enabledCurrencies: ['ILS', 'USD', 'EUR'] }
        }

        // Backfill currency on existing entities
        if (state.assets) {
          state.assets = state.assets.map((a) => ({
            ...a,
            currency: (a as { currency?: SupportedCurrency }).currency ?? 'ILS',
          }))
        }

        if (state.investments) {
          const month = currentMonth()
          state.investments = state.investments.map((i) => ({
            ...i,
            valueHistory: i.valueHistory ?? [{ month, value: i.currentValue }],
            currency: (i as { currency?: SupportedCurrency }).currency ?? 'ILS',
            contributionCurrency: (i as { contributionCurrency?: SupportedCurrency }).contributionCurrency ?? 'ILS',
            excludeFromNetWorth: (i as { excludeFromNetWorth?: boolean }).excludeFromNetWorth ?? false,
          }))
        }

        if (state.transactions) {
          state.transactions = state.transactions.map((t) => ({
            ...t,
            creditCardId: (t as { creditCardId?: string | null }).creditCardId ?? null,
            bankAccountId: (t as { bankAccountId?: string | null }).bankAccountId ?? null,
            transferAccountId: (t as { transferAccountId?: string | null }).transferAccountId ?? null,
          }))
        }

        if (state.importBatches) {
          state.importBatches = state.importBatches.map((b) => ({
            ...b,
            creditCardId: (b as { creditCardId?: string | null }).creditCardId ?? null,
            bankAccountId: (b as { bankAccountId?: string | null }).bankAccountId ?? null,
          }))
        }

        if (state.accounts) {
          const month = currentMonth()
          state.accounts = state.accounts.map((a) => {
            const old = a as { balance?: number; deposit?: number; balanceHistory?: Record<string, number>; depositHistory?: Record<string, number>; currency?: SupportedCurrency }
            return {
              id: a.id, name: a.name, lastFourDigits: a.lastFourDigits, createdAt: a.createdAt,
              balanceHistory: old.balanceHistory ?? { [month]: old.balance ?? 0 },
              depositHistory: old.depositHistory ?? { [month]: old.deposit ?? 0 },
              currency: old.currency ?? 'ILS',
            }
          })
        }

        if (state.creditCards) {
          state.creditCards = state.creditCards.map((c) => ({
            ...c,
            bankAccountId: (c as { bankAccountId?: string | null }).bankAccountId ?? null,
          }))
        }

        if (state.incomeEntries) {
          state.incomeEntries = state.incomeEntries.map((e) => ({
            ...e,
            bankAccountId: (e as { bankAccountId?: string | null }).bankAccountId ?? null,
          }))
        }

        if (state.recurringExpenses) {
          state.recurringExpenses = state.recurringExpenses.map((r) => ({
            ...r,
            bankAccountId: (r as { bankAccountId?: string | null }).bankAccountId ?? null,
            creditCardId: (r as { creditCardId?: string | null }).creditCardId ?? null,
          }))
        }

        if (!state.userProfile) {
          state.userProfile = { displayName: 'User', avatar: '', age: null, recommendationPriorities: [] }
        }
        // Reset old string-format priorities (from previous implementation)
        if (state.userProfile.recommendationPriorities?.some((p) => typeof p === 'string')) {
          state.userProfile.recommendationPriorities = []
        }
      },
    }
  )
)

