import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

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
      navigate('/auth/login')
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backgroundColor: 'var(--background)' }}>
      <div style={{ maxWidth: '28rem', width: '100%', padding: '2rem', border: '1px solid var(--border)', borderRadius: '0.5rem', backgroundColor: 'var(--card)' }}>
        {/* Header */}
        <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Create Account</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
            Join the community and unlock social features
          </p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label htmlFor="username" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Username</label>
            <input
              id="username"
              placeholder="musiclover123"
              value={formData.username}
              onChange={(e) => updateField('username', e.target.value)}
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
            {errors.username && (
              <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#ef4444' }}>{errors.username}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
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
            {errors.email && (
              <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#ef4444' }}>{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => updateField('password', e.target.value)}
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
            {errors.password && (
              <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#ef4444' }}>{errors.password}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => updateField('confirmPassword', e.target.value)}
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
            {errors.confirmPassword && (
              <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#ef4444' }}>{errors.confirmPassword}</p>
            )}
          </div>

          {errors.general && (
            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.375rem', fontSize: '0.875rem', color: '#ef4444' }}>
              {errors.general}
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
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Sign In Link */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
          <span style={{ color: 'var(--muted-foreground)' }}>Already have an account? </span>
          <Link to="/auth/login" style={{ color: 'var(--primary)', fontWeight: '500' }}>
            Sign in
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
