import { useState } from 'react'
import { TrendingUp } from 'lucide-react'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { useAuthStore } from '../store/useAuthStore'

type Tab = 'signin' | 'register'

export default function LoginScreen() {
  const [tab, setTab] = useState<Tab>('signin')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login, register } = useAuthStore()

  async function handleSubmit() {
    setError('')
    const u = username.trim()
    if (!u || !password) {
      setError('Username and password are required.')
      return
    }
    setLoading(true)
    const result = tab === 'signin'
      ? await login(u, password)
      : await register(u, password)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    }
    // On success: App.tsx's onAuthStateChange fires and session is set — no reload needed
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ background: 'var(--color-surface)' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="flex items-center justify-center rounded-2xl mb-3"
            style={{ width: 60, height: 60, background: '#2dd4bf' }}
          >
            <TrendingUp size={28} color="#fff" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>N.RiseUp</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Your personal finance tracker</p>
        </div>

        {/* Card */}
        <div className="card p-6">
          {/* Tabs */}
          <div
            className="flex rounded-xl p-1 mb-5"
            style={{ background: 'var(--color-surface)' }}
          >
            {(['signin', 'register'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError('') }}
                className="flex-1 py-2 text-sm font-medium rounded-lg transition-colors"
                style={{
                  background: tab === t ? 'var(--color-card)' : 'transparent',
                  color: tab === t ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {t === 'signin' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <Input
              label="Username"
              placeholder="your_username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
            />

            {error && (
              <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>
            )}

            <Button
              variant="primary"
              className="w-full mt-1"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Please wait…' : tab === 'signin' ? 'Sign In' : 'Create Account'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
