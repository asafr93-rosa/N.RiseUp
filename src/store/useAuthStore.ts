import { create } from 'zustand'
import { persist } from 'zustand/middleware'

async function sha256hex(str: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

interface AuthState {
  credentials: Record<string, string> // username → sha256hex(password)
  activeUser: string | null
  register: (username: string, password: string) => Promise<boolean>
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      credentials: {},
      activeUser: null,

      register: async (username, password) => {
        const trimmed = username.trim().toLowerCase()
        if (!trimmed || !password) return false
        if (get().credentials[trimmed]) return false // already taken
        const hash = await sha256hex(password)
        set((s) => ({ credentials: { ...s.credentials, [trimmed]: hash } }))
        // auto-login after register
        set({ activeUser: trimmed })
        window.location.reload()
        return true
      },

      login: async (username, password) => {
        const trimmed = username.trim().toLowerCase()
        const hash = await sha256hex(password)
        if (get().credentials[trimmed] !== hash) return false
        set({ activeUser: trimmed })
        window.location.reload()
        return true
      },

      logout: () => {
        set({ activeUser: null })
        window.location.reload()
      },
    }),
    { name: 'nriseup-auth' }
  )
)
