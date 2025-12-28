import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Password } from '@/app/components/ui/password'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card'
import { LangToggle } from '@/app/components/login/lang-toggle'
import { OAuthButtons } from '@/app/components/login/oauth-buttons'
import { ROUTES } from '@/routes/routesList'
import { toast } from 'react-toastify'

export function SupabaseLoginForm() {
  const navigate = useNavigate()
  const { signInWithEmail, signInWithProvider, isConfigured } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isConfigured) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error } = await signInWithEmail(email, password)
      if (error) {
        setError('Invalid email or password')
      }
      // Navigation will happen automatically via useEffect in LoginForm
    } catch (err) {
      setError('Invalid email or password')
    } finally {
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
      setLoading(false)
    }
  }

  return (
    <Card className="w-[450px] bg-background-foreground">
      <CardHeader>
        <CardTitle className="flex flex-row justify-between items-center">
          Login
          <LangToggle />
        </CardTitle>
        <CardDescription>Sign in to access your music</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <OAuthButtons />
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block mb-2 text-sm">Email</label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="password" className="block mb-2 text-sm">Password</label>
              <Password
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </div>
      </CardContent>
      <CardFooter>
        <div className="text-center text-sm text-muted-foreground w-full">
          Don't have an account?{' '}
          <Link to={ROUTES.REGISTER} className="text-primary hover:underline">
            Create one
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}

