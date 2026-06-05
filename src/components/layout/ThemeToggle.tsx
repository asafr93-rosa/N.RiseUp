import { Sun, Moon } from 'lucide-react'
import { useFinanceStore } from '../../store/useFinanceStore'

export default function ThemeToggle() {
  const theme = useFinanceStore((s) => s.theme)
  const updateTheme = useFinanceStore((s) => s.updateTheme)

  return (
    <button
      onClick={() => updateTheme(theme === 'light' ? 'dark' : 'light')}
      className="p-2 rounded-lg transition-colors"
      style={{
        color: 'var(--color-text-secondary)',
        background: 'var(--color-card)',
        border: '1px solid var(--color-border)',
      }}
      aria-label="Toggle theme"
    >
      {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  )
}
