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

// Mock authentication mode (set to true for testing without Supabase)
const MOCK_AUTH_MODE = import.meta.env.VITE_MOCK_AUTH === 'true'

// Mock user data for testing
const createMockUser = (): User => ({
  id: 'mock-user-id-123',
  app_metadata: {},
  user_metadata: {
    username: 'testuser',
    full_name: 'Test User',
  },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'test@example.com',
  email_confirmed_at: new Date().toISOString(),
  phone: '',
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  role: 'authenticated',
  updated_at: new Date().toISOString(),
})

const createMockProfile = (): Profile => ({
  id: 'mock-user-id-123',
  username: 'testuser',
  display_name: 'Test User',
  avatar_url: null,
  bio: 'This is a mock user for testing',
  navidrome_username: null,
  navidrome_user_id: null,
  navidrome_password: null,
  is_admin: true, // Mock user is admin for full testing
  is_yeditor: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
})

const createMockSession = (): Session => ({
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: createMockUser(),
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Create Navidrome user for new Supabase user (legacy - for email signup)
  const createNavidromeUser = async (userId: string, username: string, email: string) => {
    try {
      const authServiceUrl = import.meta.env.VITE_ACCOUNT_API_URL || 'http://localhost:3005/api'
      
      // Generate a secure random password for Navidrome
      const navidromePassword = `${username}_${Math.random().toString(36).slice(2, 15)}${Math.random().toString(36).slice(2, 15)}`
      
      console.log('🔄 Creating Navidrome account for:', username)
      
      // Create Navidrome user via auth service
      const response = await axios.post(`${authServiceUrl}/auth/register`, {
        username,
        password: navidromePassword,
        email,
      })

      if (response.data.success) {
        console.log('✅ Navidrome user created:', username)
        
        // Update Supabase profile with Navidrome credentials
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            navidrome_username: username,
            navidrome_user_id: response.data.user?.id || null,
            navidrome_password: navidromePassword, // Store for future logins
          })
          .eq('id', userId)

        if (profileError) {
          console.error('⚠️ Failed to update profile:', profileError)
        } else {
          console.log('✅ Profile updated with Navidrome credentials')
        }

        // Also update user metadata
        await supabase.auth.updateUser({
          data: {
            navidrome_username: username,
            navidrome_password: navidromePassword,
          }
        })
        
        return true
      }
      
      return false
    } catch (error: any) {
      console.error('⚠️ Failed to create Navidrome user:', error)
      
      // If user already exists, try to use existing username
      if (error?.response?.data?.message?.includes('already exists')) {
        console.log('ℹ️ Navidrome user already exists, attempting to link...')
        
        // Try to get password from auth service
        try {
          const authServiceUrl = import.meta.env.VITE_ACCOUNT_API_URL || 'http://localhost:3005/api'
          const passwordResponse = await axios.post(`${authServiceUrl}/auth/get-password`, {
            username,
            email,
          })
          
          if (passwordResponse.data.password) {
            const existingPassword = passwordResponse.data.password
            
            // Update profile with existing username and password
            await supabase
              .from('profiles')
              .update({
                navidrome_username: username,
                navidrome_password: existingPassword,
              })
              .eq('id', userId)

            // Update user metadata
            await supabase.auth.updateUser({
              data: {
                navidrome_username: username,
                navidrome_password: existingPassword,
              }
            })
          } else {
            // Just update username if password not available
            await supabase
              .from('profiles')
              .update({
                navidrome_username: username,
              })
              .eq('id', userId)
          }
        } catch (err) {
          // Just update username if password retrieval fails
          await supabase
            .from('profiles')
            .update({
              navidrome_username: username,
            })
            .eq('id', userId)
        }
          
        return false
      }
      
      return false
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

      // If profile exists but no Navidrome user, create one (for email signups)
      if (data && !data.navidrome_username) {
        const user = (await supabase.auth.getUser()).data.user
        if (user?.email) {
          console.log('📝 No Navidrome account found, creating one...')
          await createNavidromeUser(userId, data.username, user.email)
        }
      } else if (data?.navidrome_username) {
        console.log('✅ Navidrome account already linked:', data.navidrome_username)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  // Initialize auth state
  useEffect(() => {
    // Mock authentication mode
    if (MOCK_AUTH_MODE) {
      console.log('🧪 Mock authentication mode enabled')
      setUser(createMockUser())
      setProfile(createMockProfile())
      setSession(createMockSession())
      setLoading(false)
      return
    }

    if (!isSupabaseConfigured) {
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
      console.log('🔐 Auth state changed:', _event)
      
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
  }, [isSupabaseConfigured])

  // Sign in with OAuth provider (Google, Discord, GitHub)
  const signInWithProvider = async (provider: 'google' | 'discord' | 'github') => {
    if (MOCK_AUTH_MODE) {
      console.log('🧪 Mock sign in with', provider)
      return
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
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
    if (MOCK_AUTH_MODE) {
      console.log('🧪 Mock sign in with email')
      return
    }

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
    if (MOCK_AUTH_MODE) {
      console.log('🧪 Mock sign up with email')
      return { error: null }
    }

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
    if (MOCK_AUTH_MODE) {
      console.log('🧪 Mock sign out')
      return
    }

    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  // Update profile
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') }

    if (MOCK_AUTH_MODE) {
      console.log('🧪 Mock update profile:', updates)
      setProfile((prev) => (prev ? { ...prev, ...updates } : null))
      return { error: null }
    }

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
    isConfigured: MOCK_AUTH_MODE || isSupabaseConfigured,
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
