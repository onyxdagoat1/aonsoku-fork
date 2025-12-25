import { useState, useEffect } from 'react';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { CoverArtUpload } from './CoverArtUpload';
import type { MusicMetadata } from '@/types/upload';
import { Save, X } from 'lucide-react';

interface MetadataEditorProps {
  initialMetadata?: MusicMetadata;
  onSave: (metadata: MusicMetadata, coverArt?: File) => void;
  onCancel?: () => void;
}

export function MetadataEditor({ initialMetadata, onSave, onCancel }: MetadataEditorProps) {
  const [metadata, setMetadata] = useState<MusicMetadata>(initialMetadata || {});
  const [coverArtFile, setCoverArtFile] = useState<File | null>(null);
  const [hasNewCoverArt, setHasNewCoverArt] = useState(false);

  useEffect(() => {
    if (initialMetadata) {
      setMetadata(initialMetadata);
    }
  }, [initialMetadata]);

  const handleChange = (field: keyof MusicMetadata, value: string | number) => {
    setMetadata((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCoverArtChange = (file: File | null) => {
    setCoverArtFile(file);
    setHasNewCoverArt(file !== null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create a clean metadata object WITHOUT the existing cover art
    // Only include cover art if user uploaded a new one
    const cleanMetadata: MusicMetadata = {
      title: metadata.title,
      artist: metadata.artist,
      album: metadata.album,
      albumArtist: metadata.albumArtist,
      year: metadata.year,
      track: metadata.track,
      genre: metadata.genre,
      comment: metadata.comment,
      // Don't include coverArt field - it will be sent as separate file if needed
    };
    
    // Only pass coverArtFile if user selected a new one
    onSave(cleanMetadata, hasNewCoverArt ? (coverArtFile || undefined) : undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <CoverArtUpload 
        onCoverArtSelected={handleCoverArtChange}
        currentCoverArt={metadata.coverArt}
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={metadata.title || ''}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Song title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="artist">Artist</Label>
          <Input
            id="artist"
            value={metadata.artist || ''}
            onChange={(e) => handleChange('artist', e.target.value)}
            placeholder="Artist name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="album">Album</Label>
          <Input
            id="album"
            value={metadata.album || ''}
            onChange={(e) => handleChange('album', e.target.value)}
            placeholder="Album name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="albumArtist">Album Artist</Label>
          <Input
            id="albumArtist"
            value={metadata.albumArtist || ''}
            onChange={(e) => handleChange('albumArtist', e.target.value)}
            placeholder="Album artist"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="year">Year</Label>
          <Input
            id="year"
            type="number"
            value={metadata.year || ''}
            onChange={(e) => handleChange('year', parseInt(e.target.value) || 0)}
            placeholder="2024"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="track">Track Number</Label>
          <Input
            id="track"
            type="number"
            value={metadata.track || ''}
            onChange={(e) => handleChange('track', parseInt(e.target.value) || 0)}
            placeholder="1"
          />
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="genre">Genre</Label>
          <Input
            id="genre"
            value={metadata.genre || ''}
            onChange={(e) => handleChange('genre', e.target.value)}
            placeholder="Rock, Pop, Jazz, etc."
          />
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="comment">Comment</Label>
          <Textarea
            id="comment"
            value={metadata.comment || ''}
            onChange={(e) => handleChange('comment', e.target.value)}
            placeholder="Additional notes"
            rows={3}
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        )}
        <Button type="submit">
          <Save className="w-4 h-4 mr-2" />
          Save Metadata
        </Button>
      </div>
    </form>
  );
}
