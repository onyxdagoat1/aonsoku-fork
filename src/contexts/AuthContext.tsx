import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import axios from 'axios'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signInWithProvider: (provider: 'google' | 'discord' | 'github') => Promise<void>
  signInWithGoogle: () => Promise<void>
  signInWithDiscord: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>
  signUpWithEmail: (email: string, password: string, username: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>
  isConfigured: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const isConfigured = isSupabaseConfigured()

  // Create Navidrome user for new Supabase user
  const createNavidromeUser = async (userId: string, username: string, email: string) => {
    try {
      const authServiceUrl = import.meta.env.VITE_ACCOUNT_API_URL || 'http://localhost:3005/api'
      
      // Generate a random password for Navidrome
      const navidromePassword = `${username}_${Math.random().toString(36).slice(2, 12)}`
      
      // Create Navidrome user via auth service
      const response = await axios.post(`${authServiceUrl}/auth/register`, {
        username,
        password: navidromePassword,
        email,
      })

      if (response.data.success) {
        // Update Supabase profile with Navidrome username
        await supabase
          .from('profiles')
          .update({
            navidrome_username: username,
            navidrome_user_id: response.data.user?.id || null,
          })
          .eq('id', userId)

        console.log('✅ Navidrome user created and linked:', username)
      }
    } catch (error) {
      console.error('⚠️ Failed to create Navidrome user (non-critical):', error)
      // Don't throw - user can still use the app without Navidrome
    }
  }

  // Fetch user profile
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error

      setProfile(data)

      // If profile exists but no Navidrome user, create one
      if (data && !data.navidrome_username) {
        const user = (await supabase.auth.getUser()).data.user
        if (user?.email) {
          await createNavidromeUser(userId, data.username, user.email)
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  // Initialize auth state
  useEffect(() => {
    if (!isConfigured) {
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [isConfigured])

  // Sign in with OAuth provider (Google, Discord, GitHub)
  const signInWithProvider = async (provider: 'google' | 'discord' | 'github') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/#/auth/callback`,
        queryParams: provider === 'google' ? {
          access_type: 'offline',
          prompt: 'consent',
        } : undefined,
      },
    })

    if (error) {
      console.error(`Error signing in with ${provider}:`, error)
      throw error
    }
  }

  // Sign in with Google (wrapper)
  const signInWithGoogle = async () => {
    await signInWithProvider('google')
  }

  // Sign in with Discord (wrapper)
  const signInWithDiscord = async () => {
    await signInWithProvider('discord')
  }

  // Sign in with email/password
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
  }

  // Alias for signIn (for compatibility)
  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signIn(email, password)
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  // Sign up with email
  const signUpWithEmail = async (email: string, password: string, username: string) => {
    // Check if username is available
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single()

    if (existingProfile) {
      return { error: new Error('Username already taken') }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    })

    if (error) return { error }

    // Create Navidrome user
    if (data.user) {
      await createNavidromeUser(data.user.id, username, email)
    }

    return { error: null }
  }

  // Sign out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  // Update profile
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)

    if (!error) {
      setProfile((prev) => (prev ? { ...prev, ...updates } : null))
    }

    return { error }
  }

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signInWithProvider,
    signInWithGoogle,
    signInWithDiscord,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    updateProfile,
    isConfigured,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
