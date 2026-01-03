import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { Radio, Link2, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { lastfmService } from '@/service/lastfmService'

export function LastFmIntegration() {
  const { profile } = useAuth()
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [lastfmProfile, setLastfmProfile] = useState<any>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)

  const isEnabled = profile?.lastfm_enabled
  const hasSessionKey = !!profile?.lastfm_session_key

  useEffect(() => {
    if (isEnabled && hasSessionKey) {
      loadLastfmProfile()
    }
  }, [isEnabled, hasSessionKey])

  const loadLastfmProfile = async () => {
    setIsLoadingProfile(true)
    try {
      const userInfo = await lastfmService.getUserInfo()
      if (userInfo) {
        setLastfmProfile({
          name: userInfo.name,
          playcount: parseInt(userInfo.playcount) || 0,
          registered: userInfo.registered?.unixtime ? 
            new Date(parseInt(userInfo.registered.unixtime) * 1000).toISOString() : 
            new Date().toISOString(),
          url: userInfo.url,
          image: userInfo.image?.[2]?.['#text'] || null, // Get medium sized image
          country: userInfo.country,
          age: userInfo.age,
        })
      }
    } catch (error) {
      console.error('Error loading Last.fm profile:', error)
      // Don't set mock data on error, just leave it empty
      setLastfmProfile(null)
    } finally {
      setIsLoadingProfile(false)
    }
  }

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      // Redirect to Last.fm for authentication
      await lastfmService.getAuthToken()
    } catch (error) {
      console.error('Error connecting to Last.fm:', error)
      toast.error('Failed to connect to Last.fm')
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect your Last.fm account?')) {
      return
    }

    setIsDisconnecting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('profiles')
        .update({
          lastfm_enabled: false,
          lastfm_session_key: null,
        })
        .eq('id', user.id)

      if (error) throw error

      toast.success('Last.fm disconnected successfully')
      setLastfmProfile(null)
      
      // Reload profile to update UI
      window.location.reload()
    } catch (error) {
      console.error('Error disconnecting Last.fm:', error)
      toast.error('Failed to disconnect Last.fm')
    } finally {
      setIsDisconnecting(false)
    }
  }

  const handleCallback = async () => {
    // This would be called when user returns from Last.fm authentication
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get('token')
    
    if (token) {
      try {
        const session = await lastfmService.getSession(token)
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) throw new Error('User not authenticated')

        const { error } = await supabase
          .from('profiles')
          .update({
            lastfm_enabled: true,
            lastfm_session_key: session.key,
          })
          .eq('id', user.id)

        if (error) throw error

        toast.success('Last.fm connected successfully!')
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname)
        
        // Reload profile to update UI
        window.location.reload()
      } catch (error) {
        console.error('Error completing Last.fm connection:', error)
        toast.error('Failed to complete Last.fm connection')
      }
    }
  }

  // Check for callback on mount
  useEffect(() => {
    handleCallback()
  }, [])

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Radio className="text-primary w-4 h-4" />
          Last.fm
        </h2>
        <div className={`w-2.5 h-2.5 rounded-full ${isEnabled ? 'bg-emerald-500' : 'bg-muted'}`} />
      </div>

      <div className="space-y-4">
        {/* Profile Info when connected */}
        {isEnabled && lastfmProfile ? (
          isLoadingProfile ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {lastfmProfile.image ? (
                  <img
                    src={lastfmProfile.image}
                    alt={lastfmProfile.name}
                    className="w-12 h-12 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center border border-border">
                    <Radio className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-foreground truncate">{lastfmProfile.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {lastfmProfile.playcount.toLocaleString()} scrobbles
                  </div>
                </div>
                {lastfmProfile.url && (
                  <a
                    href={lastfmProfile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    View
                  </a>
                )}
              </div>

              <Button
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                {isDisconnecting ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                ) : (
                  <XCircle className="w-3 h-3 mr-1" />
                )}
                Disconnect
              </Button>
            </div>
          )
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Connect your Last.fm account to automatically scrobble your music listening history.
            </p>
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              size="sm"
              className="text-xs"
            >
              {isConnecting ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : (
                <Link2 className="w-3 h-3 mr-1" />
              )}
              Connect
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
