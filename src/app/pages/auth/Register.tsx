import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { OAuthButtons } from './components/OAuthButtons'
import { Separator } from '@/app/components/ui/separator'
import { Loader2 } from 'lucide-react'

export function Register() {
  const navigate = useNavigate()
  const { signUp, isConfigured } = useAuth()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!isConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-4 rounded-lg border border-border bg-card p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground">Supabase Not Configured</h2>
          <p className="text-muted-foreground">
            Social features are not enabled. Please configure Supabase in your .env file.
          </p>
          <Button onClick={() => navigate('/')} variant="outline">
            Back to Home
          </Button>
        </div>
      </div>
    )
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (formData.username.length < 3 || formData.username.length > 30) {
      newErrors.username = 'Username must be 3-30 characters'
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, _ and -'
    }

    if (!formData.email.includes('@')) {
      newErrors.email = 'Please enter a valid email'
    }

    if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return

    setLoading(true)
    setErrors({})

    try {
      await signUp(formData.email, formData.password, formData.username)
      navigate('/auth/login', {
        state: { message: 'Account created! Please check your email to verify.' }
      })
    } catch (err: any) {
      setErrors({ general: err.message || 'Failed to create account' })
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-border bg-card p-8">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Create Account</h1>
          <p className="text-sm text-muted-foreground">
            Join the community and unlock social features
          </p>
        </div>

        {/* OAuth Buttons */}
        <OAuthButtons />

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or register with email</span>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="musiclover123"
              value={formData.username}
              onChange={(e) => updateField('username', e.target.value)}
              required
              disabled={loading}
            />
            {errors.username && (
              <p className="text-xs text-destructive">{errors.username}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              required
              disabled={loading}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => updateField('password', e.target.value)}
              required
              disabled={loading}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => updateField('confirmPassword', e.target.value)}
              required
              disabled={loading}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">{errors.confirmPassword}</p>
            )}
          </div>

          {errors.general && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {errors.general}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
          </Button>
        </form>

        {/* Sign In Link */}
        <div className="text-center text-sm">
          <span className="text-muted-foreground">Already have an account? </span>
          <Link to="/auth/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </div>

        {/* Back to App */}
        <div className="text-center">
          <Link
            to="/"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to app
          </Link>
        </div>
      </div>
    </div>
  )
}
