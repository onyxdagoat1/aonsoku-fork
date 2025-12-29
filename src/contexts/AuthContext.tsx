import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import axios from 'axios'
import { useAppStore } from '@/store/app.store'

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
  isAuthenticated: boolean
  navidromeUsername: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mock authentication mode (set to true for testing without Supabase)
const MOCK_AUTH_MODE = import.meta.env.VITE_MOCK_AUTH === 'true'

// Mock user data for testing
const createMockUser = (username: string): User => ({
  id: `mock-user-${username}`,
  app_metadata: {},
  user_metadata: {
    username: username,
    full_name: username,
  },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: `${username}@navidrome.local`,
  email_confirmed_at: new Date().toISOString(),
  phone: '',
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  role: 'authenticated',
  updated_at: new Date().toISOString(),
})

const createMockProfile = (username: string): Profile => ({
  id: `mock-user-${username}`,
  username: username,
  display_name: username,
  avatar_url: null,
  bio: `Navidrome user: ${username}`,
  navidrome_username: username,
  navidrome_user_id: null,
  navidrome_password: null,
  is_admin: false,
  is_yeditor: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
})

const createMockSession = (username: string): Session => ({
  access_token: `mock-access-token-${username}`,
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: createMockUser(username),
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [navidromeUsername, setNavidromeUsername] = useState<string | null>(null)

  // Get Navidrome authentication state
  const navidromeConfig = useAppStore((state) => state.data)

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
            navidrome_password: navidromePassword,
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
      
      // If user already exists, try to link
      if (error?.response?.data?.message?.includes('already exists')) {
        console.log('ℹ️ Navidrome user already exists, attempting to link...')
        
        await supabase
          .from('profiles')
          .update({
            navidrome_username: username,
          })
          .eq('id', userId)
          
        return false
      }
      
      return false
    }
  }

  // Auto-create Supabase profile for Navidrome user
  const autoCreateSupabaseProfile = async (navidromeUser: string) => {
    if (!isSupabaseConfigured) {
      console.log('ℹ️ Supabase not configured, using fallback authentication')
      // Create mock user for Navidrome username
      setUser(createMockUser(navidromeUser))
      setProfile(createMockProfile(navidromeUser))
      setSession(createMockSession(navidromeUser))
      return
    }

    try {
      console.log('🔄 Auto-creating Supabase profile for Navidrome user:', navidromeUser)

      // Check if profile already exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('navidrome_username', navidromeUser)
        .maybeSingle()

      if (fetchError) {
        console.error('Error fetching profile:', fetchError)
      }

      if (existingProfile) {
        console.log('✅ Found existing Supabase profile for Navidrome user')
        setProfile(existingProfile)
        
        // Create a pseudo-user for display purposes
        setUser(createMockUser(navidromeUser))
        setSession(createMockSession(navidromeUser))
        return
      }

      // Create new profile for Navidrome user
      console.log('📝 Creating new Supabase profile for Navidrome user')
      
      const newProfile: Partial<Profile> = {
        id: `navidrome-${navidromeUser}-${Date.now()}`,
        username: navidromeUser,
        display_name: navidromeUser,
        navidrome_username: navidromeUser,
        bio: `Navidrome user`,
        is_admin: false,
        is_yeditor: false,
      }

      const { data: createdProfile, error: createError } = await supabase
        .from('profiles')
        .insert([newProfile])
        .select()
        .single()

      if (createError) {
        console.error('⚠️ Failed to create profile:', createError)
        // Fall back to mock mode
        setUser(createMockUser(navidromeUser))
        setProfile(createMockProfile(navidromeUser))
        setSession(createMockSession(navidromeUser))
      } else {
        console.log('✅ Supabase profile created successfully')
        setProfile(createdProfile)
        setUser(createMockUser(navidromeUser))
        setSession(createMockSession(navidromeUser))
      }
    } catch (error) {
      console.error('⚠️ Error in auto-create profile:', error)
      // Fall back to mock mode
      setUser(createMockUser(navidromeUser))
      setProfile(createMockProfile(navidromeUser))
      setSession(createMockSession(navidromeUser))
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
    const initializeAuth = async () => {
      // Mock authentication mode
      if (MOCK_AUTH_MODE) {
        console.log('🧪 Mock authentication mode enabled')
        const mockUsername = 'testuser'
        setUser(createMockUser(mockUsername))
        setProfile(createMockProfile(mockUsername))
        setSession(createMockSession(mockUsername))
        setLoading(false)
        return
      }

      // Check if Navidrome is configured and user is logged in
      if (navidromeConfig.isServerConfigured && navidromeConfig.username) {
        console.log('🎵 Navidrome user detected:', navidromeConfig.username)
        setNavidromeUsername(navidromeConfig.username)
        
        if (!isSupabaseConfigured) {
          // If Supabase not configured, use Navidrome auth only
          console.log('ℹ️ Supabase not configured, using Navidrome authentication')
          await autoCreateSupabaseProfile(navidromeConfig.username)
          setLoading(false)
          return
        }
      }

      if (!isSupabaseConfigured) {
        setLoading(false)
        return
      }

      // Get initial session
      const { data: { session } } = await supabase.auth.getSession()
      
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else if (navidromeConfig.username) {
        // User logged into Navidrome but not Supabase - auto-create profile
        await autoCreateSupabaseProfile(navidromeConfig.username)
      }
      
      setLoading(false)

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
          // Check if still logged into Navidrome
          if (navidromeConfig.username) {
            await autoCreateSupabaseProfile(navidromeConfig.username)
          }
        }
        
        setLoading(false)
      })

      return () => subscription.unsubscribe()
    }

    initializeAuth()
  }, [navidromeConfig.isServerConfigured, navidromeConfig.username])

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
    
    // Clear local state
    setUser(null)
    setProfile(null)
    setSession(null)
  }

  // Update profile
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user && !profile) return { error: new Error('No user logged in') }

    if (MOCK_AUTH_MODE || !isSupabaseConfigured) {
      console.log('🧪 Mock update profile:', updates)
      setProfile((prev) => (prev ? { ...prev, ...updates } : null))
      return { error: null }
    }

    const userId = user?.id || profile?.id
    if (!userId) return { error: new Error('No user ID found') }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)

    if (!error) {
      setProfile((prev) => (prev ? { ...prev, ...updates } : null))
    }

    return { error }
  }

  const isAuthenticated = !!(user || profile || navidromeUsername)

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
    isConfigured: MOCK_AUTH_MODE || isSupabaseConfigured || !!navidromeUsername,
    isAuthenticated,
    navidromeUsername,
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
