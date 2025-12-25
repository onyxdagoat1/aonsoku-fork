import { useState, useCallback, useEffect } from 'react';
import { Image, Upload, X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';

interface CoverArtUploadProps {
  onCoverArtSelected: (file: File | null) => void;
  currentCoverArt?: string; // base64 or URL
}

export function CoverArtUpload({ onCoverArtSelected, currentCoverArt }: CoverArtUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [hasExistingArt, setHasExistingArt] = useState(false);

  // Initialize preview with current cover art
  useEffect(() => {
    if (currentCoverArt) {
      // If it's base64 data, prepend the data URL prefix if not already there
      if (currentCoverArt.startsWith('/9j/') || currentCoverArt.startsWith('iVBOR')) {
        setPreview(`data:image/jpeg;base64,${currentCoverArt}`);
      } else if (currentCoverArt.startsWith('data:')) {
        setPreview(currentCoverArt);
      } else {
        setPreview(currentCoverArt);
      }
      setHasExistingArt(true);
    }
  }, [currentCoverArt]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreview(result);
        setHasExistingArt(false);
      };
      reader.readAsDataURL(file);
      onCoverArtSelected(file);
    }
  }, [onCoverArtSelected]);

  const handleRemove = useCallback(() => {
    setPreview(null);
    setHasExistingArt(false);
    onCoverArtSelected(null);
  }, [onCoverArtSelected]);

  return (
    <div className="space-y-2">
      <Label>Album Cover</Label>
      
      {preview ? (
        <div className="relative inline-block">
          <img 
            src={preview} 
            alt="Album cover" 
            className="w-48 h-48 object-cover rounded-lg border"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="w-4 h-4" />
          </Button>
          {hasExistingArt && (
            <p className="text-xs text-muted-foreground mt-2">
              Current cover art (upload a new one to replace)
            </p>
          )}
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-48 h-48 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Image className="w-8 h-8 text-muted-foreground mb-2" />
          <span className="text-sm text-muted-foreground">Upload Cover</span>
        </label>
      )}
    </div>
  );
}
