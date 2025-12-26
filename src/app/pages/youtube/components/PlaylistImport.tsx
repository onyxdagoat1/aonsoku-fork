import { useState, useEffect } from 'react';
import { useYouTubeAuthStore } from '@/store/youtubeAuth.store';
import { youtubeAuthenticatedService } from '@/service/youtubeAuthenticated';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Download, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog';

interface PlaylistImportProps {
  onImportComplete?: (playlistIds: string[]) => void;
}

export function PlaylistImport({ onImportComplete }: PlaylistImportProps) {
  const { isAuthenticated } = useYouTubeAuthStore();
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [selectedPlaylists, setSelectedPlaylists] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadPlaylists();
    }
  }, [isOpen, isAuthenticated]);

  const loadPlaylists = async () => {
    setIsLoading(true);
    const data = await youtubeAuthenticatedService.getUserPlaylists();
    setPlaylists(data);
    setIsLoading(false);
  };

  const togglePlaylist = (playlistId: string) => {
    const newSelected = new Set(selectedPlaylists);
    if (newSelected.has(playlistId)) {
      newSelected.delete(playlistId);
    } else {
      newSelected.add(playlistId);
    }
    setSelectedPlaylists(newSelected);
  };

  const handleImport = () => {
    if (selectedPlaylists.size === 0) {
      toast.info('No playlists selected');
      return;
    }

    const playlistIds = Array.from(selectedPlaylists);
    toast.success(`Importing ${playlistIds.length} playlist${playlistIds.length > 1 ? 's' : ''}...`);
    onImportComplete?.(playlistIds);
    setIsOpen(false);
    setSelectedPlaylists(new Set());
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Import Playlists
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import YouTube Playlists</DialogTitle>
          <DialogDescription>
            Select playlists from your YouTube account to import into yedits.net
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : playlists.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No playlists found in your YouTube account</p>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[400px] border rounded-md p-4">
              <div className="space-y-3">
                {playlists.map((playlist) => (
                  <Card
                    key={playlist.id}
                    className={`cursor-pointer transition-colors ${
                      selectedPlaylists.has(playlist.id) ? 'border-primary bg-accent' : ''
                    }`}
                    onClick={() => togglePlaylist(playlist.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedPlaylists.has(playlist.id)}
                          onCheckedChange={() => togglePlaylist(playlist.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <img
                          src={playlist.thumbnailUrl}
                          alt={playlist.title}
                          className="w-24 h-16 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{playlist.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {playlist.description || 'No description'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {playlist.itemCount} videos · {playlist.privacy}
                          </p>
                        </div>
                        {selectedPlaylists.has(playlist.id) && (
                          <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {selectedPlaylists.size} playlist{selectedPlaylists.size !== 1 ? 's' : ''} selected
              </p>
              <Button
                onClick={handleImport}
                disabled={selectedPlaylists.size === 0}
              >
                Import Selected
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}