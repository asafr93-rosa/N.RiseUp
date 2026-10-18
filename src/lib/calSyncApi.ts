import type { ExpenseCategory } from '../store/useFinanceStore'
import type { PendingImport } from '../components/accounts/AIImportBanner'
// Single source of truth for agent-category → app-category mapping
import AGENT_CATEGORY_MAP from './agentCategoryMap.json'
import EXCLUDED_MERCHANTS from './excludedMerchants.json'

const CATEGORY_MAP = AGENT_CATEGORY_MAP as Record<string, ExpenseCategory>

export class CalSyncError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

interface SyncResponse {
  card: string
  month: string
  rows: { date: string; description: string; amount: number; category: string }[]
}

/** Calls /api/sync-cal (server signs in to Cal) and returns an import ready for the AIImportBanner. */
export async function fetchCalSync(monthKey: string, secret: string, card?: string): Promise<PendingImport> {
  const res = await fetch('/api/sync-cal', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-sync-secret': secret },
    body: JSON.stringify({ month: monthKey, card, categories: Object.keys(CATEGORY_MAP) }),
  })
  const data = await res.json().catch(() => ({})) as Partial<SyncResponse> & { error?: string }
  if (!res.ok) throw new CalSyncError(data.error ?? `Cal sync failed (${res.status})`, res.status)

  const rows = (data.rows ?? []).filter((r) => {
    const d = r.description.toLowerCase()
    return !EXCLUDED_MERCHANTS.some((m) => d.includes(m.toLowerCase()))
  })
  return {
    cardLastFour: data.card ?? '',
    statementDate: `${monthKey}-01`,
    sourceFile: `cal_${data.card ?? ''}_${monthKey}`,
    createdAt: new Date().toISOString(),
    transactions: rows.map((r) => ({
      date: r.date,
      description: r.description,
      amount: r.amount,
      type: 'expense' as const,
      category: CATEGORY_MAP[r.category] ?? 'other',
      categorySource: 'keyword' as const,
      bankAccountId: null,
      creditCardId: null,
      transferAccountId: null,
      importBatchId: null,
    })),
  }
}
