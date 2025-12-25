import { useState } from 'react'
import { OptionsButtons } from '@/app/components/options/buttons'
import { AddToPlaylistSubMenu } from '@/app/components/song/add-to-playlist'
import {
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/app/components/ui/dropdown-menu'
import { EditAlbumDialog } from '@/app/components/album/edit-album-dialog'
import { useOptions } from '@/app/hooks/use-options'
import { SingleAlbum } from '@/types/responses/album'
import { Edit } from 'lucide-react'

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
      <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
        <Edit className="w-4 h-4 mr-2" />
        {editButtonText}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <OptionsButtons.Download onClick={handleDownload} />
      </DropdownMenuGroup>

      {/* Edit Dialog - Rendered outside dropdown to prevent closing */}
      <EditAlbumDialog 
        album={album} 
        open={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen} 
      />
    </>
  )
}
