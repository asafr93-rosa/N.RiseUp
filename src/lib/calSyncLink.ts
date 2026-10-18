import type { ExpenseCategory } from '../store/useFinanceStore'
import type { PendingImport } from '../components/accounts/AIImportBanner'

// `npm run sync:cal` opens the app at /accounts#cal-sync=<base64url JSON>.
// The fragment never leaves the browser (it isn't sent to the server).
// Compact payload: { c: cardLastFour, d: statementDate, s: sourceFile, t: createdAt, x: [[description, amount, category], ...] }
interface CompactSync {
  c: string
  d: string
  s: string
  t: string
  x: [string, number, ExpenseCategory][]
}

const PREFIX = '#cal-sync='

export function readCalSyncFromHash(hash: string): PendingImport | null {
  if (!hash.startsWith(PREFIX)) return null
  try {
    const b64 = hash.slice(PREFIX.length).replace(/-/g, '+').replace(/_/g, '/')
    const bytes = Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0))
    const p = JSON.parse(new TextDecoder().decode(bytes)) as CompactSync
    if (!Array.isArray(p.x) || p.x.length === 0) return null
    return {
      cardLastFour: p.c,
      statementDate: p.d,
      sourceFile: p.s,
      createdAt: p.t,
      transactions: p.x.map(([description, amount, category]) => ({
        date: p.d,
        description,
        amount,
        type: 'expense' as const,
        category,
        categorySource: 'keyword' as const,
        bankAccountId: null,
        creditCardId: null,
        transferAccountId: null,
        importBatchId: null,
      })),
    }
  } catch {
    return null
  }
}
