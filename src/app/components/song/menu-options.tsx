import { useState } from 'react'
import { OptionsButtons } from '@/app/components/options/buttons'
import { ContextMenuSeparator } from '@/app/components/ui/context-menu'
import { useOptions } from '@/app/hooks/use-options'
import { ISong } from '@/types/responses/song'
import { AddToPlaylistSubMenu } from './add-to-playlist'
import { EditMetadataButton } from '@/app/components/album/edit-metadata-button'
import { Edit } from 'lucide-react'
import { ContextMenuItem } from '@/app/components/ui/context-menu'
import { DropdownMenuItem } from '@/app/components/ui/dropdown-menu'
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
  const [isEditOpen, setIsEditOpen] = useState(false)
  const queryClient = useQueryClient()

  const handleMetadataUpdated = () => {
    // Invalidate album queries to refresh the song list
    if (song.albumId) {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.album.single, song.albumId],
      })
    }
    // Also invalidate song lists
    queryClient.invalidateQueries({
      queryKey: [queryKeys.song.list],
    })
  }

  const EditTagsMenuItem = () => {
    if (variant === 'context') {
      return (
        <ContextMenuItem
          onClick={(e) => {
            e.stopPropagation()
            setIsEditOpen(true)
          }}
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Tags
        </ContextMenuItem>
      )
    }

    return (
      <DropdownMenuItem
        onClick={(e) => {
          e.stopPropagation()
          setIsEditOpen(true)
        }}
      >
        <Edit className="w-4 h-4 mr-2" />
        Edit Tags
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

      {/* Hidden EditMetadataButton controlled by menu */}
      {isEditOpen && (
        <div style={{ display: 'none' }}>
          <EditMetadataButton
            song={song}
            variant="ghost"
            size="sm"
            onMetadataUpdated={handleMetadataUpdated}
          />
        </div>
      )}
    </>
  )
}
