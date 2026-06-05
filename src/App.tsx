import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { pullUserData, schedulePush, cancelPush } from './lib/syncService'
import { useFinanceStore } from './store/useFinanceStore'
import { useAuthStore } from './store/useAuthStore'
import BottomNav from './components/layout/BottomNav'
import TopBar from './components/layout/TopBar'
import Home from './pages/Home'
import Accounts from './pages/Accounts'
import Assets from './pages/Assets'
import Investments from './pages/Investments'
import Advisor from './pages/Advisor'
import SplashScreen from './pages/SplashScreen'
import LoginScreen from './pages/LoginScreen'
import LockScreen from './pages/LockScreen'
import Settings from './pages/Settings'
import { useLock } from './hooks/useLock'

export default function App() {
  const [showSplash, setShowSplash] = useState(true)
  const activeUser = useAuthStore((s) => s.activeUser)
  const theme = useFinanceStore((s) => s.theme)
  const lockSettings = useFinanceStore((s) => s.lockSettings)
  const { isUnlocked, unlock } = useLock()
  const syncUnsubRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  // Pull data from Supabase when user logs in; push on every store change
  useEffect(() => {
    if (!activeUser) {
      cancelPush()
      syncUnsubRef.current?.()
      syncUnsubRef.current = null
      return
    }

    void pullUserData(activeUser)

    syncUnsubRef.current?.()
    syncUnsubRef.current = useFinanceStore.subscribe(() => {
      schedulePush(activeUser)
    })

    return () => {
      syncUnsubRef.current?.()
      syncUnsubRef.current = null
    }
  }, [activeUser])

  if (showSplash) {
    return <SplashScreen onDone={() => setShowSplash(false)} />
  }

  if (!activeUser) {
    return <LoginScreen />
  }

  if (lockSettings.enabled && !isUnlocked) {
    return <LockScreen onUnlock={unlock} />
  }

  return (
    <BrowserRouter>
      <div
        className="flex flex-col h-full"
        style={{ background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
      >
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/assets" element={<Assets />} />
            <Route path="/investments" element={<Investments />} />
            <Route path="/advisor" element={<Advisor />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <BottomNav />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'var(--color-card)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              fontSize: '14px',
            },
          }}
        />
      </div>
    </BrowserRouter>
  )
}
