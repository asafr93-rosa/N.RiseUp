import { supabase } from './supabase'
import { useFinanceStore } from '../store/useFinanceStore'

let pushTimer: ReturnType<typeof setTimeout> | null = null

// ── Pull ──────────────────────────────────────────────────────────────────────

export async function pullUserData(username: string): Promise<void> {
  const { data, error } = await supabase
    .from('user_data')
    .select('data')
    .eq('username', username)
    .maybeSingle()

  if (error) {
    console.error('[sync] pull failed', error)
    return
  }

  if (data?.data) {
    useFinanceStore.getState().hydrateFromBlob(data.data as Record<string, unknown>)
  } else {
    // First login on any device — seed sample data then push it
    useFinanceStore.getState().seedSampleData()
    await pushUserData(username)
  }
}

// ── Push (debounced) ──────────────────────────────────────────────────────────

export function schedulePush(username: string): void {
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(() => void pushUserData(username), 2000)
}

export function cancelPush(): void {
  if (pushTimer) {
    clearTimeout(pushTimer)
    pushTimer = null
  }
}

async function pushUserData(username: string): Promise<void> {
  const s = useFinanceStore.getState()
  const blob = {
    accounts: s.accounts,
    creditCards: s.creditCards,
    transactions: s.transactions,
    importBatches: s.importBatches,
    incomeEntries: s.incomeEntries,
    recurringExpenses: s.recurringExpenses,
    assets: s.assets,
    investments: s.investments,
    chartWidgets: s.chartWidgets,
    categoryRules: s.categoryRules,
    theme: s.theme,
    sampleDataLoaded: s.sampleDataLoaded,
    sampleDataDismissed: s.sampleDataDismissed,
  }

  const { error } = await supabase
    .from('user_data')
    .upsert({ username, data: blob, updated_at: new Date().toISOString() })

  if (error) {
    console.error('[sync] push failed', error)
  }
}
