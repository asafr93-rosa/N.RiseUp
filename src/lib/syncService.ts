import { supabase } from './supabase'
import { useFinanceStore } from '../store/useFinanceStore'

let pushTimer: ReturnType<typeof setTimeout> | null = null

// ── Pull ──────────────────────────────────────────────────────────────────────

export async function pullUserData(userId: string): Promise<void> {
  const { data, error } = await supabase
    .from('user_data')
    .select('data')
    .eq('user_id', userId)
    .single()

  if (error) {
    // PGRST116 = "no rows returned" — first-ever login for this user
    if (error.code === 'PGRST116') {
      useFinanceStore.getState().seedSampleData()
      await pushUserData(userId)
    } else {
      console.error('[sync] pull failed', error)
      // Fall through — localStorage cache (if any) will be used as-is
    }
    return
  }

  if (data?.data) {
    useFinanceStore.getState().hydrateFromBlob(data.data as Record<string, unknown>)
  }
}

// ── Push (debounced) ──────────────────────────────────────────────────────────

export function schedulePush(userId: string): void {
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(() => void pushUserData(userId), 2000)
}

export function cancelPush(): void {
  if (pushTimer) {
    clearTimeout(pushTimer)
    pushTimer = null
  }
}

async function pushUserData(userId: string): Promise<void> {
  const s = useFinanceStore.getState()
  const blob = {
    accounts: s.accounts,
    transactions: s.transactions,
    importBatches: s.importBatches,
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
    .upsert({ user_id: userId, data: blob, updated_at: new Date().toISOString() })

  if (error) {
    console.error('[sync] push failed', error)
    // Silent failure — localStorage persist middleware keeps data locally
  }
}
