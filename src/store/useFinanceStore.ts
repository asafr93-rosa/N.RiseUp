import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ── Types ─────────────────────────────────────────────────────────────────────

export type ExpenseCategory =
  | 'food_restaurants'
  | 'fuel_transportation'
  | 'insurance'
  | 'shopping_fashion'
  | 'health'
  | 'education'
  | 'entertainment_leisure'
  | 'housing'
  | 'household_bills'
  | 'taxes'
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

export type ChartType = 'bar' | 'pie' | 'line'

export type ChartDataSource =
  | 'expenses_by_category'
  | 'expenses_by_month'
  | 'balance_over_time'
  | 'category_comparison'

export type ChartTimeRange = '1m' | '3m' | '6m' | '1y' | 'all'

export type AppTheme = 'light' | 'dark'

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface BankAccount {
  id: string
  name: string
  lastFourDigits: string
  balance: number
  createdAt: string
}

export interface Transaction {
  id: string
  date: string // ISO YYYY-MM-DD
  amount: number // always positive
  type: 'expense' | 'income'
  category: ExpenseCategory
  categorySource: 'keyword' | 'user' | 'manual'
  description: string
  bankAccountId: string
  importBatchId: string | null
  createdAt: string
}

export interface ImportBatch {
  id: string
  bankAccountId: string
  fileName: string
  transactionCount: number
  totalAmount: number
  importedAt: string
}

export interface Asset {
  id: string
  name: string
  type: AssetType
  estimatedValue: number
  purchaseDate: string
  originalPurchaseCost: number
  notes: string
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
  createdAt: string
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
  transactions: Transaction[]
  importBatches: ImportBatch[]
  assets: Asset[]
  investments: Investment[]
  chartWidgets: ChartWidget[]
  categoryRules: CategoryRules
  theme: AppTheme
  sampleDataLoaded: boolean
  sampleDataDismissed: boolean

  // Account actions
  addAccount: (data: Omit<BankAccount, 'id' | 'createdAt'>) => void
  updateAccount: (id: string, data: Partial<Omit<BankAccount, 'id' | 'createdAt'>>) => void
  deleteAccount: (id: string) => void

  // Transaction actions
  addTransaction: (data: Omit<Transaction, 'id' | 'createdAt'>) => void
  updateTransactionCategory: (id: string, category: ExpenseCategory, description: string) => void
  deleteTransaction: (id: string) => void
  addTransactionsBatch: (
    txns: Omit<Transaction, 'id' | 'createdAt'>[],
    batch: Omit<ImportBatch, 'id'>
  ) => void
  deleteImportBatch: (batchId: string) => void

  // Asset actions
  addAsset: (data: Omit<Asset, 'id' | 'createdAt'>) => void
  updateAsset: (id: string, data: Partial<Omit<Asset, 'id' | 'createdAt'>>) => void
  deleteAsset: (id: string) => void

  // Investment actions
  addInvestment: (data: Omit<Investment, 'id' | 'createdAt'>) => void
  updateInvestment: (id: string, data: Partial<Omit<Investment, 'id' | 'createdAt'>>) => void
  deleteInvestment: (id: string) => void

  // Chart widget actions
  addChartWidget: (data: Omit<ChartWidget, 'id' | 'order'>) => void
  deleteChartWidget: (id: string) => void
  reorderChartWidgets: (widgets: ChartWidget[]) => void

  // Theme
  updateTheme: (theme: AppTheme) => void

  dismissSampleBanner: () => void

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

// Fixed localStorage key — user isolation is handled by Supabase (cloud) not by per-user keys.
// localStorage serves as an offline cache only.
const STORE_KEY = 'nriseup-finance'

// ── Sample data ───────────────────────────────────────────────────────────────

function buildSampleData(): Pick<
  FinanceState,
  'accounts' | 'transactions' | 'importBatches' | 'assets' | 'investments' | 'chartWidgets'
> {
  const accountId = uid()
  const now = new Date()

  const months = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(now)
    d.setMonth(d.getMonth() - i)
    return d.toISOString().slice(0, 7) // YYYY-MM
  })

  const sampleTxns: Omit<Transaction, 'id' | 'createdAt'>[] = [
    // Current month
    { date: `${months[0]}-05`, amount: 850, type: 'expense', category: 'food_restaurants', categorySource: 'keyword', description: 'סופרסל', bankAccountId: accountId, importBatchId: null },
    { date: `${months[0]}-08`, amount: 320, type: 'expense', category: 'fuel_transportation', categorySource: 'keyword', description: 'סונול', bankAccountId: accountId, importBatchId: null },
    { date: `${months[0]}-10`, amount: 1200, type: 'expense', category: 'insurance', categorySource: 'keyword', description: 'הראל ביטוח', bankAccountId: accountId, importBatchId: null },
    { date: `${months[0]}-12`, amount: 650, type: 'expense', category: 'shopping_fashion', categorySource: 'keyword', description: 'זארה', bankAccountId: accountId, importBatchId: null },
    { date: `${months[0]}-15`, amount: 18000, type: 'income', category: 'other', categorySource: 'manual', description: 'משכורת', bankAccountId: accountId, importBatchId: null },
    // Previous month
    { date: `${months[1]}-04`, amount: 920, type: 'expense', category: 'food_restaurants', categorySource: 'keyword', description: 'רמי לוי', bankAccountId: accountId, importBatchId: null },
    { date: `${months[1]}-09`, amount: 280, type: 'expense', category: 'fuel_transportation', categorySource: 'keyword', description: 'פז', bankAccountId: accountId, importBatchId: null },
    { date: `${months[1]}-11`, amount: 1200, type: 'expense', category: 'insurance', categorySource: 'keyword', description: 'מגדל ביטוח', bankAccountId: accountId, importBatchId: null },
    { date: `${months[1]}-15`, amount: 18000, type: 'income', category: 'other', categorySource: 'manual', description: 'משכורת', bankAccountId: accountId, importBatchId: null },
    // Two months ago
    { date: `${months[2]}-03`, amount: 750, type: 'expense', category: 'food_restaurants', categorySource: 'keyword', description: 'יוחננוף', bankAccountId: accountId, importBatchId: null },
    { date: `${months[2]}-07`, amount: 410, type: 'expense', category: 'fuel_transportation', categorySource: 'keyword', description: 'דלק', bankAccountId: accountId, importBatchId: null },
    { date: `${months[2]}-15`, amount: 18000, type: 'income', category: 'other', categorySource: 'manual', description: 'משכורת', bankAccountId: accountId, importBatchId: null },
  ]

  const transactions: Transaction[] = sampleTxns.map(t => ({
    ...t,
    id: uid(),
    createdAt: new Date().toISOString(),
  }))

  // 3 months of synthetic value history for sample investments
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
      { id: accountId, name: 'Bank Hapoalim', lastFourDigits: '4521', balance: 42500, createdAt: new Date().toISOString() },
    ],
    transactions,
    importBatches: [],
    assets: [
      { id: uid(), name: 'Apartment – Tel Aviv', type: 'apartment', estimatedValue: 2200000, purchaseDate: '2018-06-15', originalPurchaseCost: 1650000, notes: '3 bedroom, Ramat Gan area', createdAt: new Date().toISOString() },
      { id: uid(), name: 'Toyota Corolla 2021', type: 'vehicle', estimatedValue: 85000, purchaseDate: '2021-03-01', originalPurchaseCost: 105000, notes: '', createdAt: new Date().toISOString() },
    ],
    investments: [
      { id: uid(), name: 'Menora Pension Fund', type: 'pension_fund', currentValue: inv1Base, monthlyContribution: 2500, managementFeeContributionPct: 1.5, managementFeeAccumulationPct: 0.5, managingInstitution: 'מנורה מבטחים', description: 'Employee pension', openingDate: '2016-01-01', valueHistory: inv1History, createdAt: new Date().toISOString() },
      { id: uid(), name: 'Harel Keren Hishtalmut', type: 'education_fund', currentValue: inv2Base, monthlyContribution: 1800, managementFeeContributionPct: 0.5, managementFeeAccumulationPct: 0.3, managingInstitution: 'הראל', description: '', openingDate: '2019-04-01', valueHistory: inv2History, createdAt: new Date().toISOString() },
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
      transactions: [],
      importBatches: [],
      assets: [],
      investments: [],
      chartWidgets: [],
      categoryRules: {},
      theme: 'light',
      sampleDataLoaded: false,
      sampleDataDismissed: false,

      // ── Account actions ────────────────────────────────────────────────────
      addAccount: (data) =>
        set((s) => ({
          accounts: [...s.accounts, { ...data, id: uid(), createdAt: new Date().toISOString() }],
        })),

      updateAccount: (id, data) =>
        set((s) => ({
          accounts: s.accounts.map((a) => (a.id === id ? { ...a, ...data } : a)),
        })),

      deleteAccount: (id) =>
        set((s) => {
          const batchIds = s.importBatches.filter((b) => b.bankAccountId === id).map((b) => b.id)
          return {
            accounts: s.accounts.filter((a) => a.id !== id),
            transactions: s.transactions.filter((t) => t.bankAccountId !== id),
            importBatches: s.importBatches.filter((b) => b.bankAccountId !== id && !batchIds.includes(b.id)),
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

      // ── Theme ──────────────────────────────────────────────────────────────
      updateTheme: (theme) => {
        document.documentElement.dataset.theme = theme
        set({ theme })
      },

      dismissSampleBanner: () => set({ sampleDataDismissed: true }),

      // ── Sync helpers ───────────────────────────────────────────────────────
      seedSampleData: () =>
        set(() => ({ ...buildSampleData(), sampleDataLoaded: true })),

      hydrateFromBlob: (blob) => {
        const b = blob as Partial<FinanceState>
        const month = currentMonth()
        const investments = (b.investments ?? []).map((inv) =>
          inv.valueHistory ? inv : { ...inv, valueHistory: [{ month, value: inv.currentValue }] }
        )
        set({
          accounts: b.accounts ?? [],
          transactions: b.transactions ?? [],
          importBatches: b.importBatches ?? [],
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
          transactions: [],
          importBatches: [],
          assets: [],
          investments: [],
          chartWidgets: [],
          categoryRules: {},
          theme: 'light',
          sampleDataLoaded: false,
          sampleDataDismissed: false,
        })
      },
    }),
    {
      name: STORE_KEY,
      onRehydrateStorage: () => (state) => {
        if (!state) return

        // Apply persisted theme to DOM
        document.documentElement.dataset.theme = state.theme ?? 'light'

        // Seed sample data on first load
        if (!state.sampleDataLoaded) {
          const sample = buildSampleData()
          Object.assign(state, {
            ...sample,
            sampleDataLoaded: true,
          })
        }

        // Migration guards — ensure new fields exist
        if (state.theme === undefined) state.theme = 'light'
        if (!state.categoryRules) state.categoryRules = {}

        // Migrate investments missing valueHistory
        if (state.investments) {
          const month = currentMonth()
          state.investments = state.investments.map((inv) =>
            inv.valueHistory
              ? inv
              : { ...inv, valueHistory: [{ month, value: inv.currentValue }] }
          )
        }
      },
    }
  )
)
