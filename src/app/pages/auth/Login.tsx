import { useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  ArrowLeft,
  Github,
  Heart,
  Lock,
  Mail,
  Music,
  Play,
  Sparkles,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Button } from '@/app/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Separator } from '@/app/components/ui/separator'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { ROUTES } from '@/routes/routesList'
import { useAppActions } from '@/store/app.store'

export function Login() {
  const navigate = useNavigate()
  const { signIn, signInWithProvider, isConfigured, user, profile } = useAuth()
  const { saveConfig } = useAppActions()
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Auto-login to Navidrome logic...
  useEffect(() => {
    async function setupNavidromeLogin() {
      if (!isConfigured || !user || !profile) return

      const navidromeUsername =
        profile?.navidrome_username || user.user_metadata?.navidrome_username
      const navidromePassword =
        profile?.navidrome_password || user.user_metadata?.navidrome_password

      if (navidromeUsername && navidromePassword) {
        console.log('[Login] Setting up Navidrome login...')
        const navidromeUrl =
          import.meta.env.VITE_API_URL || 'http://localhost:4533'

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
        }
      } else if (navidromeUsername) {
        console.log('[Login] User exists, checking auth service...')
        const authServiceUrl =
          import.meta.env.VITE_ACCOUNT_API_URL || 'http://localhost:3005/api'

        try {
          const response = await fetch(
            `${authServiceUrl}/auth/oauth-callback`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: user.email, userId: user.id }),
            },
          )

          const data = await response.json()

          if (data.success && data.password) {
            await supabase.auth.updateUser({
              data: {
                navidrome_username: data.username,
                navidrome_password: data.password,
              },
            })

            const navidromeUrl =
              import.meta.env.VITE_API_URL || 'http://localhost:4533'
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
        }
      }
    }

    setupNavidromeLogin()
  }, [isConfigured, user, profile, saveConfig, queryClient, navigate])

  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md border-border/50 bg-black/40 backdrop-blur-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Supabase Not Configured</CardTitle>
            <CardDescription>
              Social features are not enabled. Please configure Supabase in your
              .env file.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => navigate('/')} variant="outline">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signIn(email, password)
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
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-black">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Orbs */}
        <div
          className="absolute w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse"
          style={{
            top: '10%',
            left: '20%',
            animationDuration: '4s',
          }}
        />
        <div
          className="absolute w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse"
          style={{
            bottom: '10%',
            right: '20%',
            animationDuration: '6s',
            animationDelay: '1s',
          }}
        />
        <div
          className="absolute w-64 h-64 bg-pink-500/20 rounded-full blur-3xl animate-pulse"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            animationDuration: '5s',
            animationDelay: '2s',
          }}
        />

        {/* Floating Icons */}
        <div className="absolute inset-0 pointer-events-none">
          <Music
            className="absolute w-8 h-8 text-purple-400/20 animate-float"
            style={{ top: '15%', left: '15%', animationDelay: '0s' }}
          />
          <Play
            className="absolute w-10 h-10 text-blue-400/20 animate-float"
            style={{ top: '25%', right: '25%', animationDelay: '1s' }}
          />
          <Heart
            className="absolute w-6 h-6 text-pink-400/20 animate-float"
            style={{ bottom: '30%', left: '30%', animationDelay: '2s' }}
          />
          <Sparkles
            className="absolute w-7 h-7 text-purple-400/20 animate-float"
            style={{ bottom: '20%', right: '20%', animationDelay: '1.5s' }}
          />
          <Music
            className="absolute w-9 h-9 text-blue-400/20 animate-float"
            style={{ top: '60%', right: '15%', animationDelay: '0.5s' }}
          />
          <Heart
            className="absolute w-8 h-8 text-pink-400/20 animate-float"
            style={{ top: '40%', left: '10%', animationDelay: '2.5s' }}
          />
        </div>

        {/* Mesh Gradient Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)]" />

        {/* Mouse Follow Glow */}
        <div
          className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl transition-all duration-300 pointer-events-none"
          style={{
            left: mousePosition.x - 192,
            top: mousePosition.y - 192,
          }}
        />

        {/* Animated Grid Background */}
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(rgba(168, 85, 247, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(168, 85, 247, 0.1) 1px, transparent 1px)',
              backgroundSize: '50px 50px',
            }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
        {/* Logo and Title */}
        <div className="mb-8 text-center animate-in fade-in slide-in-from-top-8 duration-1000">
          <div className="flex justify-center mb-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
              <img
                src="/yedits-logo.webp"
                alt="Yedits Logo"
                className="relative w-24 h-24 object-contain drop-shadow-2xl"
              />
            </div>
          </div>
          <h1 className="text-5xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 drop-shadow-lg">
            Yedits.net
          </h1>
          <p className="text-lg text-purple-200/80 font-light flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            Your Ultimate Music Streaming Experience
            <Sparkles className="w-4 h-4" />
          </p>
        </div>

        {/* Login Card Container */}
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          <div className="relative">
            {/* Glassmorphic Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl" />

            {/* Card Content */}
            <Card className="relative border-0 bg-transparent shadow-none">
              <CardHeader className="space-y-1 text-center pb-6 pt-8">
                <CardTitle className="text-2xl font-bold tracking-tight text-white">
                  Welcome Back
                </CardTitle>
                <CardDescription className="text-purple-200/60">
                  Sign in to access your library and community features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-8">
                <div className="grid gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleOAuth('google')}
                    disabled={loading}
                    className="bg-white/10 border-white/20 hover:bg-white/20 text-white hover:text-white transition-all duration-300"
                  >
                    <span className="mr-2">🔐</span> Continue with Google
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleOAuth('discord')}
                      disabled={loading}
                      className="bg-white/10 border-white/20 hover:bg-[#5865F2]/30 text-white hover:text-white transition-all duration-300"
                    >
                      <span className="mr-2">💬</span> Discord
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleOAuth('github')}
                      disabled={loading}
                      className="bg-white/10 border-white/20 hover:bg-white/20 text-white hover:text-white transition-all duration-300"
                    >
                      <Github className="mr-2 h-4 w-4" /> GitHub
                    </Button>
                  </div>
                </div>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="bg-white/20" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-black/40 px-2 text-purple-300/80 backdrop-blur-sm rounded">
                      Or continue with email
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white/90">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-purple-300/50" />
                      <Input
                        id="email"
                        placeholder="name@example.com"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-purple-500/50"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white/90">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-purple-300/50" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-purple-500/50"
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 text-sm text-red-200 bg-red-500/20 border border-red-500/30 rounded-md">
                      <AlertCircle className="h-4 w-4" />
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all duration-300 transform hover:scale-[1.02]"
                    disabled={loading}
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="flex flex-col gap-4 text-center pb-8 px-8">
                <div className="text-sm text-purple-200/70">
                  Don't have an account?{' '}
                  <Link
                    to={ROUTES.REGISTER}
                    className="text-purple-300 hover:text-purple-200 hover:underline font-medium transition-colors"
                  >
                    Sign up
                  </Link>
                </div>

                <Link
                  to="/"
                  className="inline-flex items-center text-xs text-purple-300/60 hover:text-purple-200 transition-colors gap-1 group"
                >
                  <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />{' '}
                  Back to app
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center animate-in fade-in duration-1000 delay-500">
          <p className="text-xs text-purple-400/40">
            Powered by{' '}
            <span className="font-semibold text-purple-300/60">Chuds</span>
          </p>
        </div>
      </div>
    </div>
  )
}
