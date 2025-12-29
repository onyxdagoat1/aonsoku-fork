import { useAuth } from '@/contexts/AuthContext'
import { useAppData } from '@/store/app.store'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function AuthStatusIndicator() {
  const { isAuthenticated, profile, navidromeUsername, loading } = useAuth()
  const { isServerConfigured, username: navidromeUser } = useAppData()

  if (loading) return null

  // Both systems authenticated
  if (isAuthenticated && profile && navidromeUser) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 text-xs text-green-500">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Fully Authenticated</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              <span className="font-semibold">Navidrome:</span> {navidromeUser}<br />
              <span className="font-semibold">Profile:</span> {profile.username}<br />
              <span className="text-green-500">✓ All features available</span>
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Only Navidrome authenticated (auto-linking in progress or fallback mode)
  if (isServerConfigured && navidromeUser && !profile) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 text-xs text-yellow-500">
              <AlertCircle className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Setting up profile...</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              <span className="font-semibold">Navidrome:</span> {navidromeUser}<br />
              <span className="text-yellow-500">⚠ Creating social profile...</span><br />
              <span className="text-muted-foreground">Refresh if this persists</span>
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Navidrome only (profile created as fallback)
  if (navidromeUsername && !isServerConfigured) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 text-xs text-blue-500">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Authenticated</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              <span className="font-semibold">User:</span> {navidromeUsername}<br />
              <span className="text-blue-500">✓ Social features available</span>
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Not authenticated
  return null
}
