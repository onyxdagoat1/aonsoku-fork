import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { CoverArtUpload } from '@/app/components/upload/CoverArtUpload';
import { uploadService } from '@/api/uploadService';
import { toast } from 'react-toastify';
import { Edit, Loader2, Save, X, AlertTriangle } from 'lucide-react';
import type { Song } from '@/types/responses/song';
import type { Album } from '@/types/responses/album';

interface EditAlbumButtonProps {
  album: Album;
  onMetadataUpdated?: () => void;
}

export function EditAlbumButton({ album, onMetadataUpdated }: EditAlbumButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [albumArtist, setAlbumArtist] = useState(album.albumArtist || album.artist);
  const [albumName, setAlbumName] = useState(album.name);
  const [year, setYear] = useState(album.year || '');
  const [genre, setGenre] = useState(album.genre || '');
  const [coverArtFile, setCoverArtFile] = useState<File | null>(null);
  const [updateProgress, setUpdateProgress] = useState({ current: 0, total: 0 });

  const handleOpen = () => {
    // Reset form with current album data
    setAlbumArtist(album.albumArtist || album.artist);
    setAlbumName(album.name);
    setYear(album.year || '');
    setGenre(album.genre || '');
    setCoverArtFile(null);
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!album.song || album.song.length === 0) {
      toast.error('No songs found in this album');
      return;
    }

    try {
      setIsUpdating(true);
      setUpdateProgress({ current: 0, total: album.song.length });

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Update each song with the album-level metadata
      for (let i = 0; i < album.song.length; i++) {
        const song = album.song[i];
        setUpdateProgress({ current: i + 1, total: album.song.length });

        if (!song.path) {
          errorCount++;
          errors.push(`${song.title || 'Unknown'}: No file path`);
          continue;
        }

        try {
          // Read current metadata to preserve song-specific fields
          const current = await uploadService.readMetadata(song.path);
          
          // Merge album-level changes with song-specific data
          const updatedMetadata = {
            ...current.common,
            album: albumName,
            albumArtist: albumArtist,
            artist: current.common.artist || albumArtist, // Preserve individual artist if exists
            year: year ? parseInt(year.toString()) : current.common.year,
            genre: genre || current.common.genre,
          };

          await uploadService.updateMetadata(
            song.path,
            updatedMetadata,
            coverArtFile || undefined
          );
          
          successCount++;
        } catch (error) {
          errorCount++;
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`${song.title || song.path}: ${errorMsg}`);
          console.error(`Failed to update ${song.path}:`, error);
        }
      }

      // Show results
      if (successCount === album.song.length) {
        toast.success(
          <div>
            <div className="font-bold mb-1">Album updated successfully!</div>
            <div className="text-sm">Updated {successCount} song{successCount !== 1 ? 's' : ''}</div>
          </div>
        );
      } else if (successCount > 0) {
        toast.warning(
          <div>
            <div className="font-bold mb-1">Partial update completed</div>
            <div className="text-sm">
              Updated {successCount} of {album.song.length} songs
            </div>
            {errors.length > 0 && errors.length <= 3 && (
              <div className="text-xs mt-2 space-y-1">
                {errors.map((err, idx) => (
                  <div key={idx}>{err}</div>
                ))}
              </div>
            )}
          </div>,
          { autoClose: 7000 }
        );
      } else {
        toast.error(
          <div>
            <div className="font-bold mb-1">Update failed</div>
            <div className="text-sm">No songs were updated</div>
          </div>
        );
      }

      setIsOpen(false);
      
      // Notify parent to refresh
      if (onMetadataUpdated && successCount > 0) {
        // Give Navidrome time to scan changes
        setTimeout(() => {
          onMetadataUpdated();
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to update album:', error);
      toast.error(
        <div>
          <div className="font-bold mb-1">Update failed</div>
          <div className="text-sm">{error instanceof Error ? error.message : 'Unknown error'}</div>
        </div>
      );
    } finally {
      setIsUpdating(false);
      setUpdateProgress({ current: 0, total: 0 });
    }
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={handleOpen}
        disabled={isUpdating}
      >
        <Edit className="w-4 h-4 mr-2" />
        Edit Album Tags
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Album Metadata</DialogTitle>
            <DialogDescription>
              Update metadata for all {album.song?.length || 0} songs in this album
            </DialogDescription>
          </DialogHeader>

          {isUpdating ? (
            <div className="py-8">
              <div className="flex items-center justify-center mb-4">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Updating song {updateProgress.current} of {updateProgress.total}...
              </p>
              <div className="mt-4 w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(updateProgress.current / updateProgress.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-amber-500/10 border-amber-500/30 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1">This will update all songs in the album</p>
                  <p className="text-muted-foreground">
                    Individual song titles and track numbers will be preserved. 
                    Only album-level information will be changed.
                  </p>
                </div>
              </div>

              <CoverArtUpload
                onCoverArtSelected={setCoverArtFile}
                currentCoverArt={album.coverArt ? `https://your-server.com/rest/getCoverArt?id=${album.coverArt}` : undefined}
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="album-name">Album Name</Label>
                  <Input
                    id="album-name"
                    value={albumName}
                    onChange={(e) => setAlbumName(e.target.value)}
                    placeholder="Album name"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="album-artist">Album Artist</Label>
                  <Input
                    id="album-artist"
                    value={albumArtist}
                    onChange={(e) => setAlbumArtist(e.target.value)}
                    placeholder="Album artist"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="2024"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="genre">Genre</Label>
                  <Input
                    id="genre"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    placeholder="Rock, Pop, Jazz, etc."
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Update Album
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
