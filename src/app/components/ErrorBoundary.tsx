import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '2rem',
          backgroundColor: 'var(--background)'
        }}>
          <div style={{
            maxWidth: '32rem',
            padding: '2rem',
            border: '1px solid var(--border)',
            borderRadius: '0.5rem',
            backgroundColor: 'var(--card)'
          }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#ef4444' }}>
              Something went wrong
            </h1>
            <p style={{ marginBottom: '1rem', color: 'var(--muted-foreground)' }}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <details style={{ marginBottom: '1.5rem' }}>
              <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>Error details</summary>
              <pre style={{ 
                padding: '1rem', 
                backgroundColor: 'var(--background)', 
                borderRadius: '0.375rem',
                overflow: 'auto',
                fontSize: '0.75rem'
              }}>
                {this.state.error?.stack}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer'
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
