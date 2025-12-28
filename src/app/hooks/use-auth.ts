import { useAppData } from '@/store/app.store'

/**
 * Hook to access user authentication state
 * Uses the app store to get the logged-in user's information
 */
export function useAuth() {
  const { username, isServerConfigured } = useAppData()

  // Return user object if server is configured and user is logged in
  if (isServerConfigured && username) {
    return {
      user: {
        id: username, // Using username as ID since subsonic uses username for auth
        username: username,
        email: `${username}@subsonic.local`, // Placeholder email
      },
    }
  }

  // Return null if not authenticated
  return {
    user: null,
  }
}
