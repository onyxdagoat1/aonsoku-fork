import { useState } from 'react'
import { Heart, Music2, Users } from 'lucide-react'
import { SocialPlaylist, socialPlaylistsService } from '@/service/socialPlaylists'
import { Card, CardContent } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'

interface SocialPlaylistCardProps {
  playlist: SocialPlaylist
  onFollowToggle?: () => void
}

export function SocialPlaylistCard({ playlist, onFollowToggle }: SocialPlaylistCardProps) {
  const [isFollowing, setIsFollowing] = useState(false) // This should ideally be passed in or fetched
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) return
    setLoading(true)
    try {
      if (isFollowing) {
        await socialPlaylistsService.unfollowPlaylist(playlist.id)
      } else {
        await socialPlaylistsService.followPlaylist(playlist.id)
      }
      setIsFollowing(!isFollowing)
      onFollowToggle?.()
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Initial check (useEffect would be better, or parent query)
  
  return (
    <Card className="group overflow-hidden hover:border-primary/50 transition-all cursor-pointer">
      <div className="aspect-square relative bg-muted flex items-center justify-center overflow-hidden">
        {playlist.cover_art_url ? (
          <img 
            src={playlist.cover_art_url} 
            alt={playlist.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
          />
        ) : (
          <Music2 className="w-12 h-12 text-muted-foreground/50" />
        )}
        
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
           {/* Play Button could go here */}
        </div>
      </div>
      
      <CardContent className="p-3">
        <h3 className="font-semibold truncate">{playlist.name}</h3>
        <p className="text-sm text-muted-foreground truncate">{playlist.description}</p>
        
        <div className="flex items-center justify-between mt-2">
          <Badge variant="secondary" className="text-xs">
            {playlist.song_count} songs
          </Badge>
          
          {playlist.is_featured && (
            <Badge variant="default" className="text-xs bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/20">
              Featured
            </Badge>
          )}

          {/* Follow Count (if we added it to type, which I did in migration but maybe types need check) */}
           <div className="flex items-center gap-1 text-xs text-muted-foreground">
             <Heart className="w-3 h-3" />
             {(playlist as any).followed_count || 0}
           </div>
        </div>
      </CardContent>
    </Card>
  )
}
