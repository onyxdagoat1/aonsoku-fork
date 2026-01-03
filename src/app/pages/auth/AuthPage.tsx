import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { FaDiscord, FaGoogle } from 'react-icons/fa'
import { RiMusic2Fill } from 'react-icons/ri'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

type AuthMode = 'signin' | 'signup'

// Placeholder album covers - these would ideally come from an API
const albumCovers = [
  '/default_album_art.webp',
  '/default_album_art.webp',
  '/default_album_art.webp',
  '/default_album_art.webp',
  '/default_album_art.webp',
]

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('signin')
  const [loginInput, setLoginInput] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentCoverIndex, setCurrentCoverIndex] = useState(0)

  const {
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithDiscord,
    isAuthenticated,
    isSyncing,
    syncError,
    signOut,
    navidromeUsername,
    loading: authLoading,
  } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Carousel effect for background album covers
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCoverIndex((prev) => (prev + 1) % albumCovers.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (isAuthenticated && !isSyncing) {
      const from = (location.state as any)?.from?.pathname || '/'
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, isSyncing, navigate, location])

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

  if (authLoading) {
    return (
      <div className="min-h-screen w-full bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-6 shadow-[0_0_15px_rgba(var(--primary),0.3)] animate-pulse">
            <RiMusic2Fill className="text-3xl text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading...</h2>
          <p className="text-muted-foreground">Please wait.</p>
        </div>
      </div>
    )
  }

  if (isSyncing) {
    return (
      <div className="min-h-screen w-full bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-6 shadow-[0_0_15px_rgba(var(--primary),0.3)] animate-pulse">
            <RiMusic2Fill className="text-3xl text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Connecting to Music Server...
          </h2>
          <p className="text-muted-foreground">
            Please wait while we sync your library.
          </p>
        </div>
      </div>
    )
  }

  if (isAuthenticated && !navidromeUsername && syncError) {
    return (
      <div className="min-h-screen w-full bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-black/40 backdrop-blur-xl border border-red-500/30 rounded-3xl p-8 shadow-2xl text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 mb-6 text-red-400 text-3xl">
            ⚠️
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Connection Failed
          </h2>
          <p className="text-muted-foreground mb-6">
            {syncError || 'Could not establish connection to the music server.'}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-xl transition-all"
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
              className="w-full text-muted-foreground hover:text-white text-sm py-2 transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background">
      {/* Animated Album Cover Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Carousel Album Covers */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCoverIndex}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${albumCovers[currentCoverIndex]})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(60px) saturate(120%) brightness(0.4)',
            }}
          />
        </AnimatePresence>

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-background/80 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.7)_100%)]" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
        {/* Logo and Title */}
        <div className="mb-8 text-center animate-in fade-in slide-in-from-top-8 duration-700">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl" />
              <img
                src="/yedits-logo.webp"
                alt="Yedits Logo"
                className="relative w-20 h-20 object-contain drop-shadow-2xl"
              />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
            Welcome to yedits.net
          </h1>
          <p className="text-base text-muted-foreground">
            {mode === 'signin'
              ? 'Sign in to continue to your music'
              : 'Create an account to start listening'}
          </p>
        </div>

        {/* Auth Card Container */}
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
            {/* Tabs */}
            <div className="flex bg-white/5 p-1 rounded-xl mb-6 relative border border-white/5">
              <div
                className="absolute h-[calc(100%-8px)] top-1 rounded-lg bg-white/10 shadow-sm transition-all duration-300 ease-out"
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
                    : 'text-muted-foreground hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => mode !== 'signup' && toggleMode()}
                className={`flex-1 relative z-10 py-2.5 text-sm font-medium transition-colors duration-200 rounded-lg ${
                  mode === 'signup'
                    ? 'text-white'
                    : 'text-muted-foreground hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="popLayout">
                {mode === 'signup' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      required={mode === 'signup'}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                      placeholder="johndoe"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {mode === 'signin' ? (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Username or Email
                  </label>
                  <input
                    type="text"
                    required
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                    placeholder="name@example.com or username"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                    placeholder="name@example.com"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  placeholder="••••••••"
                  minLength={8}
                />
                {mode === 'signin' && (
                  <div className="flex justify-end mt-2">
                    <a
                      href="#"
                      className="text-xs text-primary hover:text-primary/80 transition-colors"
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
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(var(--primary),0.3)] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:scale-[1.01] duration-200"
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

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 text-muted-foreground bg-black/40 backdrop-blur-xl rounded">
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
        </div>

        {/* Footer */}
        <div className="mt-6 text-center animate-in fade-in duration-700 delay-300">
          <p className="text-xs text-muted-foreground/60">
            By continuing, you agree to{' '}
            <a
              href="#"
              className="underline hover:text-white/80 transition-colors"
            >
              Terms
            </a>{' '}
            and{' '}
            <a
              href="#"
              className="underline hover:text-white/80 transition-colors"
            >
              Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
