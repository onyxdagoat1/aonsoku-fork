import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
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
import { subsonic } from '@/service/subsonic'
import { useRemovePlaylist } from '@/store/playlists.store'
import { queryKeys } from '@/utils/queryKeys'

export function RemovePlaylistDialog() {
  const { t } = useTranslation()
  const { confirmDialogState, setConfirmDialogState, playlistId } =
    useRemovePlaylist()

  const queryClient = useQueryClient()

  const removeMutation = useMutation({
    mutationFn: subsonic.playlists.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.playlist.all],
      })
      toast.success(
        t('playlist.form.delete.toast.success', {
          defaultValue: 'Playlist deleted',
        }),
      )
      setConfirmDialogState(false)
    },
    onError: () => {
      toast.error(
        t('playlist.form.delete.toast.error', {
          defaultValue: 'Error deleting playlist',
        }),
      )
    },
  })

  async function handleRemove(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    if (playlistId) {
      await removeMutation.mutateAsync(playlistId)
    }
  }

  return (
    <AlertDialog open={confirmDialogState} onOpenChange={setConfirmDialogState}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('playlist.form.delete.title', {
              defaultValue: 'Delete playlist',
            })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('playlist.form.delete.description', {
              defaultValue: 'Are you sure you want to delete this playlist?',
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirmDialogState(false)}>
            {t('logout.dialog.cancel', { defaultValue: 'Cancel' })}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleRemove}>
            {t('logout.dialog.confirm', { defaultValue: 'Delete' })}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
