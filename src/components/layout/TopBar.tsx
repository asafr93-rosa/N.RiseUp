import { useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Settings } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import { useAuthStore } from '../../store/useAuthStore'
import { useFinanceStore } from '../../store/useFinanceStore'

const ROUTE_TITLES: Record<string, string> = {
  '/': 'N.RiseUp',
  '/accounts': 'Accounts',
  '/assets': 'Assets',
  '/investments': 'Investments',
}

export default function TopBar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const title = ROUTE_TITLES[pathname] ?? 'N.RiseUp'
  const activeUser = useAuthStore((s) => s.activeUser)
  const logout = useAuthStore((s) => s.logout)
  const userProfile = useFinanceStore((s) => s.userProfile)

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
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-lg"
            style={{ color: 'var(--color-text-secondary)', background: 'var(--color-card)' }}
          >
            {userProfile.avatar && userProfile.avatar.startsWith('data:')
              ? <img src={userProfile.avatar} className="w-5 h-5 rounded-full object-cover" alt="Profile" />
              : null}
            <span>{userProfile.displayName}</span>
            <Settings size={12} />
          </button>
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
