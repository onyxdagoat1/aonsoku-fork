import { useAuth } from '@/contexts/AuthContext'
import { Info, Loader2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface AuthRequiredProps {
  feature?: string
  children?: React.ReactNode
  fallback?: React.ReactNode
}

export function AuthRequired({ feature = 'this feature', children, fallback }: AuthRequiredProps) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Authentication in Progress</AlertTitle>
        <AlertDescription>
          Setting up your profile for {feature}. Please refresh the page if you're still seeing this message.
        </AlertDescription>
      </Alert>
    )
  }

  return <>{children}</>
}

// Hook version for conditional rendering
export function useAuthRequired() {
  const { isAuthenticated, loading } = useAuth()
  
  return {
    isAuthenticated,
    loading,
    canAccess: isAuthenticated && !loading,
  }
}
