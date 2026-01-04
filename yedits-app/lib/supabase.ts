import { createClient, SupabaseClient } from '@supabase/supabase-js'
import Constants from 'expo-constants'

// Get Supabase credentials from environment
const supabaseUrl =
  Constants.expoConfig?.extra?.supabaseUrl ||
  process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey =
  Constants.expoConfig?.extra?.supabaseAnonKey ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials not configured. Social features will be disabled.',
  )
}

// Helper to validate URL
const isValidUrl = (url: string) => {
  try {
    return url.startsWith('http://') || url.startsWith('https://')
  } catch {
    return false
  }
}

// Create Supabase client
export const supabase: SupabaseClient | null =
  supabaseUrl &&
  supabaseAnonKey &&
  isValidUrl(supabaseUrl) &&
  !supabaseUrl.includes('your_supabase_url')
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false, // Disable for React Native
        },
      })
    : null

// Helper to check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return supabase !== null
}

// Auth helpers
export const signInWithEmail = async (email: string, password: string) => {
  if (!supabase) throw new Error('Supabase not configured')
  return supabase.auth.signInWithPassword({ email, password })
}

export const signUpWithEmail = async (email: string, password: string) => {
  if (!supabase) throw new Error('Supabase not configured')
  return supabase.auth.signUp({ email, password })
}

export const signOut = async () => {
  if (!supabase) throw new Error('Supabase not configured')
  return supabase.auth.signOut()
}

export const getCurrentUser = async () => {
  if (!supabase) return null
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export const getSession = async () => {
  if (!supabase) return null
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}
