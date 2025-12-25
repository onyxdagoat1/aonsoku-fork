import { useState } from 'react'
import { OptionsButtons } from '@/app/components/options/buttons'
import { ContextMenuSeparator, ContextMenuItem } from '@/app/components/ui/context-menu'
import { DropdownMenuItem } from '@/app/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog'
import { MetadataEditor } from '@/app/components/upload/MetadataEditor'
import { useOptions } from '@/app/hooks/use-options'
import { ISong } from '@/types/responses/song'
import { AddToPlaylistSubMenu } from './add-to-playlist'
import { uploadService } from '@/api/uploadService'
import { toast } from 'react-toastify'
import { Edit, Loader2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/utils/queryKeys'

interface SongMenuOptionsProps {
  variant: 'context' | 'dropdown'
  song: ISong
  index: number
}

export function SongMenuOptions({
  variant,
  song,
  index,
}: SongMenuOptionsProps) {
  const {
    playNext,
    playLast,
    createNewPlaylist,
    addToPlaylist,
    removeSongFromPlaylist,
    startDownload,
    openSongInfo,
    isOnPlaylistPage,
  } = useOptions()
  const songIndexes = [index.toString()]
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [metadata, setMetadata] = useState<any>(null)
  const queryClient = useQueryClient()

  const handleEditTagsClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!song.path) {
      toast.error('Cannot edit: File path not available')
      return
    }

    try {
      setIsLoading(true)
      const result = await uploadService.readMetadata(song.path)
      setMetadata(result.common)
      setIsEditDialogOpen(true)
    } catch (error) {
      console.error('Failed to load metadata:', error)
      toast.error(
        <div>
          <div className="font-bold mb-1">Failed to load metadata</div>
          <div className="text-sm">{error instanceof Error ? error.message : 'Unknown error'}</div>
        </div>,
        { autoClose: 5000 }
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveMetadata = async (newMetadata: any, coverArt?: File) => {
    if (!song.path) {
      toast.error('Cannot save: File path not available')
      return
    }

    try {
      const result = await uploadService.updateMetadata(song.path, newMetadata, coverArt)
      
      if (result.warning) {
        toast.warning(
          <div>
            <div className="font-bold mb-1">{result.message || 'Metadata updated'}</div>
            <div className="text-sm">{result.warning}</div>
          </div>,
          { autoClose: 5000 }
        )
      } else {
        toast.success(result.message || 'Metadata updated successfully')
      }
      
      setIsEditDialogOpen(false)
      setMetadata(null)
      
      // Invalidate queries to refresh data
      if (song.albumId) {
        queryClient.invalidateQueries({
          queryKey: [queryKeys.album.single, song.albumId],
        })
      }
      queryClient.invalidateQueries({
        queryKey: [queryKeys.song.list],
      })
    } catch (error) {
      console.error('Failed to update metadata:', error)
      toast.error(
        <div>
          <div className="font-bold mb-1">Update failed</div>
          <div className="text-sm">{error instanceof Error ? error.message : 'Unknown error'}</div>
        </div>,
        { autoClose: 5000 }
      )
    }
  }

  const EditTagsMenuItem = () => {
    const content = (
      <>
        {isLoading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Edit className="w-4 h-4 mr-2" />
        )}
        Edit Tags
      </>
    )

    if (variant === 'context') {
      return (
        <ContextMenuItem onClick={handleEditTagsClick} disabled={isLoading}>
          {content}
        </ContextMenuItem>
      )
    }

    return (
      <DropdownMenuItem onClick={handleEditTagsClick} disabled={isLoading}>
        {content}
      </DropdownMenuItem>
    )
  }

  return (
    <>
      <OptionsButtons.PlayNext
        variant={variant}
        onClick={(e) => {
          e.stopPropagation()
          playNext([song])
        }}
      />
      <OptionsButtons.PlayLast
        variant={variant}
        onClick={(e) => {
          e.stopPropagation()
          playLast([song])
        }}
      />
      <ContextMenuSeparator />
      <OptionsButtons.AddToPlaylistOption variant={variant}>
        <AddToPlaylistSubMenu
          type={variant}
          newPlaylistFn={() => createNewPlaylist(song.title, song.id)}
          addToPlaylistFn={(id) => addToPlaylist(id, song.id)}
        />
      </OptionsButtons.AddToPlaylistOption>
      {isOnPlaylistPage && (
        <OptionsButtons.RemoveFromPlaylist
          variant={variant}
          onClick={(e) => {
            e.stopPropagation()
            removeSongFromPlaylist(songIndexes)
          }}
        />
      )}
      <ContextMenuSeparator />
      <EditTagsMenuItem />
      <OptionsButtons.Download
        variant={variant}
        onClick={(e) => {
          e.stopPropagation()
          startDownload(song.id)
        }}
      />
      <ContextMenuSeparator />
      <OptionsButtons.SongInfo
        variant={variant}
        onClick={(e) => {
          e.stopPropagation()
          openSongInfo(song.id)
        }}
      />

      {/* Edit Metadata Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
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
              onSave={handleSaveMetadata}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
