import { createClient } from '@supabase/supabase-js'
import { env } from './env.js'

const authOptions = { auth: { persistSession: false, autoRefreshToken: false } }

export const supabaseAuth = createClient(env.supabaseUrl, env.supabaseAnonKey, authOptions)
export const supabaseAdmin = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, authOptions)
