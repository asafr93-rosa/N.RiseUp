import { useLocation } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'

const ROUTE_TITLES: Record<string, string> = {
  '/': 'N.RiseUp',
  '/accounts': 'Accounts',
  '/assets': 'Assets',
  '/investments': 'Investments',
}

export default function TopBar() {
  const { pathname } = useLocation()
  const title = ROUTE_TITLES[pathname] ?? 'N.RiseUp'

  return (
    <header
      className="flex items-center justify-between px-4 py-3 shrink-0 border-b"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <h1 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
        {title}
      </h1>
      <ThemeToggle />
    </header>
  )
}
