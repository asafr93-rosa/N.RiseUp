import { useState } from 'react'
import { Wallet, TrendingUp, ShieldCheck } from 'lucide-react'
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

  const features = [
    { icon: Wallet, title: 'Every account in one place', text: 'Bank accounts, credit cards and income side by side.' },
    { icon: TrendingUp, title: 'See where money goes', text: 'Monthly breakdowns, trends and category insights.' },
    { icon: ShieldCheck, title: 'Private by design', text: 'PIN lock and Face ID keep your data yours.' },
  ]

  return (
    <div
      className="fixed inset-0 flex md:grid md:grid-cols-2"
      style={{ background: 'var(--color-surface)' }}
    >
      {/* Brand panel — web only */}
      <div
        className="hidden md:flex flex-col justify-between p-12 lg:p-16 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0d9488 0%, #0f172a 100%)', color: '#fff' }}
      >
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="N.RiseUp" style={{ width: 40, height: 40, objectFit: 'contain' }} />
          <span className="text-xl font-bold">N.RiseUp</span>
        </div>
        <div className="flex flex-col gap-8 max-w-md">
          <h2 className="text-4xl lg:text-5xl font-bold leading-tight">Take control of your money.</h2>
          <div className="flex flex-col gap-5">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <Icon size={20} />
                </div>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm" style={{ opacity: 0.75 }}>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs" style={{ opacity: 0.6 }}>© {new Date().getFullYear()} N.RiseUp</p>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-12">
      <div className="w-full max-w-sm md:max-w-md">
        {/* Logo — mobile only */}
        <div className="flex flex-col items-center mb-8 md:hidden">
          <div className="mb-3">
            <img src="/logo.svg" alt="N.RiseUp" style={{ width: 64, height: 64, objectFit: 'contain' }} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>N.RiseUp</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Your personal finance tracker</p>
        </div>

        {/* Web heading */}
        <div className="hidden md:block mb-8">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {tab === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
            {tab === 'signin' ? 'Sign in to continue to your dashboard.' : 'Start tracking your finances in minutes.'}
          </p>
        </div>

        {/* Card */}
        <div className="card p-6 md:p-8 md:shadow-xl">
          {/* Tabs */}
          <div
            className="flex rounded-xl p-1 mb-5"
            style={{ background: 'var(--color-surface)' }}
          >
            {(['signin', 'register'] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
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

          <form
            className="flex flex-col gap-3 md:gap-4"
            onSubmit={(e) => { e.preventDefault(); void handleSubmit() }}
          >
            <Input
              label="Username"
              placeholder="your_username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              autoFocus
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
            />

            {error && (
              <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-1 md:py-3"
              disabled={loading}
            >
              {loading ? 'Please wait…' : tab === 'signin' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>
        </div>
      </div>
      </div>
    </div>
  )
}
