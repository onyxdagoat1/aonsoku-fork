import { useAuth as useSupabaseAuth } from '@/contexts/AuthContext'
import { useAppData } from '@/store/app.store'

/**
 * Hook to access user authentication state
 * Uses Supabase AuthContext for proper authentication
 * Falls back to app store for Navidrome-only users (legacy support)
 */
export function useAuth() {
  const supabaseAuth = useSupabaseAuth()
  const { username: navidromeUsername, isServerConfigured } = useAppData()
  
  // If Supabase is configured and user is logged in, use Supabase auth
  if (supabaseAuth.isConfigured && supabaseAuth.user && supabaseAuth.profile) {
    return {
      user: {
        id: supabaseAuth.user.id,
        username: supabaseAuth.profile.username || supabaseAuth.user.email?.split('@')[0] || 'user',
        email: supabaseAuth.user.email || '',
        avatar: supabaseAuth.profile.avatar_url,
      },
    }
  }

  // Fallback to app store for legacy Navidrome-only users
  // This maintains backward compatibility
  if (isServerConfigured && navidromeUsername) {
    return {
      user: {
        id: navidromeUsername, // Using username as ID since subsonic uses username for auth
        username: navidromeUsername,
        email: `${navidromeUsername}@subsonic.local`, // Placeholder email
      },
    }
  }

  // Return null if not authenticated
  return {
    user: null,
  }
}
