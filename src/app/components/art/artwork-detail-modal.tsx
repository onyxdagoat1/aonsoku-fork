import { CustomArtwork, ArtworkType, useArtworkStore } from '@/store/artwork.store'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog'
import { Button } from '@/app/components/ui/button'
import { Trash2, Calendar, User, Palette, FileImage, Download } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'

interface ArtworkDetailModalProps {
  artwork: CustomArtwork | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const typeLabels: Record<ArtworkType, string> = {
  [ArtworkType.SingleCover]: 'Single Cover',
  [ArtworkType.Artwork]: 'Artwork',
  [ArtworkType.AlbumCover]: 'Comp/Album Cover',
}

export function ArtworkDetailModal({
  artwork,
  open,
  onOpenChange,
}: ArtworkDetailModalProps) {
  const { deleteArtwork } = useArtworkStore()
  const { success, error } = useToast()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  if (!artwork) return null

  const handleDelete = async () => {
    try {
      await deleteArtwork(artwork.id)
      setShowDeleteDialog(false)
      onOpenChange(false)
      success('Deleted', 'Artwork has been removed from your gallery')
    } catch (err) {
      error('Delete failed', 'Failed to delete artwork. Please try again.')
      console.error(err)
    }
  }

  const handleDownload = () => {
    try {
      // Create a temporary link element
      const link = document.createElement('a')
      link.href = artwork.imageData
      link.download = `${artwork.artworkName} - ${artwork.artistName}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      success('Downloaded', 'Artwork saved to your downloads')
    } catch (err) {
      error('Download failed', 'Failed to download artwork')
      console.error(err)
    }
  }

  const uploadDate = new Date(artwork.uploadedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{artwork.artworkName}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image */}
            <div className="space-y-4">
              <img
                src={artwork.imageData}
                alt={artwork.artworkName}
                className="w-full rounded-lg shadow-lg"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleDownload}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-6">
              {/* Artist */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span>Artist</span>
                </div>
                <p className="text-lg font-semibold">{artwork.artistName}</p>
              </div>

              {/* Editor */}
              {artwork.editor && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Palette className="w-4 h-4" />
                    <span>Edited by</span>
                  </div>
                  <p className="text-lg">{artwork.editor}</p>
                </div>
              )}

              {/* Comp/Era */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Comp/Era</span>
                </div>
                <p className="text-lg font-medium">{artwork.compEra}</p>
              </div>

              {/* Type */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileImage className="w-4 h-4" />
                  <span>Type</span>
                </div>
                <p className="text-lg">{typeLabels[artwork.type]}</p>
              </div>

              {/* Upload Date */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Uploaded</span>
                </div>
                <p className="text-sm">{uploadDate}</p>
              </div>

              {/* Description */}
              {artwork.description && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Description
                  </h3>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {artwork.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{artwork.artworkName}". This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
