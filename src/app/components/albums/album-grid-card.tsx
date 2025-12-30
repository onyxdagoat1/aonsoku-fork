import { MoreVertical, Plus } from 'lucide-react'
import { memo, useEffect, useState } from 'react'
import { getCoverArtUrl } from '@/api/httpClient'
import { AddToCollectionDialog } from '@/app/components/collections/add-to-collection-dialog'
import { PreviewCard } from '@/app/components/preview-card/card'
import { Button } from '@/app/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu'
import { YeditorInline } from '@/app/components/yeditor/YeditorBadge'
import { useGetYeditorForContent } from '@/app/hooks/use-yeditor'
import { getEraColor, getEraLabel } from '@/config/eras'
import { ROUTES } from '@/routes/routesList'
import { eraService } from '@/service/eraService'
import { subsonic } from '@/service/subsonic'
import { usePlayerActions } from '@/store/player.store'
import { Albums } from '@/types/responses/album'

type AlbumCardProps = {
  album: Albums & { countdownDate?: string }
}

function CountdownTimer({ date }: { date: string }) {
  const [timeLeft, setTimeLeft] = useState<string>('')

  useEffect(() => {
    const target = new Date(date).getTime()

    const update = () => {
      const now = new Date().getTime()
      const diff = target - now

      if (diff <= 0) {
        setTimeLeft('Released')
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      )
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const secs = Math.floor((diff % (1000 * 60)) / 1000)

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h`)
      } else {
        setTimeLeft(`${hours}h ${mins}m ${secs}s`)
      }
    }

    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [date])

  return (
    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-mono text-white z-10">
      {timeLeft}
    </div>
  )
}

function AlbumCard({ album }: AlbumCardProps) {
  const { setSongList } = usePlayerActions()
  const [showAddDialog, setShowAddDialog] = useState(false)

  const contentType =
    album.songCount === 1
      ? 'single'
      : album.isCompilation
        ? 'compilation'
        : 'album'

  const { data: yeditor } = useGetYeditorForContent(album.id, contentType)

  const [eraId, setEraId] = useState<string | undefined>(album.era)

  useEffect(() => {
    if (!eraId) {
      eraService
        .getEra(album.id, 'album')
        .then((era) => setEraId(era ?? undefined))
    }
  }, [album.id, eraId])

  async function handlePlayAlbum() {
    const response = await subsonic.albums.getOne(album.id)

    if (response) {
      setSongList(response.song, 0)
    }
  }

  return (
    <PreviewCard.Root>
      <PreviewCard.ImageWrapper link={ROUTES.ALBUM.PAGE(album.id)}>
        {album.countdownDate && <CountdownTimer date={album.countdownDate} />}

        <div className="absolute top-2 left-2 z-20">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full bg-black/20 hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  setShowAddDialog(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add to Collection
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <PreviewCard.Image
          src={getCoverArtUrl(album.coverArt, 'album', '300')}
          alt={album.name}
        />
        <PreviewCard.PlayButton onClick={handlePlayAlbum} />
      </PreviewCard.ImageWrapper>

      <AddToCollectionDialog
        contentId={album.id}
        contentType={contentType}
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />
      <PreviewCard.InfoWrapper>
        <PreviewCard.Title link={ROUTES.ALBUM.PAGE(album.id)}>
          {album.name}
        </PreviewCard.Title>
        <PreviewCard.Subtitle
          enableLink={album.artistId !== undefined}
          link={ROUTES.ARTIST.PAGE(album.artistId ?? '')}
        >
          <div className="flex flex-col gap-1">
            <span className="truncate">{album.artist}</span>
            <div className="flex items-center gap-2">
              {eraId && (
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider"
                  style={{ backgroundColor: getEraColor(eraId) }}
                >
                  {getEraLabel(eraId)}
                </span>
              )}
              {yeditor && (
                <YeditorInline yeditor={yeditor} className="text-[10px]" />
              )}
            </div>
          </div>
        </PreviewCard.Subtitle>
      </PreviewCard.InfoWrapper>
    </PreviewCard.Root>
  )
}

export const AlbumGridCard = memo(AlbumCard)
