import { useAuth } from '@/contexts/AuthContext'
import { Link } from 'react-router-dom'

export function UserMenu() {
  const { user, profile, signOut, isConfigured } = useAuth()

  // Don't show anything if Supabase is not configured
  if (!isConfigured) {
    return null
  }

  // Show login button if not authenticated
  if (!user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Link to="/auth/login">
          <button style={{
            padding: '0.375rem 0.75rem',
            backgroundColor: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}>
            Sign In
          </button>
        </Link>
        <Link to="/auth/register">
          <button style={{
            padding: '0.375rem 0.75rem',
            backgroundColor: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}>
            Sign Up
          </button>
        </Link>
      </div>
    )
  }

  // Show user info if authenticated
  const displayName = profile?.display_name || profile?.username || user.email?.split('@')[0] || 'User'
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.375rem 0.75rem',
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '0.375rem',
          cursor: 'pointer',
          fontSize: '0.875rem'
        }}
        title={`Logged in as ${displayName}`}
      >
        <div style={{
          width: '1.5rem',
          height: '1.5rem',
          borderRadius: '50%',
          backgroundColor: 'var(--primary)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.75rem',
          fontWeight: 'bold'
        }}>
          {initials}
        </div>
        <span>{displayName}</span>
      </button>
      <div style={{
        position: 'absolute',
        right: 0,
        top: '100%',
        marginTop: '0.25rem',
        display: 'none'
      }} className="user-menu-dropdown">
        <div style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '0.375rem',
          padding: '0.5rem',
          minWidth: '10rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border)', marginBottom: '0.5rem' }}>
            <div style={{ fontWeight: '500', fontSize: '0.875rem' }}>{displayName}</div>
            {user.email && (
              <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                {user.email}
              </div>
            )}
          </div>
          <button
            onClick={() => signOut()}
            style={{
              width: '100%',
              padding: '0.5rem',
              textAlign: 'left',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: '#ef4444'
            }}
          >
            🚪 Logout
          </button>
        </div>
      </div>
    </div>
  )
}
