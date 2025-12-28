import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useAppActions } from '@/store/app.store'
import { ROUTES } from '@/routes/routesList'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'

export function Login() {
  const navigate = useNavigate()
  const { signIn, signInWithProvider, isConfigured, user, profile } = useAuth()
  const { saveConfig } = useAppActions()
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isConfigured) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ maxWidth: '28rem', width: '100%', padding: '2rem', border: '1px solid #333', borderRadius: '0.5rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Supabase Not Configured</h2>
          <p style={{ marginBottom: '1rem', color: '#888' }}>
            Social features are not enabled. Please configure Supabase in your .env file.
          </p>
          <button onClick={() => navigate('/')} style={{ padding: '0.5rem 1rem', border: '1px solid #333', borderRadius: '0.25rem', cursor: 'pointer' }}>
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  // Auto-login to Navidrome after Supabase authentication
  useEffect(() => {
    async function setupNavidromeLogin() {
      if (!user || !profile) return

      // Check if Navidrome credentials are stored
      const navidromeUsername = user.user_metadata?.navidrome_username || profile.navidrome_username
      const navidromePassword = user.user_metadata?.navidrome_password

      if (navidromeUsername && navidromePassword) {
        console.log('[Login] Setting up Navidrome login...')
        const navidromeUrl = import.meta.env.VITE_API_URL || 'http://localhost:4533'
        
        const loginSuccess = await saveConfig({
          url: navidromeUrl,
          username: navidromeUsername,
          password: navidromePassword,
        })

        if (loginSuccess) {
          console.log('[Login] Successfully logged into Navidrome')
          await queryClient.invalidateQueries()
          toast.success('Welcome! Successfully signed in')
          navigate(ROUTES.LIBRARY.HOME, { replace: true })
        } else {
          console.error('[Login] Failed to login to Navidrome')
          // Continue anyway - user is authenticated in Supabase
        }
      } else if (navidromeUsername) {
        // User exists but password not in metadata - try to get it from auth service
        console.log('[Login] User exists, checking auth service...')
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

          if (data.success && data.password) {
            // Store password in metadata
            await supabase.auth.updateUser({
              data: {
                navidrome_username: data.username,
                navidrome_password: data.password,
              }
            })

            // Now login to Navidrome
            const navidromeUrl = import.meta.env.VITE_API_URL || 'http://localhost:4533'
            const loginSuccess = await saveConfig({
              url: navidromeUrl,
              username: data.username,
              password: data.password,
            })

            if (loginSuccess) {
              await queryClient.invalidateQueries()
              toast.success('Welcome! Successfully signed in')
              navigate(ROUTES.LIBRARY.HOME, { replace: true })
            }
          }
        } catch (error) {
          console.error('[Login] Failed to set up Navidrome:', error)
          // Continue - user is authenticated in Supabase
        }
      }
    }

    setupNavidromeLogin()
  }, [user, profile, saveConfig, queryClient, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signIn(email, password)
      // Navidrome setup will happen in useEffect
      // Don't navigate here - let useEffect handle it
    } catch (err) {
      setError('Invalid email or password')
      setLoading(false)
    }
  }

  const handleOAuth = async (provider: 'google' | 'discord' | 'github') => {
    setLoading(true)
    setError('')
    try {
      await signInWithProvider(provider)
    } catch (error) {
      console.error(`OAuth error:`, error)
      setError(`Failed to sign in with ${provider}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backgroundColor: 'var(--background)' }}>
      <div style={{ maxWidth: '28rem', width: '100%', padding: '2rem', border: '1px solid var(--border)', borderRadius: '0.5rem', backgroundColor: 'var(--card)' }}>
        {/* Header */}
        <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Welcome Back</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
            Sign in to access your music and social features
          </p>
        </div>

        {/* OAuth Buttons */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            onClick={() => handleOAuth('google')}
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.5rem 1rem',
              border: '1px solid var(--border)',
              borderRadius: '0.375rem',
              backgroundColor: 'transparent',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              opacity: loading ? 0.5 : 1
            }}
          >
            <span>🔐</span> Continue with Google
          </button>
          <button
            onClick={() => handleOAuth('discord')}
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.5rem 1rem',
              border: '1px solid var(--border)',
              borderRadius: '0.375rem',
              backgroundColor: 'transparent',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              opacity: loading ? 0.5 : 1
            }}
          >
            <span>💬</span> Continue with Discord
          </button>
          <button
            onClick={() => handleOAuth('github')}
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.5rem 1rem',
              border: '1px solid var(--border)',
              borderRadius: '0.375rem',
              backgroundColor: 'transparent',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              opacity: loading ? 0.5 : 1
            }}
          >
            <span>🐙</span> Continue with GitHub
          </button>
        </div>

        {/* Divider */}
        <div style={{ margin: '1.5rem 0', textAlign: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', backgroundColor: 'var(--border)' }} />
          <span style={{ position: 'relative', backgroundColor: 'var(--card)', padding: '0 0.5rem', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
            OR CONTINUE WITH
          </span>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid var(--border)',
                borderRadius: '0.375rem',
                backgroundColor: 'var(--background)',
                color: 'var(--foreground)'
              }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label htmlFor="password" style={{ fontSize: '0.875rem' }}>Password</label>
            </div>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid var(--border)',
                borderRadius: '0.375rem',
                backgroundColor: 'var(--background)',
                color: 'var(--foreground)'
              }}
            />
          </div>

          {error && (
            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.375rem', fontSize: '0.875rem', color: '#ef4444' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              opacity: loading ? 0.5 : 1
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Sign Up Link */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
          <span style={{ color: 'var(--muted-foreground)' }}>Don't have an account? </span>
          <Link to="/auth/register" style={{ color: 'var(--primary)', fontWeight: '500' }}>
            Sign up
          </Link>
        </div>

        {/* Back to App */}
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <Link to="/" style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
            ← Back to app
          </Link>
        </div>
      </div>
    </div>
  )
}
