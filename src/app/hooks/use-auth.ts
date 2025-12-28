import { useAuth as useSupabaseAuth } from '@/contexts/AuthContext'

/**
 * Hook to access user authentication state
 * Uses Supabase AuthContext for authentication
 */
export function useAuth() {
  const { user, profile, session, loading } = useSupabaseAuth()

  // Return user object if authenticated
  if (user && profile) {
    return {
      user: {
        id: user.id,
        username: profile.username,
        email: user.email || '',
        displayName: profile.display_name || profile.username,
        avatar: profile.avatar_url,
        profile: profile,
      },
      profile,
      session,
      loading,
    }
  }

  // Return null if not authenticated
  return {
    user: null,
    profile: null,
    session: null,
    loading,
  }
}
