import { useState } from 'react';
import { FileUploader } from '@/app/components/upload/FileUploader';
import { MetadataEditor } from '@/app/components/upload/MetadataEditor';
import { UploadProgress } from '@/app/components/upload/UploadProgress';
import { Button } from '@/app/components/ui/button';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Label } from '@/app/components/ui/label';
import { uploadService } from '@/api/uploadService';
import type { UploadFile, MusicMetadata } from '@/types/upload';
import { toast } from 'react-toastify';
import { Upload, Settings, FolderTree } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';

export default function UploadPage() {
  const [uploads, setUploads] = useState<UploadFile[]>([]);
  const [editingFile, setEditingFile] = useState<UploadFile | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [useBatchMode, setUseBatchMode] = useState(false);

  const handleFilesSelected = async (files: File[]) => {
    const newUploads: UploadFile[] = files.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      status: 'pending',
      progress: 0,
    }));

    setUploads((prev) => [...prev, ...newUploads]);

    // Auto-extract metadata for each file (unless in batch mode with many files)
    if (!useBatchMode || files.length <= 5) {
      for (const upload of newUploads) {
        try {
          const metadataResponse = await uploadService.extractMetadata(upload.file);
          setUploads((prev) =>
            prev.map((u) =>
              u.id === upload.id
                ? { ...u, metadata: metadataResponse.common }
                : u
            )
          );
        } catch (error) {
          console.error('Failed to extract metadata:', error);
        }
      }
    }
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

  const handleUploadAll = async () => {
    const pendingUploads = uploads.filter((u) => u.status === 'pending');

    if (useBatchMode && pendingUploads.length > 1) {
      // Batch upload mode - upload all at once
      try {
        setUploads((prev) =>
          prev.map((u) =>
            u.status === 'pending' ? { ...u, status: 'uploading', progress: 0 } : u
          )
        );

        const files = pendingUploads.map(u => u.file);
        await uploadService.uploadBatch(files, (progress) => {
          setUploads((prev) =>
            prev.map((u) =>
              u.status === 'uploading' ? { ...u, progress } : u
            )
          );
        });

        setUploads((prev) =>
          prev.map((u) =>
            u.status === 'uploading' ? { ...u, status: 'success', progress: 100 } : u
          )
        );

        toast.success(`Successfully uploaded ${pendingUploads.length} files`);
      } catch (error) {
        setUploads((prev) =>
          prev.map((u) =>
            u.status === 'uploading'
              ? {
                  ...u,
                  status: 'error',
                  error: error instanceof Error ? error.message : 'Upload failed',
                }
              : u
          )
        );
        toast.error('Batch upload failed');
      }
    } else {
      // Individual upload mode - upload with metadata
      for (const upload of pendingUploads) {
        try {
          setUploads((prev) =>
            prev.map((u) =>
              u.id === upload.id ? { ...u, status: 'uploading', progress: 0 } : u
            )
          );

          // Convert cover art to base64 if provided
          let metadataWithCover = upload.metadata;
          if (upload.coverArtFile) {
            const reader = new FileReader();
            const base64 = await new Promise<string>((resolve) => {
              reader.onload = (e) => resolve(e.target?.result as string);
              reader.readAsDataURL(upload.coverArtFile!);
            });
            metadataWithCover = {
              ...upload.metadata,
              coverArt: base64.split(',')[1], // Remove data:image/jpeg;base64, prefix
            };
          }

          await uploadService.uploadFile(
            upload.file,
            metadataWithCover,
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
    }
  };

  const handleClearCompleted = () => {
    setUploads((prev) => prev.filter((u) => u.status !== 'success'));
  };

  const pendingCount = uploads.filter((u) => u.status === 'pending').length;
  const uploadingCount = uploads.filter((u) => u.status === 'uploading').length;

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Upload Music</h1>
        <p className="text-muted-foreground">
          Upload your music files to Navidrome with custom metadata
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-4 p-4 border rounded-lg bg-card">
          <Checkbox
            id="batch-mode"
            checked={useBatchMode}
            onCheckedChange={(checked) => setUseBatchMode(checked === true)}
          />
          <div className="flex-1">
            <Label htmlFor="batch-mode" className="cursor-pointer font-medium">
              <div className="flex items-center gap-2">
                <FolderTree className="w-4 h-4" />
                Batch Upload Mode
              </div>
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              Upload multiple files at once. Files will be organized by Artist/Album from their existing metadata.
              Perfect for uploading full albums or folders.
            </p>
          </div>
        </div>

        <FileUploader onFilesSelected={handleFilesSelected} />

        {uploads.length > 0 && (
          <>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={handleClearCompleted}
                disabled={uploads.filter((u) => u.status === 'success').length === 0}
              >
                Clear Completed
              </Button>
              <Button
                onClick={handleUploadAll}
                disabled={pendingCount === 0 || uploadingCount > 0}
              >
                <Upload className="w-4 h-4 mr-2" />
                {useBatchMode ? 'Batch Upload' : 'Upload'} {pendingCount}{' '}
                {pendingCount === 1 ? 'File' : 'Files'}
              </Button>
            </div>

            <UploadProgress uploads={uploads} />

            {!useBatchMode && uploads.some((u) => u.status === 'pending') && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Pending Files</h3>
                <p className="text-sm text-muted-foreground">
                  Review and edit metadata before uploading
                </p>
                <div className="space-y-2">
                  {uploads
                    .filter((u) => u.status === 'pending')
                    .map((upload) => (
                      <div
                        key={upload.id}
                        className="p-3 border rounded-lg bg-card flex items-center justify-between"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{upload.file.name}</p>
                          {upload.metadata && (
                            <p className="text-sm text-muted-foreground truncate">
                              {upload.metadata.artist} - {upload.metadata.title || 'Unknown'}
                              {upload.metadata.album && ` • ${upload.metadata.album}`}
                            </p>
                          )}
                          {upload.coverArtFile && (
                            <p className="text-xs text-green-600 mt-1">
                              ✓ Cover art attached
                            </p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditMetadata(upload)}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Edit Metadata
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {useBatchMode && pendingCount > 0 && (
              <div className="p-4 border rounded-lg bg-card">
                <div className="flex items-start gap-3">
                  <FolderTree className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium mb-1">Batch Mode Active</h4>
                    <p className="text-sm text-muted-foreground">
                      {pendingCount} file{pendingCount !== 1 ? 's' : ''} ready to upload.
                      Files will be organized by their existing metadata into Artist/Album folders.
                      Click "Batch Upload" to upload all files at once.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Metadata</DialogTitle>
            <DialogDescription>
              {editingFile?.file.name}
            </DialogDescription>
          </DialogHeader>
          {editingFile && (
            <MetadataEditor
              initialMetadata={editingFile.metadata}
              onSave={handleSaveMetadata}
              onCancel={() => setIsEditorOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
