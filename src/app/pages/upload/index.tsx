import { useState, useCallback } from 'react';
import { FileUploader } from '@/app/components/upload/FileUploader';
import { MetadataEditorEnhanced } from '@/app/components/upload/MetadataEditorEnhanced';
import { FilePreviewCard } from '@/app/components/upload/FilePreviewCard';
import { ExistingSongEditor } from '@/app/components/upload/ExistingSongEditor';
import { ShadowHeader } from '@/app/components/album/shadow-header';
import { HeaderTitle } from '@/app/components/header-title';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { uploadService } from '@/api/uploadService';
import type { UploadFile, MusicMetadata, UploadMode } from '@/types/upload';
import { toast } from 'react-toastify';
import { 
  Upload, 
  FolderTree, 
  Filter,
  SortAsc,
  Trash2,
  CheckCircle,
  Settings,
  Edit3
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';

type PageMode = 'upload' | 'batch' | 'edit';

export default function UploadPage() {
  const [uploads, setUploads] = useState<UploadFile[]>([]);
  const [editingFile, setEditingFile] = useState<UploadFile | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [pageMode, setPageMode] = useState<PageMode>('upload');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [isBatchEditing, setIsBatchEditing] = useState(false);
  const [batchMetadata, setBatchMetadata] = useState<Partial<MusicMetadata>>({});

  const uploadMode: UploadMode = pageMode === 'batch' ? 'batch' : 'detailed';

  const handleFilesSelected = async (files: File[]) => {
    const newUploads: UploadFile[] = files.map((file, index) => ({
      id: Math.random().toString(36).substring(7),
      file,
      status: 'pending',
      progress: 0,
      order: uploads.length + index,
    }));

    setUploads((prev) => [...prev, ...newUploads]);

    // Auto-extract metadata for each file
    if (uploadMode !== 'quick' || files.length <= 5) {
      for (const upload of newUploads) {
        try {
          const metadataResponse = await uploadService.extractMetadata(upload.file);
          setUploads((prev) =>
            prev.map((u) =>
              u.id === upload.id
                ? { 
                    ...u, 
                    metadata: metadataResponse.common,
                    duration: metadataResponse.format.duration,
                    bitrate: metadataResponse.format.bitrate,
                  }
                : u
            )
          );
        } catch (error) {
          console.error('Failed to extract metadata:', error);
        }
      }
    }

    toast.success(`Added ${files.length} file${files.length > 1 ? 's' : ''} to queue`);
  };

  const handleEditMetadata = (upload: UploadFile) => {
    setEditingFile(upload);
    setIsEditorOpen(true);
  };

  const handleSaveMetadata = (metadata: MusicMetadata, coverArt?: File) => {
    if (editingFile) {
      setUploads((prev) =>
        prev.map((u) =>
          u.id === editingFile.id ? { ...u, metadata, coverArtFile: coverArt } : u
        )
      );
      setIsEditorOpen(false);
      setEditingFile(null);
      toast.success('Metadata updated');
    }
  };

  const handleRemoveFile = (id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
    toast.info('File removed from queue');
  };

  const handleUploadAll = async () => {
    const pendingUploads = uploads.filter((u) => u.status === 'pending');

    // Detailed/Batch mode - upload with metadata
    for (const upload of pendingUploads) {
      try {
        setUploads((prev) =>
          prev.map((u) =>
            u.id === upload.id ? { ...u, status: 'uploading', progress: 0 } : u
          )
        );

        await uploadService.uploadFile(
          upload.file,
          upload.metadata,
          upload.coverArtFile,
          (progress) => {
            setUploads((prev) =>
              prev.map((u) =>
                u.id === upload.id ? { ...u, progress } : u
              )
            );
          }
        );

        setUploads((prev) =>
          prev.map((u) =>
            u.id === upload.id ? { ...u, status: 'success', progress: 100 } : u
          )
        );

        toast.success(`${upload.file.name} uploaded successfully`);
      } catch (error) {
        setUploads((prev) =>
          prev.map((u) =>
            u.id === upload.id
              ? {
                  ...u,
                  status: 'error',
                  error: error instanceof Error ? error.message : 'Upload failed',
                }
              : u
          )
        );

        toast.error(`Failed to upload ${upload.file.name}`);
      }
    }
  };

  const handleClearCompleted = () => {
    const completedCount = uploads.filter((u) => u.status === 'success').length;
    setUploads((prev) => prev.filter((u) => u.status !== 'success'));
    toast.info(`Cleared ${completedCount} completed upload${completedCount > 1 ? 's' : ''}`);
  };

  const handleClearAll = () => {
    const pendingCount = uploads.filter((u) => u.status === 'pending').length;
    setUploads([]);
    toast.info(`Cleared all ${pendingCount} file${pendingCount > 1 ? 's' : ''}`);
  };

  // Drag and drop for queue reordering
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    setUploads((prev) => {
      const newUploads = [...prev];
      const draggedIndex = newUploads.findIndex((u) => u.id === draggedId);
      const targetIndex = newUploads.findIndex((u) => u.id === targetId);

      if (draggedIndex !== -1 && targetIndex !== -1) {
        const [removed] = newUploads.splice(draggedIndex, 1);
        newUploads.splice(targetIndex, 0, removed);
      }

      return newUploads.map((u, i) => ({ ...u, order: i }));
    });

    setDraggedId(null);
    setDragOverId(null);
  };

  const handleBatchEdit = () => {
    setIsBatchEditing(true);
  };

  const handleApplyBatchMetadata = () => {
    const pendingUploads = filteredUploads.filter((u) => u.status === 'pending');
    
    setUploads((prev) =>
      prev.map((u) => {
        if (u.status === 'pending' && pendingUploads.includes(u)) {
          return {
            ...u,
            metadata: {
              ...u.metadata,
              ...Object.fromEntries(
                Object.entries(batchMetadata).filter(([_, v]) => v !== undefined && v !== '')
              ),
            },
          };
        }
        return u;
      })
    );

    setIsBatchEditing(false);
    setBatchMetadata({});
    toast.success(`Applied metadata to ${pendingUploads.length} file${pendingUploads.length > 1 ? 's' : ''}`);
  };

  // Filter and sort uploads
  const filteredUploads = uploads
    .filter((u) => filterStatus === 'all' || u.status === filterStatus)
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.file.name.localeCompare(b.file.name);
        case 'size':
          return b.file.size - a.file.size;
        case 'order':
          return (a.order || 0) - (b.order || 0);
        default:
          return 0;
      }
    });

  const pendingCount = uploads.filter((u) => u.status === 'pending').length;
  const uploadingCount = uploads.filter((u) => u.status === 'uploading').length;
  const successCount = uploads.filter((u) => u.status === 'success').length;
  const errorCount = uploads.filter((u) => u.status === 'error').length;

  return (
    <div className="w-full h-content">
      <ShadowHeader
        showGlassEffect={false}
        fixed={false}
        className="relative w-full justify-between items-center"
      >
        <HeaderTitle title="Upload" />
        
        <Tabs value={pageMode} onValueChange={(v) => setPageMode(v as PageMode)} className="flex-1 max-w-md">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="batch" className="gap-2">
              <FolderTree className="w-4 h-4" />
              Batch
            </TabsTrigger>
            <TabsTrigger value="edit" className="gap-2">
              <Edit3 className="w-4 h-4" />
              Edit Tags
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </ShadowHeader>

      <div className="w-full h-[calc(100%-80px)] overflow-auto p-6">
        <Tabs value={pageMode} onValueChange={(v) => setPageMode(v as PageMode)}>
          <TabsContent value="upload" className="space-y-6 mt-0">
            <div className="p-4 border rounded-lg bg-card">
              <div className="flex items-start gap-3">
                <Upload className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium mb-1">Upload Mode</h4>
                  <p className="text-sm text-muted-foreground">
                    Upload files with full metadata editing. Review and customize tags, artwork, and lyrics for each track.
                    Ideal for single tracks or when you need precise control.
                  </p>
                </div>
              </div>
            </div>
            <FileUploader onFilesSelected={handleFilesSelected} />
          </TabsContent>

          <TabsContent value="batch" className="space-y-6 mt-0">
            <div className="p-4 border rounded-lg bg-card">
              <div className="flex items-start gap-3">
                <FolderTree className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium mb-1">Batch Upload Mode</h4>
                  <p className="text-sm text-muted-foreground">
                    Upload multiple files and apply common metadata to all. Great for uploading albums or compilations
                    where tracks share artist, album, and year information.
                  </p>
                </div>
              </div>
            </div>
            <FileUploader onFilesSelected={handleFilesSelected} />
          </TabsContent>

          <TabsContent value="edit" className="space-y-6 mt-0">
            <ExistingSongEditor />
          </TabsContent>
        </Tabs>

        {uploads.length > 0 && pageMode !== 'edit' && (
          <div className="space-y-6 mt-6">
            {/* Stats and Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 border rounded-lg bg-card">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Total:</span>
                  <span className="text-sm text-muted-foreground">{uploads.length}</span>
                </div>
                {pendingCount > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-blue-500">Pending:</span>
                    <span className="text-sm">{pendingCount}</span>
                  </div>
                )}
                {uploadingCount > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-primary">Uploading:</span>
                    <span className="text-sm">{uploadingCount}</span>
                  </div>
                )}
                {successCount > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-green-500">Success:</span>
                    <span className="text-sm">{successCount}</span>
                  </div>
                )}
                {errorCount > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-destructive">Failed:</span>
                    <span className="text-sm">{errorCount}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Files</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="uploading">Uploading</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="error">Failed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px]">
                    <SortAsc className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="order">Upload Order</SelectItem>
                    <SelectItem value="name">File Name</SelectItem>
                    <SelectItem value="size">File Size</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 justify-end">
              {uploadMode === 'batch' && pendingCount > 0 && (
                <Button
                  variant="outline"
                  onClick={handleBatchEdit}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Batch Edit Metadata
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleClearCompleted}
                disabled={successCount === 0}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Clear Completed
              </Button>
              <Button
                variant="outline"
                onClick={handleClearAll}
                disabled={uploads.length === 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
              <Button
                onClick={handleUploadAll}
                disabled={pendingCount === 0 || uploadingCount > 0}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload {pendingCount} {pendingCount === 1 ? 'File' : 'Files'}
              </Button>
            </div>

            {/* File List */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Upload Queue</h3>
              {filteredUploads.map((upload) => (
                <FilePreviewCard
                  key={upload.id}
                  upload={upload}
                  onEdit={handleEditMetadata}
                  onRemove={handleRemoveFile}
                  isDraggable={uploadMode === 'detailed' || uploadMode === 'batch'}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  dragOver={dragOverId === upload.id}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Metadata Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Metadata</DialogTitle>
            <DialogDescription>
              {editingFile?.file.name}
            </DialogDescription>
          </DialogHeader>
          {editingFile && (
            <MetadataEditorEnhanced
              initialMetadata={editingFile.metadata}
              onSave={handleSaveMetadata}
              onCancel={() => setIsEditorOpen(false)}
              fileName={editingFile.file.name}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Batch Edit Dialog */}
      <Dialog open={isBatchEditing} onOpenChange={setIsBatchEditing}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Batch Edit Metadata</DialogTitle>
            <DialogDescription>
              Apply common metadata to {pendingCount} pending file{pendingCount > 1 ? 's' : ''}.
              Only filled fields will be applied.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="batch-artist">Artist</Label>
                <Input
                  id="batch-artist"
                  value={batchMetadata.artist || ''}
                  onChange={(e) => setBatchMetadata((p) => ({ ...p, artist: e.target.value }))}
                  placeholder="Apply to all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="batch-album">Album</Label>
                <Input
                  id="batch-album"
                  value={batchMetadata.album || ''}
                  onChange={(e) => setBatchMetadata((p) => ({ ...p, album: e.target.value }))}
                  placeholder="Apply to all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="batch-year">Year</Label>
                <Input
                  id="batch-year"
                  type="number"
                  value={batchMetadata.year || ''}
                  onChange={(e) => setBatchMetadata((p) => ({ ...p, year: parseInt(e.target.value) || 0 }))}
                  placeholder="Apply to all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="batch-genre">Genre</Label>
                <Input
                  id="batch-genre"
                  value={batchMetadata.genre || ''}
                  onChange={(e) => setBatchMetadata((p) => ({ ...p, genre: e.target.value }))}
                  placeholder="Apply to all"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsBatchEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleApplyBatchMetadata}>
                Apply to {pendingCount} File{pendingCount > 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}