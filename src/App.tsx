import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { pullUserData, schedulePush, cancelPush } from './lib/syncService'
import { useFinanceStore } from './store/useFinanceStore'
import { useAuthStore } from './store/useAuthStore'
import BottomNav from './components/layout/BottomNav'
import TopBar from './components/layout/TopBar'
import Home from './pages/Home'
import Accounts from './pages/Accounts'
import Assets from './pages/Assets'
import Investments from './pages/Investments'
import SplashScreen from './pages/SplashScreen'
import LoginScreen from './pages/LoginScreen'

export default function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const syncUnsubRef = useRef<(() => void) | null>(null)
  const theme = useFinanceStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, sess) => {
        setSession(sess)
        setAuthLoading(false)

        // Keep auth store activeUser in sync so TopBar can read it without touching session
        const username = (sess?.user?.user_metadata?.username as string | undefined) ?? null
        useAuthStore.setState({ activeUser: username })

        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && sess) {
          await pullUserData(sess.user.id)
          // (Re-)subscribe to store changes for cloud sync
          syncUnsubRef.current?.()
          syncUnsubRef.current = useFinanceStore.subscribe(() => {
            schedulePush(sess.user.id)
          })
        }

        if (event === 'SIGNED_OUT') {
          cancelPush()
          syncUnsubRef.current?.()
          syncUnsubRef.current = null
          useFinanceStore.getState().clearStore()
        }
      }
    )

    return () => {
      subscription.unsubscribe()
      syncUnsubRef.current?.()
    }
  }, [])

  if (showSplash) {
    return <SplashScreen onDone={() => setShowSplash(false)} />
  }

  // Prevent login-screen flash while Supabase restores session from localStorage
  if (authLoading) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: 'var(--color-surface)' }}
      />
    )
  }

  if (!session) {
    return <LoginScreen />
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
