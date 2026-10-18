import { useLocation, useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { useSyncStatus } from '../../lib/syncService'

/** Shown on every page while sync is paused waiting for the user to pick a data copy. */
export default function SyncConflictBanner() {
  const state = useSyncStatus((s) => s.state)
  const navigate = useNavigate()
  const { pathname } = useLocation()

  if (state !== 'conflict' || pathname === '/settings') return null

  return (
    <button
      onClick={() => navigate('/settings')}
      className="shrink-0 mx-4 mb-2 flex items-center gap-2 text-left text-xs font-medium px-3 py-2.5 rounded-xl"
      style={{ background: '#f8717120', color: 'var(--color-expense)' }}
    >
      <AlertTriangle size={14} className="shrink-0" />
      Sync paused: this device and the cloud have different data. Tap to choose.
    </button>
  )
}
