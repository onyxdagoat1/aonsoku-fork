import { Radio } from 'lucide-react'
import { Badge } from '@/app/components/ui/badge'
import { useLastFmScrobbling } from '@/hooks/useLastFmScrobbling'

export function LastFmStatus() {
  const { isConnected, canScrobble } = useLastFmScrobbling()

  if (!isConnected) return null

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant="secondary" 
        className="text-xs bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 transition-colors flex items-center gap-1"
      >
        <Radio className="w-3 h-3" />
        Last.fm
      </Badge>
      {canScrobble && (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs text-muted-foreground">Scrobbling</span>
        </div>
      )}
    </div>
  )
}
