import { NavLink } from 'react-router-dom'
import { LayoutDashboard, CreditCard, Building2, TrendingUp, Brain } from 'lucide-react'

const TABS = [
  { path: '/', label: 'Home', Icon: LayoutDashboard },
  { path: '/accounts', label: 'Accounts', Icon: CreditCard },
  { path: '/investments', label: 'Investments', Icon: TrendingUp },
  { path: '/assets', label: 'Assets', Icon: Building2 },
  { path: '/advisor', label: 'Advisor', Icon: Brain },
]

export default function BottomNav() {
  return (
    <div className="shrink-0 px-3 pb-3 pb-safe">
      <nav
        className="flex rounded-3xl overflow-hidden"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid rgba(99,102,241,0.14)',
          boxShadow: '0 -2px 20px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {TABS.map(({ path, label, Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className="flex flex-col items-center justify-center flex-1 py-2.5 gap-0.5 text-xs font-medium transition-all"
            style={({ isActive }) => ({
              color: isActive ? '#6366f1' : 'var(--color-text-secondary)',
            })}
          >
            {({ isActive }) => (
              <>
                <div
                  className="p-1.5 rounded-xl transition-all"
                  style={{
                    background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
                  }}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                </div>
                <span style={{ fontSize: '10px' }}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
