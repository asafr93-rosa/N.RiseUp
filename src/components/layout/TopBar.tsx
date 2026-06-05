import { useLocation, useNavigate } from 'react-router-dom'
import { Settings, LogOut } from 'lucide-react'
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
      className="flex items-center justify-between px-4 py-2.5 shrink-0"
      style={{ background: 'var(--color-surface)' }}
    >
      <h1
        className="text-lg font-bold"
        style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.03em' }}
      >
        {title}
      </h1>

      <div className="flex items-center gap-1.5">
        <ThemeToggle />
        {activeUser && (
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl text-xs font-medium transition-all"
            style={{ background: 'var(--color-card)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
          >
            {userProfile.avatar?.startsWith('data:') && (
              <img src={userProfile.avatar} className="w-4 h-4 rounded-full object-cover" alt="" />
            )}
            <span className="max-w-[72px] truncate">{userProfile.displayName}</span>
            <Settings size={10} />
          </button>
        )}
        {activeUser && (
          <button
            onClick={logout}
            className="p-2 rounded-2xl transition-all"
            style={{ background: 'var(--color-card)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        )}
      </div>
    </header>
  )
}
