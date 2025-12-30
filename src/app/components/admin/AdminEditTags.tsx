import { Suspense, useState, useTransition } from 'react'
import { RiEdit2Fill, RiLoader4Fill } from 'react-icons/ri'
import { toast } from 'react-toastify'
import { type Song, songService } from '@/api/songService'
import { tagWriterService } from '@/api/tagWriterService'
import { Button } from '@/app/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import { useAuth } from '@/contexts/AuthContext'
import { eraService } from '@/service/eraService'
import { subsonic } from '@/service/subsonic'
import { yeditorService } from '@/service/yeditorService'
import type { MusicMetadata } from '@/types/upload'
import { MetadataEditorEnhanced } from '../upload/MetadataEditorEnhanced'

interface AdminEditTagsProps {
  contentId: string
  contentType: 'album' | 'song'
  contentName: string
}

export function AdminEditTags({ contentId, contentType }: AdminEditTagsProps) {
  const { profile } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [editingSong, setEditingSong] = useState<Song | null>(null)
  const [editorMetadata, setEditorMetadata] = useState<MusicMetadata | null>(
    null,
  )
  const [isPending, startTransition] = useTransition()

  // Only admins can see this
  if (!profile?.is_admin) return null

  const handleOpen = async () => {
    try {
      let song: Song | null = null
      if (contentType === 'song') {
        const data = await subsonic.songs.getSong(contentId)
        song = data as unknown as Song
      } else {
        const album = await subsonic.albums.getOne(contentId)
        if (album && album.song && album.song.length > 0) {
          song = album.song[0] as unknown as Song
        }
      }

      if (song) {
        setEditingSong(song)
        setIsOpen(true)

        const meta = songService.songToMetadata(song)
        const era = await eraService.getEra(song.id, 'song')

        startTransition(() => {
          setEditorMetadata({ ...meta, era: era || undefined })
        })
      } else {
        toast.info('No content found to edit.')
      }
    } catch (error) {
      console.error('Error loading content for admin edit:', error)
      toast.error('Failed to load data')
    }
  }

  const handleSaveMetadata = async (
    metadata: MusicMetadata,
    coverArt?: File,
  ) => {
    if (!editingSong) return

    try {
      // Update metadata
      await tagWriterService.updateSongTags(
        editingSong.id,
        metadata,
        editingSong.path,
      )

      // Update cover art if provided
      if (coverArt) {
        await tagWriterService.updateCoverArt(editingSong.id, coverArt)
      }

      // Update Era tag if provided
      if (metadata.era) {
        await eraService.setEra(editingSong.id, 'song', metadata.era)
      }

      // Link to Yeditor if provided
      if (metadata.yeditorId) {
        await yeditorService.setYeditorForContent(
          editingSong.id,
          'song',
          metadata.yeditorId,
        )
      }

      toast.success('Tags updated successfully! Refreshing...', {
        autoClose: 2000,
      })
      setIsOpen(false)

      // Refresh after a short delay
      setTimeout(() => window.location.reload(), 2000)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update tags',
      )
    }
  }

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      window.location.reload()
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          onClick={handleOpen}
          variant="outline"
          size="sm"
          className="border-primary/50 text-primary hover:bg-primary/10 font-bold bg-primary/5"
        >
          <RiEdit2Fill className="mr-2 h-4 w-4" />
          Edit Tags (Admin)
        </Button>
        <Button
          onClick={handleSync}
          variant="ghost"
          size="sm"
          disabled={isSyncing}
          className="text-muted-foreground hover:text-foreground"
        >
          {isSyncing ? (
            <RiLoader4Fill className="h-4 w-4 animate-spin" />
          ) : (
            'Sync'
          )}
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <Suspense
            fallback={
              <div className="flex justify-center p-12">
                <RiLoader4Fill className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <DialogHeader>
              <DialogTitle>Admin Tag Editor</DialogTitle>
              <DialogDescription>
                Directly updating metadata for {editingSong?.title}
              </DialogDescription>
            </DialogHeader>
            {editingSong && editorMetadata && !isPending ? (
              <MetadataEditorEnhanced
                initialMetadata={editorMetadata}
                onSave={handleSaveMetadata}
                onCancel={() => setIsOpen(false)}
                fileName={editingSong.title}
              />
            ) : (
              <div className="flex justify-center p-12">
                <RiLoader4Fill className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </Suspense>
        </DialogContent>
      </Dialog>
    </>
  )
}
