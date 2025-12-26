import { useState, useEffect } from 'react';
import { useYouTubeOAuthStore } from '@/store/useYouTubeOAuthStore';
import { youtubeOAuthService } from '@/service/youtube-oauth.service';
import type { YouTubePlaylist, YouTubePlaylistsResponse } from '@/types/youtube-oauth';
import { Button } from '@/app/components/ui/button';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Loader2, Music, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog';
import { toast } from 'react-toastify';

interface YouTubeUserPlaylistsProps {
  onImportPlaylist?: (playlist: YouTubePlaylist) => void;
}

export function YouTubeUserPlaylists({ onImportPlaylist }: YouTubeUserPlaylistsProps) {
  const { isAuthenticated } = useYouTubeOAuthStore();
  const [playlists, setPlaylists] = useState<YouTubePlaylist[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open && isAuthenticated) {
      loadPlaylists();
    }
  }, [open, isAuthenticated]);

  const loadPlaylists = async () => {
    setLoading(true);
    try {
      const response: YouTubePlaylistsResponse = await youtubeOAuthService.getUserPlaylists();
      setPlaylists(response.items);
    } catch (error) {
      console.error('Failed to load playlists:', error);
      toast.error('Failed to load your playlists');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = (playlist: YouTubePlaylist) => {
    if (onImportPlaylist) {
      onImportPlaylist(playlist);
      toast.success(`Importing playlist: ${playlist.snippet.title}`);
      setOpen(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Music className="h-4 w-4" />
          Import My Playlists
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Your YouTube Playlists</DialogTitle>
          <DialogDescription>
            Select a playlist to import into yedits.net
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {playlists.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No playlists found
                </p>
              ) : (
                playlists.map((playlist) => (
                  <div
                    key={playlist.id}
                    className="flex items-center gap-4 p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <img
                      src={playlist.snippet.thumbnails.medium.url}
                      alt={playlist.snippet.title}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">
                        {playlist.snippet.title}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {playlist.contentDetails.itemCount} videos
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleImport(playlist)}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Import
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
