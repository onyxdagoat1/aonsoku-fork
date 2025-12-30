import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { FaDiscord, FaGithub, FaGoogle } from 'react-icons/fa'
import { RiMusic2Fill } from 'react-icons/ri'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

type AuthMode = 'signin' | 'signup'

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('signin')
  const [loginInput, setLoginInput] = useState('') // Replaces 'email' for login
  const [email, setEmail] = useState('') // For signup
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    signInWithEmail, // This will be updated to handle username/email
    signUpWithEmail,
    signInWithGoogle,
    signInWithDiscord,
    isAuthenticated,
    isSyncing,
    syncError,
    signOut,
    navidromeUsername,
  } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Handle redirect if fully authenticated (Supabase + Navidrome)
  useEffect(() => {
    // Redirect if authenticated. We don't wait for Navidrome sync here
    // to avoid the user getting stuck on the sync screen.
    if (isAuthenticated && !isSyncing) {
      const from = (location.state as any)?.from?.pathname || '/'
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, isSyncing, navigate, location])

  // Toggle mode based on URL or state
  useEffect(() => {
    if (location.pathname === '/register') {
      setMode('signup')
    } else {
      setMode('signin')
    }
  }, [location.pathname])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (mode === 'signup') {
        const { error: signUpError } = await signUpWithEmail(
          email,
          password,
          username,
        )
        if (signUpError) throw signUpError
      } else {
        // Pass loginInput which can be username or email
        const { error: signInError } = await signInWithEmail(
          loginInput,
          password,
        )
        if (signInError) throw signInError
      }
    } catch (err: any) {
      console.error(err)
      let msg = err.message || 'An error occurred'
      if (msg.toLowerCase().includes('database error')) {
        msg = 'Invalid credentials or account not found.'
      }
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMode = () => {
    const newMode = mode === 'signin' ? 'signup' : 'signin'
    setMode(newMode)
    setError(null)
    navigate(newMode === 'signin' ? '/login' : '/register')
  }

  // Show syncing state
  if (isSyncing) {
    return (
      <div className="min-h-screen w-full bg-black/90 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 mb-6 shadow-lg shadow-indigo-500/30 animate-pulse">
            <RiMusic2Fill className="text-3xl text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Connecting to Music Server...
          </h2>
          <p className="text-gray-400">
            Please wait while we sync your library.
          </p>
        </div>
      </div>
    )
  }

  // Show sync error state (Authenticated but failed to connect to Navidrome)
  if (isAuthenticated && !navidromeUsername && syncError) {
    return (
      <div className="min-h-screen w-full bg-black/90 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="w-full max-w-md bg-gray-900/60 backdrop-blur-xl border border-red-500/30 rounded-3xl p-8 shadow-2xl text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 mb-6 text-red-400 text-3xl">
            ⚠️
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Connection Failed
          </h2>
          <p className="text-gray-400 mb-6">
            {syncError || 'Could not establish connection to the music server.'}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
            >
              Try Reconnecting
            </button>
            <button
              onClick={() => navigate('/', { replace: true })}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-xl transition-all"
            >
              Proceed to Dashboard
            </button>
            <button
              onClick={() => signOut()}
              className="w-full text-gray-500 hover:text-gray-400 text-sm py-2 transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-black/90 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-900/20 via-black to-purple-900/20" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl opacity-50 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl opacity-50 animate-pulse delay-1000" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 mb-6 shadow-lg shadow-indigo-500/30">
            <RiMusic2Fill className="text-3xl text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
            Welcome to yedits.net
          </h1>
          <p className="text-gray-400">
            {mode === 'signin'
              ? 'Sign in to continue to your music'
              : 'Create an account to start listening'}
          </p>
        </div>

        <div className="bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          {/* Tabs */}
          <div className="flex bg-black/40 p-1 rounded-xl mb-8 relative">
            <div
              className="absolute h-[calc(100%-8px)] top-1 rounded-lg bg-gray-800 shadow-sm transition-all duration-300 ease-out"
              style={{
                left: mode === 'signin' ? '4px' : '50%',
                width: 'calc(50% - 4px)',
              }}
            />
            <button
              onClick={() => mode !== 'signin' && toggleMode()}
              className={`flex-1 relative z-10 py-2.5 text-sm font-medium transition-colors duration-200 rounded-lg ${
                mode === 'signin'
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => mode !== 'signup' && toggleMode()}
              className={`flex-1 relative z-10 py-2.5 text-sm font-medium transition-colors duration-200 rounded-lg ${
                mode === 'signup'
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="popLayout">
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    required={mode === 'signup'}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                    placeholder="johndoe"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {mode === 'signin' ? (
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                  Username or Email
                </label>
                <input
                  type="text"
                  required
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                  placeholder="name@example.com or username"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                  placeholder="name@example.com"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                placeholder="••••••••"
                minLength={8}
              />
              {mode === 'signin' && (
                <div className="flex justify-end mt-2">
                  <a
                    href="#"
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Forgot password?
                  </a>
                </div>
              )}
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2"
              >
                <span>⚠️</span>
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : mode === 'signin' ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 text-gray-500 bg-[#0f1115]">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => signInWithGoogle()}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors group"
            >
              <FaGoogle className="text-white/60 group-hover:text-white transition-colors" />
              <span className="text-sm font-medium text-white/60 group-hover:text-white transition-colors">
                Google
              </span>
            </button>
            <button
              onClick={() => signInWithDiscord()}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors group"
            >
              <FaDiscord className="text-white/60 group-hover:text-white transition-colors" />
              <span className="text-sm font-medium text-white/60 group-hover:text-white transition-colors">
                Discord
              </span>
            </button>
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm mt-8">
          By continuing, you agree to our{' '}
          <a href="#" className="underline hover:text-gray-400">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="underline hover:text-gray-400">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  )
}
