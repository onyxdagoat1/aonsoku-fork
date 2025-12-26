import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { supabase } from '@/lib/supabase'
import { useAppActions } from '@/store/app.store'
import { ROUTES } from '@/routes/routesList'
import { useQueryClient } from '@tanstack/react-query'

export function AuthCallback() {
  const navigate = useNavigate()
  const { saveConfig } = useAppActions()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<string>('Completing sign in...')

  useEffect(() => {
    async function handleOAuthCallback() {
      try {
        // Get the session from Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('[OAuth] Session error:', sessionError)
          toast.error('Authentication failed')
          navigate('/login', { replace: true })
          return
        }

        if (!session) {
          console.log('[OAuth] No session found')
          navigate('/login', { replace: true })
          return
        }

        const user = session.user
        console.log('[OAuth] User authenticated:', user.email)
        setStatus('Setting up your account...')

        // Check if Navidrome credentials are already stored in user metadata
        let navidromeUsername = user.user_metadata?.navidrome_username
        let navidromePassword = user.user_metadata?.navidrome_password

        // If credentials don't exist, create Navidrome account via auth service
        if (!navidromeUsername || !navidromePassword) {
          console.log('[OAuth] Creating Navidrome account...')
          setStatus('Creating music server account...')

          const authServiceUrl = import.meta.env.VITE_ACCOUNT_API_URL || 'http://localhost:3005/api'
          
          try {
            const response = await fetch(`${authServiceUrl}/auth/oauth-callback`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: user.email,
                userId: user.id,
              }),
            })

            const data = await response.json()

            if (!response.ok || !data.success) {
              throw new Error(data.error || 'Failed to create Navidrome account')
            }

            navidromeUsername = data.username
            navidromePassword = data.password

            // Store credentials in Supabase user metadata
            if (navidromePassword) {
              console.log('[OAuth] Storing Navidrome credentials in user metadata...')
              const { error: updateError } = await supabase.auth.updateUser({
                data: {
                  navidrome_username: navidromeUsername,
                  navidrome_password: navidromePassword,
                }
              })

              if (updateError) {
                console.error('[OAuth] Failed to store credentials:', updateError)
              }
            }
          } catch (error) {
            console.error('[OAuth] Failed to create Navidrome account:', error)
            toast.error('Failed to set up music server account')
            navigate('/login', { replace: true })
            return
          }
        } else {
          console.log('[OAuth] Using existing Navidrome credentials')
        }

        // Now auto-login to Navidrome
        if (navidromeUsername && navidromePassword) {
          console.log('[OAuth] Logging into Navidrome as:', navidromeUsername)
          setStatus('Connecting to music server...')

          const navidromeUrl = import.meta.env.VITE_API_URL || 'http://localhost:4533'
          
          const loginSuccess = await saveConfig({
            url: navidromeUrl,
            username: navidromeUsername,
            password: navidromePassword,
          })

          if (loginSuccess) {
            console.log('[OAuth] Successfully logged into Navidrome')
            await queryClient.invalidateQueries()
            toast.success('Welcome! Successfully signed in')
            navigate(ROUTES.LIBRARY.HOME, { replace: true })
          } else {
            console.error('[OAuth] Failed to login to Navidrome')
            toast.error('Failed to connect to music server')
            navigate('/login', { replace: true })
          }
        } else {
          console.error('[OAuth] Missing Navidrome credentials')
          toast.error('Authentication incomplete')
          navigate('/login', { replace: true })
        }
      } catch (error) {
        console.error('[OAuth] Callback error:', error)
        toast.error('Authentication failed')
        navigate('/login', { replace: true })
      }
    }

    handleOAuthCallback()
  }, [navigate, saveConfig, queryClient])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="text-muted-foreground">{status}</p>
      </div>
    </div>
  )
}
