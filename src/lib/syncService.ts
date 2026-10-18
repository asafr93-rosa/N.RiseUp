import { supabase } from './supabase'
import { useFinanceStore } from '../store/useFinanceStore'

const PUSH_DELAY_MS = 2000
const RETRY_DELAY_MS = 5000

let pushTimer: ReturnType<typeof setTimeout> | null = null
// True once the first pull finished — pushing before that would overwrite the cloud with stale local data
let ready = false
// True while applying pulled data, so the resulting store change isn't pushed back
let hydrating = false
// True when local changes haven't reached the cloud yet
let dirty = false
let inflightPush: Promise<void> | null = null

// ── Pull ──────────────────────────────────────────────────────────────────────

export async function pullUserData(username: string): Promise<void> {
  // Let an in-flight push land first so we don't read back older data
  if (inflightPush) await inflightPush

  const { data, error } = await supabase
    .from('user_data')
    .select('data')
    .eq('username', username)
    .maybeSingle()

  if (error) {
    console.error('[sync] pull failed', error)
    return
  }

  // A local edit landed while the request was in flight — keep it and push instead
  if (dirty && ready) {
    await pushUserData(username)
    return
  }

  if (data?.data) {
    hydrating = true
    try {
      useFinanceStore.getState().hydrateFromBlob(data.data as Record<string, unknown>)
    } finally {
      hydrating = false
    }
    ready = true
  } else {
    // First login on any device — seed sample data then push it
    ready = true
    useFinanceStore.getState().seedSampleData()
    await pushUserData(username)
  }
}

// ── Push (debounced) ──────────────────────────────────────────────────────────

export function schedulePush(username: string, delay = PUSH_DELAY_MS): void {
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(() => {
    pushTimer = null
    void pushUserData(username)
  }, delay)
}

export function cancelPush(): void {
  if (pushTimer) {
    clearTimeout(pushTimer)
    pushTimer = null
  }
}

async function pushUserData(username: string): Promise<void> {
  cancelPush()
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

  dirty = false
  const request = supabase
    .from('user_data')
    .upsert({ username, data: blob, updated_at: new Date().toISOString() })
  const done = Promise.resolve(request).then(() => undefined)
  inflightPush = done
  const { error } = await request
  if (inflightPush === done) inflightPush = null

  if (error) {
    console.error('[sync] push failed, retrying', error)
    dirty = true
    schedulePush(username, RETRY_DELAY_MS)
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

/**
 * Pulls on login and again whenever the app returns to the foreground — mobile browsers
 * keep the page alive for days, so without this a phone never sees data added on web.
 * Returns a cleanup function.
 */
export function startSync(username: string): () => void {
  ready = false
  dirty = false

  const unsubscribe = useFinanceStore.subscribe(() => {
    if (hydrating || !ready) return
    dirty = true
    schedulePush(username)
  })

  function onVisibilityChange() {
    if (document.visibilityState === 'hidden') {
      // Flush pending edits before the OS suspends the page
      if (dirty) void pushUserData(username)
    } else {
      void pullUserData(username)
    }
  }

  document.addEventListener('visibilitychange', onVisibilityChange)
  void pullUserData(username)

  return () => {
    unsubscribe()
    document.removeEventListener('visibilitychange', onVisibilityChange)
    cancelPush()
    ready = false
    dirty = false
  }
}
