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
  const [isDragging, setIsDragging] = useState(false);

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

  const handleFile = useCallback((file: File) => {
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

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleFile(imageFile);
    }
  }, [handleFile]);

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
        <div 
          className="relative inline-block"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className={`transition-all ${
            isDragging 
              ? 'ring-2 ring-primary ring-offset-2' 
              : ''
          }`}>
            <img 
              src={preview} 
              alt="Album cover" 
              className="w-48 h-48 object-cover rounded-lg border"
              onError={(e) => {
                console.error('Failed to load cover art image');
                setPreview(null);
                setHasExistingArt(false);
              }}
            />
          </div>
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
              Current cover art (upload or drag a new one to replace)
            </p>
          )}
          {isDragging && (
            <div className="absolute inset-0 bg-primary/20 rounded-lg flex items-center justify-center pointer-events-none">
              <div className="bg-background/90 px-4 py-2 rounded-md">
                <Upload className="w-6 h-6 mx-auto mb-1" />
                <p className="text-sm font-medium">Drop image here</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`transition-all ${
            isDragging 
              ? 'border-primary bg-primary/10 scale-105' 
              : 'border-dashed hover:border-primary'
          }`}
        >
          <label className="flex flex-col items-center justify-center w-48 h-48 border-2 rounded-lg cursor-pointer transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Image className="w-8 h-8 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground text-center px-4">
              {isDragging ? 'Drop image here' : 'Click or drag to upload'}
            </span>
          </label>
        </div>
      )}
    </div>
  );
}
