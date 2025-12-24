import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/app/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { ScrollArea } from '@/app/components/ui/scroll-area'
import { Textarea } from '@/app/components/ui/textarea'
import { useToast } from '@/app/components/ui/use-toast'
import { subsonic } from '@/service/subsonic'
import { ISong } from '@/types/responses/song'
import { queryKeys } from '@/utils/queryKeys'

interface EditMetadataDialogProps {
  song: ISong
}

export function EditMetadataDialog({ song }: EditMetadataDialogProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  const [formData, setFormData] = useState({
    title: song.title,
    artist: song.artist,
    album: song.album,
    albumArtist: song.displayAlbumArtist || song.artist,
    year: song.year || undefined,
    track: song.track || undefined,
    discNumber: song.discNumber || 1,
    genre: song.genre || '',
    bpm: song.bpm || undefined,
    comment: song.comment || '',
  })

  // Reset form when song changes
  useEffect(() => {
    setFormData({
      title: song.title,
      artist: song.artist,
      album: song.album,
      albumArtist: song.displayAlbumArtist || song.artist,
      year: song.year || undefined,
      track: song.track || undefined,
      discNumber: song.discNumber || 1,
      genre: song.genre || '',
      bpm: song.bpm || undefined,
      comment: song.comment || '',
    })
  }, [song])

  const updateMutation = useMutation({
    mutationFn: async () => {
      return subsonic.songs.updateSong({
        id: song.id,
        ...formData,
      })
    },
    onSuccess: () => {
      toast({
        title: t('metadata.edit.success'),
        variant: 'default',
      })
      queryClient.invalidateQueries({ queryKey: [queryKeys.song.info, song.id] })
      queryClient.invalidateQueries({ queryKey: [queryKeys.album.single] })
      setOpen(false)
    },
    onError: () => {
      toast({
        title: t('metadata.edit.error'),
        variant: 'destructive',
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Pencil className="h-4 w-4" />
          {t('metadata.edit.button')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[600px]" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{t('metadata.edit.title')}</DialogTitle>
          <DialogDescription>{t('metadata.edit.description')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <ScrollArea className="max-h-[500px] pr-4">
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">{t('table.columns.title')}</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="artist">{t('table.columns.artist')}</Label>
                <Input
                  id="artist"
                  value={formData.artist}
                  onChange={(e) =>
                    setFormData({ ...formData, artist: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="album">{t('table.columns.album')}</Label>
                <Input
                  id="album"
                  value={formData.album}
                  onChange={(e) =>
                    setFormData({ ...formData, album: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="albumArtist">
                  {t('table.columns.albumArtist')}
                </Label>
                <Input
                  id="albumArtist"
                  value={formData.albumArtist}
                  onChange={(e) =>
                    setFormData({ ...formData, albumArtist: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="year">{t('table.columns.year')}</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        year: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    min={1900}
                    max={new Date().getFullYear() + 1}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="genre">{t('table.columns.genres')}</Label>
                  <Input
                    id="genre"
                    value={formData.genre}
                    onChange={(e) =>
                      setFormData({ ...formData, genre: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="track">{t('table.columns.track')}</Label>
                  <Input
                    id="track"
                    type="number"
                    value={formData.track || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        track: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    min={1}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="discNumber">
                    {t('table.columns.discNumber')}
                  </Label>
                  <Input
                    id="discNumber"
                    type="number"
                    value={formData.discNumber || 1}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discNumber: parseInt(e.target.value) || 1,
                      })
                    }
                    min={1}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="bpm">{t('table.columns.bpm')}</Label>
                  <Input
                    id="bpm"
                    type="number"
                    value={formData.bpm || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bpm: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    min={1}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="comment">{t('table.columns.comment')}</Label>
                <Textarea
                  id="comment"
                  value={formData.comment}
                  onChange={(e) =>
                    setFormData({ ...formData, comment: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={updateMutation.isPending}
            >
              {t('logout.dialog.cancel')}
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t('metadata.edit.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
