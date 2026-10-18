import { useState } from 'react'
import toast from 'react-hot-toast'
import { RefreshCw, UploadCloud, RotateCcw, DownloadCloud } from 'lucide-react'
import ConfirmDialog from '../ui/ConfirmDialog'
import { useSyncStatus, syncNow, uploadThisDevice, restoreBackup, discardBackup, takeCloudData } from '../../lib/syncService'

type Pending = 'upload' | 'restore' | 'discard' | 'cloud' | null

export default function SyncSection() {
  const { state, lastSyncedAt, hasBackup, lastError } = useSyncStatus()
  const [pending, setPending] = useState<Pending>(null)

  const statusText =
    state === 'syncing' ? 'Syncing…'
      : state === 'conflict' ? 'Paused — choose which data to keep'
      : state === 'error' ? 'Sync failed — retrying'
        : lastSyncedAt ? `Synced ${new Date(lastSyncedAt).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}`
          : 'Not synced yet'

  async function handleUpload() {
    const error = await uploadThisDevice()
    if (error) toast.error(`Upload failed: ${error}`)
    else toast.success('This device\'s data is now on all devices')
  }

  async function handleCloud() {
    const ok = await takeCloudData()
    if (ok) toast.success('Cloud data loaded on this device')
    else toast.error('Download failed — check your connection')
  }

  async function handleRestore() {
    const ok = await restoreBackup()
    if (ok) toast.success('Previous data restored and synced')
    else toast.error('Restore failed — check your connection')
  }

  const rowBtn = 'flex items-center gap-2 text-left text-sm font-medium px-4 py-2.5 rounded-xl'

  return (
    <section className="card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Sync</p>
          <p className="text-xs mt-0.5" style={{ color: state === 'error' || state === 'conflict' ? 'var(--color-expense)' : 'var(--color-text-secondary)' }}>
            {statusText}
          </p>
        </div>
        <button
          onClick={() => void syncNow()}
          disabled={state === 'syncing'}
          aria-label="Sync now"
          className="p-2.5 rounded-xl"
          style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
        >
          <RefreshCw size={16} className={state === 'syncing' ? 'animate-spin' : ''} />
        </button>
      </div>
      {state === 'error' && lastError && (
        <p className="text-xs break-words" style={{ color: 'var(--color-expense)' }}>{lastError}</p>
      )}
      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        All devices signed in to this account share the same data and update automatically.
      </p>

      {state === 'conflict' && (
        <div className="flex flex-col gap-2 rounded-xl p-3" style={{ border: '1px solid var(--color-expense)' }}>
          <p className="text-xs" style={{ color: 'var(--color-text-primary)' }}>
            This device has changes that never reached the cloud, and the cloud copy is different.
            Choose which data every device should use.
          </p>
          <button onClick={() => setPending('cloud')} className={rowBtn} style={{ color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}>
            <DownloadCloud size={16} />
            Use the cloud data on this device
          </button>
        </div>
      )}

      <button onClick={() => setPending('upload')} className={rowBtn} style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent)' }}>
        <UploadCloud size={16} />
        Use this device's data on all devices
      </button>

      {hasBackup && (
        <div className="flex flex-col gap-2 rounded-xl p-3" style={{ border: '1px solid var(--color-border)' }}>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            This device had different data before it first synced. A copy was kept.
          </p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setPending('restore')} className={rowBtn} style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent)' }}>
              <RotateCcw size={16} />
              Restore it
            </button>
            <button onClick={() => setPending('discard')} className={rowBtn} style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
              Discard copy
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={pending === 'upload'}
        onClose={() => setPending(null)}
        onConfirm={() => void handleUpload()}
        title="Replace data on all devices?"
        message="Your other devices will be replaced with exactly what this device shows now."
        confirmLabel="Replace"
      />
      <ConfirmDialog
        open={pending === 'cloud'}
        onClose={() => setPending(null)}
        onConfirm={() => void handleCloud()}
        title="Use the cloud data?"
        message="This device will show the cloud copy. Its current data is kept as a backup you can restore."
        confirmLabel="Use cloud data"
      />
      <ConfirmDialog
        open={pending === 'restore'}
        onClose={() => setPending(null)}
        onConfirm={() => void handleRestore()}
        title="Restore previous data?"
        message="The data this device had before syncing will replace the current data on all devices."
        confirmLabel="Restore"
      />
      <ConfirmDialog
        open={pending === 'discard'}
        onClose={() => setPending(null)}
        onConfirm={discardBackup}
        title="Discard saved copy?"
        message="The copy of this device's pre-sync data will be deleted."
        confirmLabel="Discard"
      />
    </section>
  )
}
