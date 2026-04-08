import { NavLink } from 'react-router-dom'
import { LayoutDashboard, CreditCard, Building2, TrendingUp } from 'lucide-react'

const TABS = [
  { path: '/', label: 'Home', Icon: LayoutDashboard },
  { path: '/accounts', label: 'Accounts', Icon: CreditCard },
  { path: '/assets', label: 'Assets', Icon: Building2 },
  { path: '/investments', label: 'Investments', Icon: TrendingUp },
]

export default function BottomNav() {
  return (
    <nav
      className="flex border-t pb-safe shrink-0"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      {TABS.map(({ path, label, Icon }) => (
        <NavLink
          key={path}
          to={path}
          end={path === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 py-2 gap-0.5 text-xs font-medium transition-colors ${
              isActive
                ? 'text-[#4361EE]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
