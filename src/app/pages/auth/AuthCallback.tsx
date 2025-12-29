import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Check if we have a session first
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          console.log("Session found, redirecting...")
          navigate('/', { replace: true })
          return
        }

        // If no session, check URL for tokens (Supabase + HashRouter workaround)
        // The URL might look like: http://localhost:3000/#/auth/callback#access_token=...
        // or http://localhost:3000/auth/callback#access_token=...
        const hash = window.location.hash
        const params = new URLSearchParams(hash.replace(/^#\/?/, '')) // Remove leading # or #/
        
        // Also check if the params are "hidden" after the route hash
        // e.g. #/auth/callback#access_token=...
        const parts = hash.split('#')
        let accessToken = params.get('access_token')
        let refreshToken = params.get('refresh_token')

        if (!accessToken && parts.length > 2) {
            // Handle double hash case
            const tokenPart = parts.find(p => p.includes('access_token'))
            if (tokenPart) {
                const tokenParams = new URLSearchParams(tokenPart)
                accessToken = tokenParams.get('access_token')
                refreshToken = tokenParams.get('refresh_token')
            }
        }

        if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
            })
            if (error) throw error
            navigate('/', { replace: true })
            return
        }

        // Setup listener for delayed auth events
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            navigate('/', { replace: true })
          }
        })

        return () => {
          subscription.unsubscribe()
        }

      } catch (err: any) {
        console.error("Auth callback error:", err)
        setError(err.message || "Authentication failed")
        setTimeout(() => navigate('/auth/login'), 3000)
      }
    }

    handleAuth()
  }, [navigate])

  if (error) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="flex flex-col items-center space-y-4 text-red-500">
                <p>Error: {error}</p>
                <p className="text-sm text-muted-foreground">Redirecting to login...</p>
            </div>
        </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  )
}
