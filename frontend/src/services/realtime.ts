import { createClient } from '@supabase/supabase-js'
import { auth } from './api'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const realtime = url && key
  ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  : null

export async function authorizeRealtime() {
  const token = auth.get()?.access_token
  if (token && realtime) await realtime.realtime.setAuth(token)
}
