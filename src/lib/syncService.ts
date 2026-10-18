import { create } from 'zustand'
import { supabase } from './supabase'
import { useFinanceStore } from '../store/useFinanceStore'

const PUSH_DELAY_MS = 1500
const RETRY_DELAY_MS = 5000
const POLL_INTERVAL_MS = 15000

// Per-device bookkeeping, survives reloads
const META_KEY = 'nriseup-sync-meta'
// Copy of this device's data taken the first time it syncs, in case the cloud copy was older
const BACKUP_KEY = 'nriseup-sync-backup'

interface SyncMeta {
  /** updated_at of the cloud row this device last matched */
  remoteUpdatedAt: string | null
  /** Local edits exist that haven't reached the cloud */
  unsynced: boolean
}

type Blob = Record<string, unknown>

// ── Status store (for the Settings UI) ────────────────────────────────────────

interface SyncStatus {
  state: 'idle' | 'syncing' | 'error'
  lastSyncedAt: string | null
  hasBackup: boolean
  /** Message from the last failed request, shown in Settings */
  lastError: string | null
}

export const useSyncStatus = create<SyncStatus>()(() => ({
  state: 'idle',
  lastSyncedAt: null,
  hasBackup: false,
  lastError: null,
}))

function errorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const e = error as { message?: string; code?: string; details?: string; hint?: string }
    return [e.code, e.message, e.details, e.hint].filter(Boolean).join(' — ') || 'Unknown error'
  }
  return String(error)
}

// ── Local persistence helpers ─────────────────────────────────────────────────

function readMeta(): SyncMeta {
  try {
    const raw = localStorage.getItem(`${META_KEY}:${activeUsername}`)
    if (raw) return JSON.parse(raw) as SyncMeta
  } catch { /* ignore */ }
  return { remoteUpdatedAt: null, unsynced: false }
}

function writeMeta(patch: Partial<SyncMeta>): void {
  const next = { ...readMeta(), ...patch }
  try { localStorage.setItem(`${META_KEY}:${activeUsername}`, JSON.stringify(next)) } catch { /* ignore */ }
  useSyncStatus.setState({ lastSyncedAt: next.remoteUpdatedAt })
}

function readBackup(): Blob | null {
  try {
    const raw = localStorage.getItem(`${BACKUP_KEY}:${activeUsername}`)
    return raw ? (JSON.parse(raw) as Blob) : null
  } catch {
    return null
  }
}

function writeBackup(blob: Blob | null): void {
  try {
    if (blob) localStorage.setItem(`${BACKUP_KEY}:${activeUsername}`, JSON.stringify(blob))
    else localStorage.removeItem(`${BACKUP_KEY}:${activeUsername}`)
  } catch { /* ignore */ }
  useSyncStatus.setState({ hasBackup: blob !== null })
}

/** Everything that should be identical on every device (lock/PIN settings stay per-device). */
function buildBlob(): Blob {
  const s = useFinanceStore.getState()
  return {
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
    appSettings: s.appSettings,
    userProfile: s.userProfile,
    dashboardSectionOrder: s.dashboardSectionOrder,
  }
}

// ── Module state ──────────────────────────────────────────────────────────────

let activeUsername: string | null = null
let pushTimer: ReturnType<typeof setTimeout> | null = null
// True once the first pull finished — pushing before that would overwrite the cloud with stale local data
let ready = false
// True while applying pulled data, so the resulting store change isn't pushed back
let hydrating = false
let inflightPush: Promise<void> | null = null
let inflightPull: Promise<void> | null = null

function applyRemote(blob: Blob): void {
  hydrating = true
  try {
    useFinanceStore.getState().hydrateFromBlob(blob)
  } finally {
    hydrating = false
  }
}

// ── Pull ──────────────────────────────────────────────────────────────────────

export function pullUserData(username: string): Promise<void> {
  // Coalesce overlapping pulls (focus + visibility + poll can fire together)
  if (!inflightPull) {
    inflightPull = doPull(username).finally(() => { inflightPull = null })
  }
  return inflightPull
}

async function doPull(username: string): Promise<void> {
  // Let an in-flight push land first so we don't read back older data
  if (inflightPush) await inflightPush

  useSyncStatus.setState({ state: 'syncing' })
  const meta = readMeta()

  // Cheap check first — only download the full copy when the cloud actually changed
  const head = await supabase
    .from('user_data')
    .select('updated_at')
    .eq('username', username)
    .maybeSingle()
  if (head.error) return failPull(head.error)
  const hasRow = head.data !== null
  const remoteUpdatedAt = (head.data as { updated_at: string | null } | null)?.updated_at ?? null

  if (!hasRow || (meta.unsynced && meta.remoteUpdatedAt)) {
    // No cloud copy yet, or edits made here never reached the cloud (app closed, offline) — upload
    ready = true
    await pushUserData(username)
    return
  }

  if (sameTime(remoteUpdatedAt, meta.remoteUpdatedAt)) {
    ready = true
    useSyncStatus.setState({ state: 'idle', lastError: null })
    return
  }

  const { data, error } = await supabase
    .from('user_data')
    .select('data, updated_at')
    .eq('username', username)
    .maybeSingle()
  if (error) return failPull(error)
  const row = data as { data: Blob | null; updated_at: string } | null
  if (!row?.data) return failPull('empty row')

  // A local edit landed while downloading — keep it, it'll be pushed
  if (pushTimer || readMeta().unsynced) {
    ready = true
    return
  }

  if (meta.remoteUpdatedAt === null) {
    // First sync on this device: keep a copy of what was here before taking the cloud version
    const local = buildBlob()
    if (!sameData(local, row.data)) writeBackup(local)
  }

  applyRemote(row.data)
  writeMeta({ remoteUpdatedAt: row.updated_at, unsynced: false })
  ready = true
  useSyncStatus.setState({ state: 'idle', lastError: null })
}

// Postgres returns timestamps as '+00:00', we write 'Z' — compare instants, not strings
function sameTime(a: string | null, b: string | null): boolean {
  return a !== null && b !== null && Date.parse(a) === Date.parse(b)
}

function failPull(error: unknown): void {
  console.error('[sync] pull failed', error)
  useSyncStatus.setState({ state: 'error', lastError: errorMessage(error) })
}

/** Key-order-independent comparison (Postgres jsonb reorders object keys). */
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    return `{${Object.keys(obj).sort().filter((k) => obj[k] !== undefined).map((k) => `${JSON.stringify(k)}:${stable(obj[k])}`).join(',')}}`
  }
  return JSON.stringify(value) ?? 'null'
}

function sameData(local: Blob, remote: Blob): boolean {
  return Object.keys(local).every((k) => remote[k] === undefined || stable(local[k]) === stable(remote[k]))
}

// ── Push (debounced) ──────────────────────────────────────────────────────────

function schedulePush(username: string, delay = PUSH_DELAY_MS): void {
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(() => {
    pushTimer = null
    void pushUserData(username)
  }, delay)
}

function cancelPush(): void {
  if (pushTimer) {
    clearTimeout(pushTimer)
    pushTimer = null
  }
}

function pushUserData(username: string): Promise<void> {
  cancelPush()
  const run = (async () => {
    if (inflightPush) await inflightPush
    useSyncStatus.setState({ state: 'syncing' })
    const updatedAt = new Date().toISOString()
    const row = { data: buildBlob(), updated_at: updatedAt }

    // Update-then-insert instead of upsert: upsert resolves conflicts on the primary key,
    // which isn't `username`, so every write after the first collided with the existing row
    const { data: updated, error: updateError } = await supabase
      .from('user_data')
      .update(row)
      .eq('username', username)
      .select('username')
    let error = updateError
    if (!error && (updated ?? []).length === 0) {
      ({ error } = await supabase.from('user_data').insert({ username, ...row }))
    }

    if (error) {
      console.error('[sync] push failed, retrying', error)
      useSyncStatus.setState({ state: 'error', lastError: errorMessage(error) })
      writeMeta({ unsynced: true })
      schedulePush(username, RETRY_DELAY_MS)
      return
    }
    // Only clear the flag if nothing changed while the request was in flight
    writeMeta({ remoteUpdatedAt: updatedAt, unsynced: pushTimer !== null })
    useSyncStatus.setState({ state: 'idle', lastError: null })
  })()
  const done = run.finally(() => { if (inflightPush === done) inflightPush = null })
  inflightPush = done
  return done
}

// ── Manual actions (Settings) ─────────────────────────────────────────────────

/** Overwrite the cloud with this device's data; other devices pick it up within seconds. */
export async function uploadThisDevice(): Promise<string | null> {
  if (!activeUsername) return 'Not signed in'
  ready = true
  await pushUserData(activeUsername)
  return readMeta().unsynced ? (useSyncStatus.getState().lastError ?? 'Unknown error') : null
}

/** Restore the data this device had before its first sync, and upload it everywhere. */
export async function restoreBackup(): Promise<boolean> {
  const backup = readBackup()
  if (!backup || !activeUsername) return false
  applyRemote(backup)
  ready = true
  await pushUserData(activeUsername)
  if (readMeta().unsynced) return false
  writeBackup(null)
  return true
}

export function discardBackup(): void {
  writeBackup(null)
}

export function syncNow(): Promise<void> {
  return activeUsername ? pullUserData(activeUsername) : Promise.resolve()
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

/**
 * Keeps this device in lock-step with the cloud copy: pulls on start, on returning to the app,
 * on reconnect and every few seconds while visible; pushes every local edit. Returns a cleanup.
 */
export function startSync(username: string): () => void {
  activeUsername = username
  ready = false
  useSyncStatus.setState({ state: 'idle', lastSyncedAt: readMeta().remoteUpdatedAt, hasBackup: readBackup() !== null })

  const unsubscribe = useFinanceStore.subscribe(() => {
    if (hydrating || !ready) return
    writeMeta({ unsynced: true })
    schedulePush(username)
  })

  function refresh() {
    if (document.visibilityState === 'visible') void pullUserData(username)
  }

  function onVisibilityChange() {
    if (document.visibilityState === 'hidden') {
      // Flush pending edits before the OS suspends the page
      if (pushTimer) void pushUserData(username)
    } else {
      refresh()
    }
  }

  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('focus', refresh)
  window.addEventListener('online', refresh)
  window.addEventListener('pageshow', refresh)
  const poll = setInterval(() => {
    // Don't pull over edits that are about to be pushed
    if (!pushTimer && !inflightPush) refresh()
  }, POLL_INTERVAL_MS)

  void pullUserData(username)

  return () => {
    unsubscribe()
    document.removeEventListener('visibilitychange', onVisibilityChange)
    window.removeEventListener('focus', refresh)
    window.removeEventListener('online', refresh)
    window.removeEventListener('pageshow', refresh)
    clearInterval(poll)
    cancelPush()
    ready = false
    activeUsername = null
  }
}
