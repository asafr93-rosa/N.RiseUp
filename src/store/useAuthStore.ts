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
    })
    if (error) {
      // "User already registered" → friendly message
      if (error.message.toLowerCase().includes('already')) {
        return { error: 'Username already taken. Choose another.' }
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
    if (error) return { error: 'Invalid username or password.' }
    set({ activeUser: trimmed })
    return { error: null }
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({ activeUser: null })
  },
}))
