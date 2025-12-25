import { useState } from 'react'
import { OptionsButtons } from '@/app/components/options/buttons'
import { AddToPlaylistSubMenu } from '@/app/components/song/add-to-playlist'
import {
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/app/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { CoverArtUpload } from '@/app/components/upload/CoverArtUpload'
import { useOptions } from '@/app/hooks/use-options'
import { SingleAlbum } from '@/types/responses/album'
import { uploadService } from '@/api/uploadService'
import { toast } from 'react-toastify'
import { Edit, Loader2, Save, X, AlertTriangle } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/utils/queryKeys'
import { Button } from '@/app/components/ui/button'

interface AlbumOptionsProps {
  album: SingleAlbum
}

export function AlbumOptions({ album }: AlbumOptionsProps) {
  const {
    playNext,
    playLast,
    startDownload,
    addToPlaylist,
    createNewPlaylist,
  } = useOptions()

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [albumArtist, setAlbumArtist] = useState('')
  const [albumName, setAlbumName] = useState('')
  const [year, setYear] = useState('')
  const [genre, setGenre] = useState('')
  const [coverArtFile, setCoverArtFile] = useState<File | null>(null)
  const [updateProgress, setUpdateProgress] = useState({ current: 0, total: 0 })
  const queryClient = useQueryClient()

  const isSingle = album.songCount === 1
  const editButtonText = isSingle ? 'Edit Single Tags' : 'Edit Comp Tags'

  function handlePlayNext() {
    playNext(album.song)
  }

  function handlePlayLast() {
    playLast(album.song)
  }

  function handleDownload() {
    startDownload(album.id)
  }

  function handleAddToPlaylist(id: string) {
    const songIdToAdd = album.song.map((song) => song.id)
    addToPlaylist(id, songIdToAdd)
  }

  function handleCreateNewPlaylist() {
    const songIdToAdd = album.song.map((song) => song.id)
    createNewPlaylist(album.name, songIdToAdd)
  }

  const handleOpenEditDialog = () => {
    setAlbumArtist(album.albumArtist || album.artist)
    setAlbumName(album.name)
    setYear(album.year?.toString() || '')
    setGenre(album.genre || '')
    setCoverArtFile(null)
    setIsEditDialogOpen(true)
  }

  const handleSaveMetadata = async () => {
    if (!album.song || album.song.length === 0) {
      toast.error('No songs found in this album')
      return
    }

    try {
      setIsUpdating(true)
      setUpdateProgress({ current: 0, total: album.song.length })

      let successCount = 0
      let errorCount = 0
      const errors: string[] = []

      for (let i = 0; i < album.song.length; i++) {
        const song = album.song[i]
        setUpdateProgress({ current: i + 1, total: album.song.length })

        if (!song.path) {
          errorCount++
          errors.push(`${song.title || 'Unknown'}: No file path`)
          continue
        }

        try {
          const current = await uploadService.readMetadata(song.path)
          
          const updatedMetadata = {
            ...current.common,
            album: albumName,
            albumArtist: albumArtist,
            artist: current.common.artist || albumArtist,
            year: year ? parseInt(year.toString()) : current.common.year,
            genre: genre || current.common.genre,
          }

          await uploadService.updateMetadata(
            song.path,
            updatedMetadata,
            coverArtFile || undefined
          )
          
          successCount++
        } catch (error) {
          errorCount++
          const errorMsg = error instanceof Error ? error.message : 'Unknown error'
          errors.push(`${song.title || song.path}: ${errorMsg}`)
          console.error(`Failed to update ${song.path}:`, error)
        }
      }

      if (successCount === album.song.length) {
        toast.success(
          <div>
            <div className="font-bold mb-1">{isSingle ? 'Single' : 'Album'} updated successfully!</div>
            <div className="text-sm">Updated {successCount} song{successCount !== 1 ? 's' : ''}</div>
          </div>
        )
      } else if (successCount > 0) {
        toast.warning(
          <div>
            <div className="font-bold mb-1">Partial update completed</div>
            <div className="text-sm">
              Updated {successCount} of {album.song.length} songs
            </div>
            {errors.length > 0 && errors.length <= 3 && (
              <div className="text-xs mt-2 space-y-1">
                {errors.map((err, idx) => (
                  <div key={idx}>{err}</div>
                ))}
              </div>
            )}
          </div>,
          { autoClose: 7000 }
        )
      } else {
        toast.error(
          <div>
            <div className="font-bold mb-1">Update failed</div>
            <div className="text-sm">No songs were updated</div>
          </div>
        )
      }

      setIsEditDialogOpen(false)
      
      if (successCount > 0) {
        setTimeout(() => {
          queryClient.invalidateQueries({
            queryKey: [queryKeys.album.single, album.id],
          })
          queryClient.invalidateQueries({
            queryKey: [queryKeys.album.list],
          })
        }, 1000)
      }
    } catch (error) {
      console.error('Failed to update album:', error)
      toast.error(
        <div>
          <div className="font-bold mb-1">Update failed</div>
          <div className="text-sm">{error instanceof Error ? error.message : 'Unknown error'}</div>
        </div>
      )
    } finally {
      setIsUpdating(false)
      setUpdateProgress({ current: 0, total: 0 })
    }
  }

  return (
    <>
      <DropdownMenuGroup>
        <OptionsButtons.PlayNext onClick={handlePlayNext} />
        <OptionsButtons.PlayLast onClick={handlePlayLast} />
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <OptionsButtons.AddToPlaylistOption variant="dropdown">
        <AddToPlaylistSubMenu
          type="dropdown"
          newPlaylistFn={handleCreateNewPlaylist}
          addToPlaylistFn={handleAddToPlaylist}
        />
      </OptionsButtons.AddToPlaylistOption>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={handleOpenEditDialog}>
        <Edit className="w-4 h-4 mr-2" />
        {editButtonText}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <OptionsButtons.Download onClick={handleDownload} />
      </DropdownMenuGroup>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit {isSingle ? 'Single' : 'Comp'} Tags</DialogTitle>
            <DialogDescription>
              Update metadata for all {album.song?.length || 0} songs in this {isSingle ? 'single' : 'comp'}
            </DialogDescription>
          </DialogHeader>

          {isUpdating ? (
            <div className="py-8">
              <div className="flex items-center justify-center mb-4">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Updating song {updateProgress.current} of {updateProgress.total}...
              </p>
              <div className="mt-4 w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(updateProgress.current / updateProgress.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-amber-500/10 border-amber-500/30 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1">This will update all songs in the {isSingle ? 'single' : 'comp'}</p>
                  <p className="text-muted-foreground">
                    Individual song titles and track numbers will be preserved. 
                    Only {isSingle ? 'single' : 'album'}-level information will be changed.
                  </p>
                </div>
              </div>

              <CoverArtUpload
                onCoverArtSelected={setCoverArtFile}
                currentCoverArt={album.coverArt ? `/rest/getCoverArt?id=${album.coverArt}` : undefined}
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="album-name">Album Name</Label>
                  <Input
                    id="album-name"
                    value={albumName}
                    onChange={(e) => setAlbumName(e.target.value)}
                    placeholder="Album name"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="album-artist">Album Artist</Label>
                  <Input
                    id="album-artist"
                    value={albumArtist}
                    onChange={(e) => setAlbumArtist(e.target.value)}
                    placeholder="Album artist"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="2024"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="genre">Genre</Label>
                  <Input
                    id="genre"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    placeholder="Rock, Pop, Jazz, etc."
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSaveMetadata}>
                  <Save className="w-4 h-4 mr-2" />
                  Update {isSingle ? 'Single' : 'Comp'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
