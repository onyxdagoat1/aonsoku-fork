import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export function AuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<string>('Initializing...')

  useEffect(() => {
    const handleAuth = async () => {
      console.log("AuthCallback: Starting auth check...")
      console.log("AuthCallback: Current URL:", window.location.href)

      try {
        setStatus('Checking existing session...')
        // Check if we have a session first
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          console.log("AuthCallback: Session found via getSession")
          navigate('/', { replace: true })
          return
        }

        setStatus('Parsing URL for tokens...')
        // Robust regex to find tokens anywhere in the URL (hash, query, or multiple hashes)
        const url = window.location.href
        const accessTokenMatch = url.match(/access_token=([^&]+)/)
        const refreshTokenMatch = url.match(/refresh_token=([^&]+)/)
        const typeMatch = url.match(/type=([^&]+)/)

        if (accessTokenMatch && refreshTokenMatch) {
            console.log("AuthCallback: Tokens found in URL")
            const accessToken = accessTokenMatch[1]
            const refreshToken = refreshTokenMatch[1]
            
            setStatus('Setting session...')
            const { error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
            })
            
            if (error) {
                console.error("AuthCallback: setSession error", error)
                throw error
            }
            
            console.log("AuthCallback: Session set successfully")
            navigate('/', { replace: true })
            return
        }

        setStatus('Waiting for auth state change...')
        // Fallback: Listen for auth events (Supabase might process the hash async)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          console.log("AuthCallback: Auth state changed:", event)
          if (event === 'SIGNED_IN' && session) {
            navigate('/', { replace: true })
          }
        })

        return () => {
          subscription.unsubscribe()
        }

      } catch (err: any) {
        console.error("AuthCallback error:", err)
        setStatus(`Error: ${err.message || "Authentication failed"}`)
        // Do not redirect immediately on error, let user see it
      }
    }

    handleAuth()
  }, [navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{status}</p>
        <p className="text-xs text-muted-foreground max-w-md break-all text-center px-4">
            {window.location.href.substring(0, 100)}...
        </p>
      </div>
    </div>
  )
}
