import { useState, useEffect } from 'react';
import { youtubeAuthenticatedService } from '@/service/youtubeAuthenticated';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { Label } from '@/app/components/ui/label';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/app/components/ui/collapsible';

interface PlaylistSelectorProps {
  videoId: string;
  onSuccess?: () => void;
}

export function PlaylistSelector({ videoId, onSuccess }: PlaylistSelectorProps) {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [showNewPlaylist, setShowNewPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    setIsLoading(true);
    const data = await youtubeAuthenticatedService.getUserPlaylists();
    setPlaylists(data);
    setIsLoading(false);
  };

  const handleAddToPlaylist = async () => {
    if (!selectedPlaylist) {
      toast.error('Please select a playlist');
      return;
    }

    setIsAdding(true);
    const success = await youtubeAuthenticatedService.addVideoToPlaylist(selectedPlaylist, videoId);
    setIsAdding(false);

    if (success) {
      toast.success('Video added to playlist!');
      onSuccess?.();
    } else {
      toast.error('Failed to add video to playlist');
    }
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPlaylistName.trim()) {
      toast.error('Please enter a playlist name');
      return;
    }

    setIsCreating(true);
    const playlistId = await youtubeAuthenticatedService.createPlaylist(
      newPlaylistName,
      newPlaylistDescription
    );

    if (playlistId) {
      // Add video to the new playlist
      const success = await youtubeAuthenticatedService.addVideoToPlaylist(playlistId, videoId);
      setIsCreating(false);

      if (success) {
        toast.success('Playlist created and video added!');
        onSuccess?.();
      } else {
        toast.error('Playlist created but failed to add video');
      }
    } else {
      setIsCreating(false);
      toast.error('Failed to create playlist');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {playlists.length > 0 && (
        <>
          <ScrollArea className="h-[200px] border rounded-md p-4">
            <RadioGroup value={selectedPlaylist} onValueChange={setSelectedPlaylist}>
              {playlists.map((playlist) => (
                <div key={playlist.id} className="flex items-center space-x-2 mb-2">
                  <RadioGroupItem value={playlist.id} id={playlist.id} />
                  <Label htmlFor={playlist.id} className="cursor-pointer flex-1">
                    <div>
                      <p className="font-medium">{playlist.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {playlist.itemCount} videos · {playlist.privacy}
                      </p>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </ScrollArea>

          <Button
            onClick={handleAddToPlaylist}
            disabled={!selectedPlaylist || isAdding}
            className="w-full"
          >
            {isAdding ? 'Adding...' : 'Add to Playlist'}
          </Button>
        </>
      )}

      <Collapsible open={showNewPlaylist} onOpenChange={setShowNewPlaylist}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Create New Playlist
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <form onSubmit={handleCreatePlaylist} className="space-y-3">
            <div>
              <Input
                placeholder="Playlist name"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                disabled={isCreating}
              />
            </div>
            <div>
              <Input
                placeholder="Description (optional)"
                value={newPlaylistDescription}
                onChange={(e) => setNewPlaylistDescription(e.target.value)}
                disabled={isCreating}
              />
            </div>
            <Button
              type="submit"
              disabled={!newPlaylistName.trim() || isCreating}
              className="w-full"
            >
              {isCreating ? 'Creating...' : 'Create & Add Video'}
            </Button>
          </form>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}