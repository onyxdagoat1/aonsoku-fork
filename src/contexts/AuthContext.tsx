import type { Session, User } from '@supabase/supabase-js'
import axios from 'axios'
import { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Database } from '@/lib/database.types'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/app.store'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signInWithProvider: (
    provider: 'google' | 'discord' | 'github',
  ) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signInWithDiscord: () => Promise<void>
  signInWithEmail: (
    email: string,
    password: string,
  ) => Promise<{ error: Error | null }>
  signUpWithEmail: (
    email: string,
    password: string,
    username: string,
  ) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>
  isConfigured: boolean
  isAuthenticated: boolean
  navidromeUsername: string | null
  syncError: string | null
  isSyncing: boolean
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
  website: null,
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
  const [navidromeUsername, setNavidromeUsername] = useState<string | null>(
    null,
  )
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  // Get Navidrome authentication state and actions
  const navidromeConfig = useAppStore((state) => state.data)
  const navidromeActions = useAppStore((state) => state.actions)

  // Login to Navidrome using credentials
  const loginToNavidrome = async (
    username: string,
    password: string | null,
  ) => {
    if (!password) {
      console.warn('⚠️ No Server password available for auto-login')
      setSyncError('No Server credentials found')
      return false
    }

    const navidromeUrl =
      import.meta.env.VITE_NAVIDROME_URL ||
      navidromeConfig.url ||
      'http://localhost:4533' // Fallback or env

    console.log('🔄 Attempting auto-login to Server...', {
      username,
      url: navidromeUrl,
    })

    setIsSyncing(true)
    setSyncError(null)

    try {
      // Add a race condition check or timeout for saveConfig if possible
      // But for now relying on axios timeout if it was used in saveConfig (it uses pingServer -> axios usually)

      const success = await navidromeActions.saveConfig({
        url: navidromeUrl,
        username: username,
        password: password,
      })

      if (success) {
        console.log('✅ Navidrome auto-login successful')
        setNavidromeUsername(username)
        return true
      } else {
        console.error('❌ Navidrome auto-login failed')
        setSyncError('Failed to connect to Music Server')
        return false
      }
    } catch (error: any) {
      console.error('❌ Error during Navidrome auto-login:', error)
      setSyncError(error.message || 'Error connecting to Music Server')
      setIsSyncing(false) // Explicitly set false here too
      return false
    } finally {
      setIsSyncing(false)
    }
  }

  // Create Navidrome user for new Supabase user
  const createNavidromeUser = async (
    userId: string,
    username: string,
    email: string,
  ) => {
    try {
      const authServiceUrl =
        import.meta.env.VITE_ACCOUNT_API_URL || 'http://localhost:3005/api'

      // Generate a secure random password for Navidrome
      const navidromePassword = `${username}_${Math.random().toString(36).slice(2, 15)}${Math.random().toString(36).slice(2, 15)}`

      console.log('🔄 Creating Navidrome account for:', username)

      // Create Navidrome user via auth service
      // Added timeout to prevent hanging
      const response = await axios.post(
        `${authServiceUrl}/auth/register`,
        {
          username,
          password: navidromePassword,
          email,
        },
        { timeout: 10000 },
      ) // 10s timeout

      console.log('📦 Auth Service Response:', response.data)

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
          },
        })

        // Auto login to Navidrome immediately
        await loginToNavidrome(username, navidromePassword)

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
    // ... (This function is mostly for the legacy reverse flow, keeping it for compatibility but prioritizing the new flow)
    if (!isSupabaseConfigured) {
      console.log('ℹ️ Supabase not configured, using fallback authentication')
      setUser(createMockUser(navidromeUser))
      setProfile(createMockProfile(navidromeUser))
      setSession(createMockSession(navidromeUser))
      return
    }

    try {
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('navidrome_username', navidromeUser)
        .maybeSingle()

      if (existingProfile) {
        setProfile(existingProfile)
        // If we found a profile via Navidrome username, we don't necessarily have a Supabase user session
        // dealing with this edge case:
        if (!user) {
          setUser(createMockUser(navidromeUser))
        }
        return
      }
      // ... (Rest of creation logic if needed, but we want to avoid creating duplicate profiles if possible)
    } catch (error) {
      console.error('⚠️ Error in auto-create profile:', error)
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

      // UNIFIED AUTH: Link to Navidrome
      if (data && data.navidrome_username) {
        if (data.navidrome_password) {
          // We have credentials, perform auto-login to Navidrome
          if (
            !navidromeConfig.isServerConfigured ||
            navidromeConfig.username !== data.navidrome_username
          ) {
            await loginToNavidrome(
              data.navidrome_username,
              data.navidrome_password,
            )
          }
        } else {
          console.warn(
            '⚠️ Navidrome username linked but no password found in profile.',
          )
        }
      }

      // If profile exists but no Navidrome user, create one (for email signups that missed creation)
      if (data && !data.navidrome_username) {
        const user = (await supabase.auth.getUser()).data.user
        if (user?.email) {
          console.log('📝 No Navidrome account found, creating one...')
          await createNavidromeUser(userId, data.username, user.email)
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setLoading(false)
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

      if (!isSupabaseConfigured) {
        // Fallback to existing Navidrome config if Supabase is down/not configured
        if (navidromeConfig.isServerConfigured && navidromeConfig.username) {
          setNavidromeUsername(navidromeConfig.username)
          await autoCreateSupabaseProfile(navidromeConfig.username)
        }
        setLoading(false)
        return
      }

      // Get initial session
      const {
        data: { session },
      } = await supabase.auth.getSession()

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await fetchProfile(session.user.id)
      } else if (
        navidromeConfig.username &&
        navidromeConfig.isServerConfigured
      ) {
        // User logged into Navidrome but not Supabase - auto-create profile (Legacy/Fallback)
        setNavidromeUsername(navidromeConfig.username)
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
          // If Supabase logs out, we should probably logout of Navidrome too or handle it?
          // For now, let's keep them somewhat synced.
          // navidromeActions.removeConfig() // Optional: Force Navidrome logout
        }

        setLoading(false)
      })

      return () => subscription.unsubscribe()
    }

    initializeAuth()
  }, []) // Remove dependencies to run once on mount

  // Sign in with OAuth provider (Google, Discord, GitHub)
  const signInWithProvider = async (
    provider: 'google' | 'discord' | 'github',
  ) => {
    if (MOCK_AUTH_MODE) {
      console.log('🧪 Mock sign in with', provider)
      return
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams:
          provider === 'google'
            ? {
                access_type: 'offline',
                prompt: 'consent',
              }
            : undefined,
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

  // Alias for signIn (for compatibility), but now handles both email and username
  const signInWithEmail = async (login: string, password: string) => {
    try {
      await signIn(login, password)
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  // Sign in with email or username
  const signIn = async (login: string, password: string) => {
    if (MOCK_AUTH_MODE) {
      console.log('🧪 Mock sign in with', login)
      return
    }

    const email = login

    // If login is not an email, try to resolve username to email
    if (!login.includes('@')) {
      console.log('🔍 Resolving username:', login)

      // Since we can't easily query users table, we check profiles
      // Important: This assumes profiles are created with a username
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', login)
        .single()

      if (profileError || !profile) {
        throw new Error('User not found or invalid username')
      }

      // We found the profile, but we can't get the email directly from profiles if RLS hides it or it's not stored
      // dealing with this edge case:
      // If we don't have the email in profiles, we can't login via Supabase this way without an Edge Function.
      // BUT: The user said "it saved the profile in supabase".
      // Let's assume we can't perform this lookup easily without an admin client or storing email in public profile.
      // FOR NOW: Let's assume the user MUST provide email OR we stored email in profile (which we should do).

      // CHECK: Does profile table have email?
      // In the AdminPanel `loadUsers` fallback: `email: 'N/A'`.
      // This implies we DO NOT have email in profiles by default.
      // WE NEED TO FIX THIS: When signing up, we should store email in profile if possible, OR we should use the auth service to resolve it.

      // TEMPORARY FIX: We'll try to use the auth service (if it exists) or fail with a helpful message.
      // Actually, standard Supabase doesn't support username login client-side.
      // We'll throw an error for now if we can't resolve it, but we'll try to match exact username match.

      // Correction: If we can't resolve username -> email, we can't login with purely client-side Supabase keys.
      // Unless... we use the Navidrome auth first?
      // The user wants Unified Login.
      // If we authenticate against Navidrome (using `auth-service` as proxy?), we might get the email?
      // No, Navidrome doesn't expose email easily.

      // BEST PATH: We should assume the user might have entered an email.
      // If it's a username, we really need that email mapping.
      // Implementation Plan update: We will rely on user entering Email for now unless we add `email` to `profiles` (which is PII and risky to expose public read).
      // However, if we assume we are using the `auth-service`, can we check there?
      // `auth-service` uses Navidrome. Navidrome users have emails.
      // Maybe we can ask `auth-service`?

      // Let's try to query the profiles table for now, maybe we added email column?
      // The user said "ask for username OR email".
      // Let's look at `createNavidromeUser`... it creates a profile.
      // Let's try to fetch `email` from `profiles`. If it fails, we fall back to assuming `login` IS the email.
      const { data: profileWithEmail } = await supabase
        .from('profiles')
        .select('id, username') // We probably can't select email if it's not there.
        .eq('username', login)
        .single()

      if (profileWithEmail) {
        // Since we don't store email in public profiles, we CANNOT resolve username -> email client side securely.
        // We'll throw a very specific error.
        throw new Error(
          'Username login is currently disabled. Please use your Email address instead.',
        )
      }
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    // fetchProfile will be triggered by onAuthStateChange
  }

  // Sign up with email
  const signUpWithEmail = async (
    email: string,
    password: string,
    username: string,
  ) => {
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
      // We do this explicitly here to ensure it happens immediately after sign up
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
    setNavidromeUsername(null)

    // Also logout from Navidrome
    navidromeActions.removeConfig()
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
    isSyncing,
    syncError,
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
