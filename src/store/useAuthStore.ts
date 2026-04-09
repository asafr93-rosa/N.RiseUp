import { create } from 'zustand'
import { supabase } from '../lib/supabase'

async function sha256hex(str: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// Persist the active session in localStorage so the user stays logged in on refresh
const SESSION_KEY = 'nriseup-session'

function readActiveUser(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as { activeUser?: string }).activeUser ?? null : null
  } catch {
    return null
  }
}

interface AuthState {
  activeUser: string | null
  register: (username: string, password: string) => Promise<{ error: string | null }>
  login: (username: string, password: string) => Promise<{ error: string | null }>
  logout: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  // Initialise synchronously from localStorage so the app doesn't flash the login screen
  activeUser: readActiveUser(),

  register: async (username, password) => {
    const trimmed = username.trim().toLowerCase()
    if (!trimmed || !password) return { error: 'Username and password are required.' }
    if (password.length < 6) return { error: 'Password must be at least 6 characters.' }

    const hash = await sha256hex(password)

    // Check if username is already taken
    const { data: existing } = await supabase
      .from('credentials')
      .select('username')
      .eq('username', trimmed)
      .maybeSingle()

    if (existing) return { error: 'Username already taken. Choose another.' }

    const { error } = await supabase
      .from('credentials')
      .insert({ username: trimmed, password_hash: hash })

    if (error) {
      console.error('[auth] register error', error)
      return { error: 'Registration failed. Please try again.' }
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify({ activeUser: trimmed }))
    set({ activeUser: trimmed })
    return { error: null }
  },

  login: async (username, password) => {
    const trimmed = username.trim().toLowerCase()
    if (!trimmed || !password) return { error: 'Username and password are required.' }

    const hash = await sha256hex(password)

    const { data, error } = await supabase
      .from('credentials')
      .select('username')
      .eq('username', trimmed)
      .eq('password_hash', hash)
      .maybeSingle()

    if (error) {
      console.error('[auth] login error', error)
      return { error: 'Cannot connect to server. Check your connection.' }
    }
    if (!data) return { error: 'Invalid username or password.' }

    localStorage.setItem(SESSION_KEY, JSON.stringify({ activeUser: trimmed }))
    set({ activeUser: trimmed })
    return { error: null }
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY)
    set({ activeUser: null })
  },
}))
