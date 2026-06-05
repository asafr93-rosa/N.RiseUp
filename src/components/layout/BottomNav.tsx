import { NavLink } from 'react-router-dom'
import { LayoutDashboard, CreditCard, Building2, TrendingUp, Brain } from 'lucide-react'

const TABS = [
  { path: '/', Icon: LayoutDashboard, label: 'Home' },
  { path: '/accounts', Icon: CreditCard, label: 'Accounts' },
  { path: '/investments', Icon: TrendingUp, label: 'Investments' },
  { path: '/assets', Icon: Building2, label: 'Assets' },
  { path: '/advisor', Icon: Brain, label: 'Advisor' },
]

export default function BottomNav() {
  return (
    <div className="shrink-0 px-3 pb-3 pb-safe">
      <nav
        className="flex items-center rounded-3xl"
        style={{
          background: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 2px 16px rgba(0,0,0,0.12)',
        }}
      >
        {TABS.map(({ path, Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            aria-label={label}
            className="flex flex-1 items-center justify-center py-2.5"
          >
            {({ isActive }) => (
              <div
                className="p-2.5 rounded-2xl transition-all"
                style={{
                  background: isActive ? 'var(--color-accent)' : 'transparent',
                  color: isActive ? '#09090b' : 'var(--color-text-secondary)',
                }}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              </div>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
