import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials not configured. Social features (profiles, comments, playlists) will be disabled.'
  )
}

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    flowType: 'pkce' // More secure auth flow
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-application-name': 'yedits-net'
    }
  }
})

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey)
}

// Export types for convenience
export type SupabaseClient = typeof supabase
