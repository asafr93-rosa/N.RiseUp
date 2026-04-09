import { create } from 'zustand'
import { supabase } from '../lib/supabase'

interface AuthState {
  activeUser: string | null
  register: (username: string, password: string) => Promise<{ error: string | null }>
  login: (username: string, password: string) => Promise<{ error: string | null }>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>()((set) => ({
  activeUser: null,

  register: async (username, password) => {
    const trimmed = username.trim().toLowerCase()
    if (!trimmed || !password) return { error: 'Username and password are required.' }
    const email = `${trimmed}@nriseup.local`
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username: trimmed } },
    }).catch(() => ({ data: null, error: { message: 'Cannot connect to server. Check your internet connection.' } }))
    if (error) {
      if (error.message.toLowerCase().includes('already')) {
        return { error: 'Username already taken. Choose another.' }
      }
      if (error.message.toLowerCase().includes('fetch') || error.message.toLowerCase().includes('connect')) {
        return { error: 'Cannot connect to server. Check your internet connection.' }
      }
      return { error: error.message }
    }
    set({ activeUser: trimmed })
    return { error: null }
  },

  login: async (username, password) => {
    const trimmed = username.trim().toLowerCase()
    if (!trimmed || !password) return { error: 'Username and password are required.' }
    const email = `${trimmed}@nriseup.local`
    const { error } = await supabase.auth.signInWithPassword({ email, password })
      .catch(() => ({ data: null, error: { message: 'fetch' } }))
    if (error) {
      if (error.message.toLowerCase().includes('fetch') || error.message.toLowerCase().includes('connect')) {
        return { error: 'Cannot connect to server. Check your internet connection.' }
      }
      return { error: 'Invalid username or password.' }
    }
    set({ activeUser: trimmed })
    return { error: null }
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({ activeUser: null })
  },
}))
