import { useLocation } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import { useAuthStore } from '../../store/useAuthStore'

const ROUTE_TITLES: Record<string, string> = {
  '/': 'N.RiseUp',
  '/accounts': 'Accounts',
  '/assets': 'Assets',
  '/investments': 'Investments',
}

export default function TopBar() {
  const { pathname } = useLocation()
  const title = ROUTE_TITLES[pathname] ?? 'N.RiseUp'
  const activeUser = useAuthStore((s) => s.activeUser)
  const logout = useAuthStore((s) => s.logout)

  return (
    <header
      className="flex items-center justify-between px-4 py-3 shrink-0 border-b"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <h1 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
        {title}
      </h1>
      <div className="flex items-center gap-2">
        {activeUser && (
          <span className="text-xs font-medium px-2 py-1 rounded-lg" style={{ color: 'var(--color-text-secondary)', background: 'var(--color-card)' }}>
            {activeUser}
          </span>
        )}
        <ThemeToggle />
        <button
          onClick={logout}
          className="p-2 rounded-lg"
          style={{ color: 'var(--color-text-secondary)', background: 'var(--color-card)' }}
          title="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}
