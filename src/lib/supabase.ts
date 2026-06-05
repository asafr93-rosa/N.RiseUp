import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Supabase auto-persists the session in its own localStorage key (sb-xxx-auth-token)
// and restores it on every page load — no extra config needed.
export const supabase = createClient(url, key)
