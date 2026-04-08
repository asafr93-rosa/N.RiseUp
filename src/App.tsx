import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useFinanceStore } from './store/useFinanceStore'
import BottomNav from './components/layout/BottomNav'
import TopBar from './components/layout/TopBar'
import Home from './pages/Home'
import Accounts from './pages/Accounts'
import Assets from './pages/Assets'
import Investments from './pages/Investments'

export default function App() {
  const theme = useFinanceStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

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
