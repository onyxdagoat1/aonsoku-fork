import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    // Handle the OAuth callback
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Successfully authenticated
        navigate('/', { replace: true })
      } else {
        // Failed to authenticate
        navigate('/auth/login', { replace: true })
      }
    })
  }, [navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  )
}
