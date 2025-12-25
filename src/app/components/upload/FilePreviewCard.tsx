import { useState } from 'react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Progress } from '@/app/components/ui/progress';
import { Badge } from '@/app/components/ui/badge';
import type { UploadFile } from '@/types/upload';
import { 
  Music, 
  Settings, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Loader2,
  GripVertical,
  Image as ImageIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilePreviewCardProps {
  upload: UploadFile;
  onEdit: (upload: UploadFile) => void;
  onRemove: (id: string) => void;
  isDraggable?: boolean;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, id: string) => void;
  dragOver?: boolean;
}

export function FilePreviewCard({
  upload,
  onEdit,
  onRemove,
  isDraggable = false,
  onDragStart,
  onDragOver,
  onDrop,
  dragOver = false,
}: FilePreviewCardProps) {
  const [imageError, setImageError] = useState(false);
  
  const getStatusIcon = () => {
    switch (upload.status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-destructive" />;
      case 'uploading':
        return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
      default:
        return <Music className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = () => {
    switch (upload.status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">Uploaded</Badge>;
      case 'error':
        return <Badge variant="destructive">Failed</Badge>;
      case 'uploading':
        return <Badge variant="default">Uploading...</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCoverArtUrl = () => {
    if (upload.coverArtFile) {
      return URL.createObjectURL(upload.coverArtFile);
    }
    if (upload.metadata?.coverArt) {
      return upload.metadata.coverArt;
    }
    return null;
  };

  const coverArtUrl = getCoverArtUrl();

  return (
    <Card 
      className={cn(
        "transition-all duration-200",
        dragOver && "ring-2 ring-primary",
        upload.status === 'uploading' && "opacity-75"
      )}
      draggable={isDraggable && upload.status === 'pending'}
      onDragStart={(e) => isDraggable && onDragStart?.(e, upload.id)}
      onDragOver={(e) => isDraggable && onDragOver?.(e)}
      onDrop={(e) => isDraggable && onDrop?.(e, upload.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          {isDraggable && upload.status === 'pending' && (
            <div className="cursor-grab active:cursor-grabbing pt-1">
              <GripVertical className="w-5 h-5 text-muted-foreground" />
            </div>
          )}

          {/* Thumbnail */}
          <div className="flex-shrink-0">
            {coverArtUrl && !imageError ? (
              <div className="w-16 h-16 rounded overflow-hidden bg-muted relative group">
                <img
                  src={coverArtUrl}
                  alt="Cover art"
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-white" />
                </div>
              </div>
            ) : (
              <div className="w-16 h-16 rounded bg-muted flex items-center justify-center">
                <Music className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* File Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate text-sm">
                  {upload.metadata?.title || upload.file.name}
                </h4>
                {upload.metadata && (
                  <p className="text-sm text-muted-foreground truncate">
                    {upload.metadata.artist || 'Unknown Artist'}
                    {upload.metadata.album && ` • ${upload.metadata.album}`}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                {getStatusBadge()}
              </div>
            </div>

            {/* File Details */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
              <span>{formatFileSize(upload.file.size)}</span>
              {upload.duration && <span>{formatDuration(upload.duration)}</span>}
              {upload.bitrate && <span>{Math.round(upload.bitrate / 1000)} kbps</span>}
              {upload.metadata?.genre && (
                <Badge variant="outline" className="text-xs">
                  {upload.metadata.genre}
                </Badge>
              )}
            </div>

            {/* Progress Bar */}
            {upload.status === 'uploading' && (
              <div className="mb-2">
                <Progress value={upload.progress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {upload.progress}% complete
                </p>
              </div>
            )}

            {/* Error Message */}
            {upload.status === 'error' && upload.error && (
              <p className="text-xs text-destructive mb-2">
                Error: {upload.error}
              </p>
            )}

            {/* Action Buttons */}
            {upload.status === 'pending' && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(upload)}
                  className="text-xs"
                >
                  <Settings className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemove(upload.id)}
                  className="text-xs text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Remove
                </Button>
              </div>
            )}

            {upload.status === 'error' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onRemove(upload.id)}
                className="text-xs"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Remove
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}