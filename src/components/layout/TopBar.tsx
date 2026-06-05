import { useLocation, useNavigate } from 'react-router-dom'
import { Settings } from 'lucide-react'
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
      style={{
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <h1
        className="text-base font-bold tracking-tight"
        style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}
      >
        {title}
      </h1>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {activeUser && (
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-xl transition-all"
            style={{
              color: 'var(--color-text-secondary)',
              background: 'var(--color-card)',
              border: '1px solid var(--color-border)',
            }}
          >
            {userProfile.avatar && userProfile.avatar.startsWith('data:') ? (
              <img src={userProfile.avatar} className="w-5 h-5 rounded-full object-cover" alt="Profile" />
            ) : null}
            <span className="max-w-[80px] truncate">{userProfile.displayName}</span>
            <Settings size={11} />
          </button>
        )}
        {activeUser && (
          <button
            onClick={logout}
            className="text-xs px-2.5 py-1.5 rounded-xl transition-all font-medium"
            style={{
              color: 'var(--color-text-secondary)',
              background: 'var(--color-card)',
              border: '1px solid var(--color-border)',
            }}
            title="Sign out"
          >
            Out
          </button>
        )}
      </div>
    </header>
  )
}
