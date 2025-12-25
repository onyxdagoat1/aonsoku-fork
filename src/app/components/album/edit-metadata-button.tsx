import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { MetadataEditor } from '@/app/components/upload/MetadataEditor';
import { uploadService } from '@/api/uploadService';
import { toast } from 'react-toastify';
import { Edit, Loader2 } from 'lucide-react';
import type { Song } from '@/types/responses/song';

interface EditMetadataButtonProps {
  song: Song;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  onMetadataUpdated?: () => void;
}

export function EditMetadataButton({ 
  song, 
  variant = 'ghost', 
  size = 'sm',
  onMetadataUpdated 
}: EditMetadataButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [metadata, setMetadata] = useState<any>(null);

  const handleOpenEditor = async () => {
    if (!song.path) {
      toast.error('Cannot edit: File path not available');
      return;
    }

    try {
      setIsLoading(true);
      const result = await uploadService.readMetadata(song.path);
      setMetadata(result.common);
      setIsOpen(true);
    } catch (error) {
      console.error('Failed to load metadata:', error);
      toast.error(
        <div>
          <div className="font-bold mb-1">Failed to load metadata</div>
          <div className="text-sm">{error instanceof Error ? error.message : 'Unknown error'}</div>
        </div>,
        { autoClose: 5000 }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (newMetadata: any, coverArt?: File) => {
    if (!song.path) {
      toast.error('Cannot save: File path not available');
      return;
    }

    try {
      const result = await uploadService.updateMetadata(song.path, newMetadata, coverArt);
      
      if (result.warning) {
        toast.warning(
          <div>
            <div className="font-bold mb-1">{result.message || 'Metadata updated'}</div>
            <div className="text-sm">{result.warning}</div>
          </div>,
          { autoClose: 5000 }
        );
      } else {
        toast.success(result.message || 'Metadata updated successfully');
      }
      
      setIsOpen(false);
      
      // Notify parent to refresh
      if (onMetadataUpdated) {
        onMetadataUpdated();
      }
    } catch (error) {
      console.error('Failed to update metadata:', error);
      toast.error(
        <div>
          <div className="font-bold mb-1">Update failed</div>
          <div className="text-sm">{error instanceof Error ? error.message : 'Unknown error'}</div>
        </div>,
        { autoClose: 5000 }
      );
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleOpenEditor}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Edit className="w-4 h-4 mr-2" />
        )}
        Edit Tags
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Metadata</DialogTitle>
            <DialogDescription>
              {song.title || song.path}
            </DialogDescription>
          </DialogHeader>
          {metadata && (
            <MetadataEditor
              initialMetadata={metadata}
              onSave={handleSave}
              onCancel={() => setIsOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
