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
      // Check if it's already a complete data URL
      if (currentCoverArt.startsWith('data:')) {
        setPreview(currentCoverArt);
        setHasExistingArt(true);
      }
      // Check if it's base64 data without prefix - try to detect image type
      else if (!currentCoverArt.startsWith('http')) {
        // Common base64 image prefixes
        // JPEG: /9j/
        // PNG: iVBOR
        // WebP: UklGR
        // GIF: R0lGO
        let mimeType = 'image/jpeg'; // default
        
        if (currentCoverArt.startsWith('iVBOR')) {
          mimeType = 'image/png';
        } else if (currentCoverArt.startsWith('UklGR')) {
          mimeType = 'image/webp';
        } else if (currentCoverArt.startsWith('R0lGO')) {
          mimeType = 'image/gif';
        }
        
        setPreview(`data:${mimeType};base64,${currentCoverArt}`);
        setHasExistingArt(true);
      }
      // It's a URL
      else {
        setPreview(currentCoverArt);
        setHasExistingArt(true);
      }
    } else {
      // No cover art provided, clear preview
      setPreview(null);
      setHasExistingArt(false);
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
    // Reset file input
    const fileInput = document.querySelector('input[type="file"][accept="image/*"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
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
            onError={(e) => {
              // If image fails to load, hide it and show upload button
              console.error('Failed to load cover art image');
              setPreview(null);
              setHasExistingArt(false);
            }}
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
