import { useState, useEffect } from 'react';
import { uploadService, type UploadHistoryItem } from '@/api/uploadService';
import { MetadataEditor } from './MetadataEditor';
import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { toast } from 'react-toastify';
import { Edit, Music, RefreshCw } from 'lucide-react';
import { formatBytes } from '@/utils/formatBytes';

// Simple time formatter
function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const past = new Date(dateString);
  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return past.toLocaleDateString();
}

export function UploadHistory() {
  const [history, setHistory] = useState<UploadHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<UploadHistoryItem | null>(null);
  const [editingMetadata, setEditingMetadata] = useState<any>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await uploadService.getHistory(100);
      setHistory(data);
    } catch (error) {
      console.error('Failed to load history:', error);
      toast.error('Failed to load upload history');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = async (item: UploadHistoryItem) => {
    try {
      setIsLoadingMetadata(true);
      setEditingItem(item);
      
      // Load current metadata from file
      const metadata = await uploadService.readMetadata(item.path);
      setEditingMetadata(metadata.common);
      setIsEditorOpen(true);
    } catch (error) {
      console.error('Failed to load metadata:', error);
      toast.error('Failed to load file metadata');
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  const handleSaveMetadata = async (metadata: any, coverArt?: File) => {
    if (!editingItem) return;

    try {
      await uploadService.updateMetadata(editingItem.path, metadata, coverArt);
      toast.success('Metadata updated successfully');
      setIsEditorOpen(false);
      setEditingItem(null);
      setEditingMetadata(null);
      
      // Reload history to show updated info
      await loadHistory();
    } catch (error) {
      console.error('Failed to update metadata:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update metadata');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg bg-card">
        <Music className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">No Upload History</h3>
        <p className="text-muted-foreground">
          Files you upload will appear here. You can edit their tags anytime.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Uploads</h2>
          <Button variant="outline" size="sm" onClick={loadHistory}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="space-y-2">
          {history.map((item) => (
            <div
              key={item.id}
              className="p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors flex items-center justify-between"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <p className="font-medium truncate">
                    {item.title || item.originalName}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground truncate mt-1">
                  {item.artist && (
                    <span>{item.artist}</span>
                  )}
                  {item.artist && item.album && ' • '}
                  {item.album && (
                    <span>{item.album}</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatBytes(item.size)} • Uploaded {formatTimeAgo(item.uploadedAt)}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditClick(item)}
                disabled={isLoadingMetadata}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Tags
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Metadata</DialogTitle>
            <DialogDescription>
              {editingItem?.originalName}
            </DialogDescription>
          </DialogHeader>
          {editingMetadata && (
            <MetadataEditor
              initialMetadata={editingMetadata}
              onSave={handleSaveMetadata}
              onCancel={() => setIsEditorOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
