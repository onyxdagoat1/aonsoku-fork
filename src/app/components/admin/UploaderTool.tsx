import {
  Filter,
  FolderTree,
  Loader2,
  Settings,
  Upload as UploadIcon,
} from 'lucide-react'
import { Suspense, useCallback, useState, useTransition } from 'react'
import { toast } from 'react-toastify'
import { songService } from '@/api/songService'
import { uploadService } from '@/api/uploadService'
import { Button } from '@/app/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import { FilePreviewCard } from '@/app/components/upload/FilePreviewCard'
import { FileUploader } from '@/app/components/upload/FileUploader'
import { MetadataEditorEnhanced } from '@/app/components/upload/MetadataEditorEnhanced'
import { yeditorService } from '@/service/yeditorService'
import type { MusicMetadata, UploadFile } from '@/types/upload'

export function UploaderTool() {
  const [uploads, setUploads] = useState<UploadFile[]>([])
  const [editingFile, setEditingFile] = useState<UploadFile | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [subMode, setSubMode] = useState<'single' | 'batch'>('single')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [isBatchEditing, setIsBatchEditing] = useState(false)
  const [batchMetadata, setBatchMetadata] = useState<Partial<MusicMetadata>>({})

  const handleFilesSelected = async (files: File[]) => {
    const newUploads: UploadFile[] = files.map((file, index) => ({
      id: Math.random().toString(36).substring(7),
      file,
      status: 'pending',
      progress: 0,
      order: uploads.length + index,
    }))

    setUploads((prev) => [...prev, ...newUploads])

    for (const upload of newUploads) {
      try {
        const metadataResponse = await uploadService.extractMetadata(
          upload.file,
        )
        setUploads((prev) =>
          prev.map((u) =>
            u.id === upload.id
              ? {
                  ...u,
                  metadata: metadataResponse.common,
                  duration: metadataResponse.format.duration,
                  bitrate: metadataResponse.format.bitrate,
                }
              : u,
          ),
        )
      } catch (error) {
        console.error('Failed to extract metadata:', error)
      }
    }

    toast.success(
      `Added ${files.length} file${files.length > 1 ? 's' : ''} to queue`,
    )
  }

  const [, startTransition] = useTransition()

  const handleEditMetadata = (upload: UploadFile) => {
    startTransition(() => {
      setEditingFile(upload)
      setIsEditorOpen(true)
    })
  }

  const handleSaveMetadata = (metadata: MusicMetadata, coverArt?: File) => {
    if (editingFile) {
      setUploads((prev) =>
        prev.map((u) =>
          u.id === editingFile.id
            ? { ...u, metadata, coverArtFile: coverArt }
            : u,
        ),
      )
      setIsEditorOpen(false)
      setEditingFile(null)
      toast.success('Metadata updated')
    }
  }

  const handleRemoveFile = (id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id))
    toast.info('File removed from queue')
  }

  const linkNewlyUploadedSong = useCallback(async (upload: UploadFile) => {
    if (
      !upload.metadata?.yeditorId ||
      !upload.metadata?.title ||
      !upload.metadata?.artist
    )
      return

    let attempts = 0
    const maxAttempts = 6

    const tryLinking = async () => {
      try {
        const query = `${upload.metadata?.artist} ${upload.metadata?.title}`
        const searchResults = await songService.searchSongs(query, 20)
        const match = searchResults.find(
          (s) =>
            s.title.toLowerCase().trim() ===
              upload.metadata?.title?.toLowerCase().trim() &&
            s.artist.toLowerCase().trim() ===
              upload.metadata?.artist?.toLowerCase().trim(),
        )

        if (match) {
          const success = await yeditorService.setYeditorForContent(
            match.id,
            'song',
            upload.metadata!.yeditorId!,
          )
          if (success) return true
        }
      } catch (e) {
        console.error('Error auto-linking:', e)
      }
      return false
    }

    for (attempts = 1; attempts <= maxAttempts; attempts++) {
      await new Promise((r) => setTimeout(r, attempts * 5000))
      const success = await tryLinking()
      if (success) break
    }
  }, [])

  const handleUploadAll = async () => {
    const pendingUploads = uploads.filter((u) => u.status === 'pending')
    for (const upload of pendingUploads) {
      try {
        setUploads((prev) =>
          prev.map((u) =>
            u.id === upload.id ? { ...u, status: 'uploading', progress: 0 } : u,
          ),
        )

        await uploadService.uploadFile(
          upload.file,
          upload.metadata,
          upload.coverArtFile,
          (progress) => {
            setUploads((prev) =>
              prev.map((u) => (u.id === upload.id ? { ...u, progress } : u)),
            )
          },
        )

        setUploads((prev) =>
          prev.map((u) =>
            u.id === upload.id ? { ...u, status: 'success', progress: 100 } : u,
          ),
        )

        toast.success(`${upload.file.name} uploaded successfully`)
        if (upload.metadata?.yeditorId) linkNewlyUploadedSong(upload)
      } catch (error) {
        setUploads((prev) =>
          prev.map((u) =>
            u.id === upload.id
              ? {
                  ...u,
                  status: 'error',
                  error:
                    error instanceof Error ? error.message : 'Upload failed',
                }
              : u,
          ),
        )
        toast.error(`Failed to upload ${upload.file.name}`)
      }
    }
  }

  const handleClearCompleted = () => {
    setUploads((prev) => prev.filter((u) => u.status !== 'success'))
  }

  const handleDragStart = (_e: React.DragEvent, id: string) => setDraggedId(id)
  const handleDragOver = (e: React.DragEvent) => e.preventDefault()
  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedId || draggedId === targetId) return
    setUploads((prev) => {
      const newUploads = [...prev]
      const dIdx = newUploads.findIndex((u) => u.id === draggedId)
      const tIdx = newUploads.findIndex((u) => u.id === targetId)
      if (dIdx !== -1 && tIdx !== -1) {
        const [removed] = newUploads.splice(dIdx, 1)
        newUploads.splice(tIdx, 0, removed)
      }
      return newUploads.map((u, i) => ({ ...u, order: i }))
    })
    setDraggedId(null)
  }

  const handleBatchEdit = () => setIsBatchEditing(true)
  const handleApplyBatchMetadata = () => {
    const pendingUploads = uploads.filter(
      (u) =>
        u.status === 'pending' &&
        (filterStatus === 'all' || u.status === filterStatus),
    )
    setUploads((prev) =>
      prev.map((u) => {
        if (
          u.status === 'pending' &&
          pendingUploads.some((pu) => pu.id === u.id)
        ) {
          return {
            ...u,
            metadata: {
              ...u.metadata,
              ...Object.fromEntries(
                Object.entries(batchMetadata).filter(
                  ([_, v]) => v !== undefined && v !== '',
                ),
              ),
            },
          }
        }
        return u
      }),
    )
    setIsBatchEditing(false)
    setBatchMetadata({})
    toast.success('Applied batch metadata')
  }

  const filteredUploads = uploads
    .filter((u) => filterStatus === 'all' || u.status === filterStatus)
    .sort((a, b) => (a.order || 0) - (b.order || 0))

  const pendingCount = uploads.filter((u) => u.status === 'pending').length
  const uploadingCount = uploads.filter((u) => u.status === 'uploading').length
  const successCount = uploads.filter((u) => u.status === 'success').length
  const errorCount = uploads.filter((u) => u.status === 'error').length

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Button
          variant={subMode === 'single' ? 'default' : 'outline'}
          onClick={() => setSubMode('single')}
          className="gap-2"
        >
          <UploadIcon className="w-4 h-4" /> Single/Detailed
        </Button>
        <Button
          variant={subMode === 'batch' ? 'default' : 'outline'}
          onClick={() => setSubMode('batch')}
          className="gap-2"
        >
          <FolderTree className="w-4 h-4" /> Batch/Album
        </Button>
      </div>

      <div className="p-4 border rounded-xl bg-card/50">
        <div className="flex items-start gap-3">
          {subMode === 'single' ? (
            <UploadIcon className="w-5 h-5 text-primary mt-1" />
          ) : (
            <FolderTree className="w-5 h-5 text-primary mt-1" />
          )}
          <div>
            <h4 className="font-semibold">
              {subMode === 'single' ? 'Standard Upload' : 'Batch Upload'}
            </h4>
            <p className="text-sm text-muted-foreground">
              {subMode === 'single'
                ? 'Upload tracks and edit metadata individually. Best for single releases or precise control.'
                : 'Upload multiple tracks and apply shared metadata (Artist, Album, Year) to all. Perfect for albums.'}
            </p>
          </div>
        </div>
      </div>

      <FileUploader onFilesSelected={handleFilesSelected} />

      {uploads.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
            <div className="flex gap-4 text-sm">
              <span className="text-muted-foreground">
                Total:{' '}
                <span className="text-foreground font-medium">
                  {uploads.length}
                </span>
              </span>
              {pendingCount > 0 && (
                <span className="text-blue-400">Pending: {pendingCount}</span>
              )}
              {uploadingCount > 0 && (
                <span className="text-primary animate-pulse">
                  Uploading: {uploadingCount}
                </span>
              )}
              {successCount > 0 && (
                <span className="text-green-500">Success: {successCount}</span>
              )}
              {errorCount > 0 && (
                <span className="text-destructive">Failed: {errorCount}</span>
              )}
            </div>

            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[130px] h-8 text-xs">
                  <Filter className="w-3 h-3 mr-2" />
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
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            {subMode === 'batch' && pendingCount > 0 && (
              <Button size="sm" variant="outline" onClick={handleBatchEdit}>
                <Settings className="w-3.5 h-3.5 mr-2" /> Batch Tags
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handleClearCompleted}
              disabled={successCount === 0}
            >
              Clear Completed
            </Button>
            <Button
              size="sm"
              onClick={handleUploadAll}
              disabled={pendingCount === 0 || uploadingCount > 0}
            >
              Upload {pendingCount} Files
            </Button>
          </div>

          <div className="space-y-2">
            {filteredUploads.map((u) => (
              <FilePreviewCard
                key={u.id}
                upload={u}
                onEdit={handleEditMetadata}
                onRemove={handleRemoveFile}
                isDraggable={true}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                dragOver={false}
              />
            ))}
          </div>
        </div>
      )}

      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Metadata</DialogTitle>
            <DialogDescription>{editingFile?.file.name}</DialogDescription>
          </DialogHeader>
          <Suspense
            fallback={<Loader2 className="animate-spin mx-auto my-8" />}
          >
            {editingFile && (
              <MetadataEditorEnhanced
                initialMetadata={editingFile.metadata}
                onSave={handleSaveMetadata}
                onCancel={() => setIsEditorOpen(false)}
                fileName={editingFile.file.name}
              />
            )}
          </Suspense>
        </DialogContent>
      </Dialog>

      <Dialog open={isBatchEditing} onOpenChange={setIsBatchEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Batch Metadata</DialogTitle>
            <DialogDescription>Apply to {pendingCount} files</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Artist</Label>
                <Input
                  value={batchMetadata.artist || ''}
                  onChange={(e) =>
                    setBatchMetadata((p) => ({ ...p, artist: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Album</Label>
                <Input
                  value={batchMetadata.album || ''}
                  onChange={(e) =>
                    setBatchMetadata((p) => ({ ...p, album: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Year</Label>
                <Input
                  type="number"
                  value={batchMetadata.year || ''}
                  onChange={(e) =>
                    setBatchMetadata((p) => ({
                      ...p,
                      year: parseInt(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Genre</Label>
                <Input
                  value={batchMetadata.genre || ''}
                  onChange={(e) =>
                    setBatchMetadata((p) => ({ ...p, genre: e.target.value }))
                  }
                />
              </div>
            </div>
            <Button className="w-full" onClick={handleApplyBatchMetadata}>
              Apply to Queue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
