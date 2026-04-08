import { create } from 'zustand'

const AUTH_KEY = 'nriseup-auth'

async function sha256hex(str: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

interface StoredAuth {
  credentials: Record<string, string>
  activeUser: string | null
}

function readAuth(): StoredAuth {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return { credentials: {}, activeUser: null }
    const parsed = JSON.parse(raw) as StoredAuth & { state?: StoredAuth }
    // handle legacy Zustand persist format ({ state: { ... } })
    if (parsed.state) return { credentials: parsed.state.credentials ?? {}, activeUser: parsed.state.activeUser ?? null }
    return { credentials: parsed.credentials ?? {}, activeUser: parsed.activeUser ?? null }
  } catch {
    return { credentials: {}, activeUser: null }
  }
}

function writeAuth(data: StoredAuth): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(data))
}

interface AuthState extends StoredAuth {
  register: (username: string, password: string) => Promise<boolean>
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
}

const initial = readAuth()

export const useAuthStore = create<AuthState>()((set, get) => ({
  credentials: initial.credentials,
  activeUser: initial.activeUser,

  register: async (username, password) => {
    const trimmed = username.trim().toLowerCase()
    if (!trimmed || !password) return false
    if (get().credentials[trimmed]) return false // username already taken
    const hash = await sha256hex(password)
    const next: StoredAuth = {
      credentials: { ...get().credentials, [trimmed]: hash },
      activeUser: trimmed,
    }
    writeAuth(next)          // synchronous write before reload
    set(next)
    window.location.reload()
    return true
  },

  login: async (username, password) => {
    const trimmed = username.trim().toLowerCase()
    const hash = await sha256hex(password)
    if (get().credentials[trimmed] !== hash) return false
    const next: StoredAuth = { credentials: get().credentials, activeUser: trimmed }
    writeAuth(next)          // synchronous write before reload
    set(next)
    window.location.reload()
    return true
  },

  logout: () => {
    const next: StoredAuth = { credentials: get().credentials, activeUser: null }
    writeAuth(next)          // synchronous write before reload
    set(next)
    window.location.reload()
  },
}))
