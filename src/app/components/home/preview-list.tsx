import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { getCoverArtUrl } from '@/api/httpClient'
import { PreviewCard } from '@/app/components/preview-card/card'
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from '@/app/components/ui/carousel'
import { CarouselButton } from '@/app/components/ui/carousel-button'
import { ROUTES } from '@/routes/routesList'
import { collectionService } from '@/service/collectionService'
import { subsonic } from '@/service/subsonic'
import { usePlayerActions } from '@/store/player.store'
import { ISong } from '@/types/responses/song'

export interface PreviewItem {
  id: string
  name: string
  artist: string
  coverArt: string
  artistId?: string
  type?: string
  isCollection?: boolean
  isSong?: boolean
  countdownDate?: string
}

interface PreviewListProps {
  list: PreviewItem[]
  title: string
  showMore?: boolean
  moreTitle?: string
  moreRoute?: string
  onSlideChange?: (index: number) => void
}

export default function PreviewList({
  list,
  title,
  showMore = true,
  moreTitle,
  moreRoute,
  onSlideChange,
}: PreviewListProps) {
  const [api, setApi] = useState<CarouselApi>()
  const [canScrollPrev, setCanScrollPrev] = useState<boolean>()
  const [canScrollNext, setCanScrollNext] = useState<boolean>()
  const { setSongList } = usePlayerActions()
  const { t } = useTranslation()

  moreTitle = moreTitle || t('generic.seeMore')

  if (list.length > 16) {
    list = list.slice(0, 16)
  }

  async function handlePlayAlbum(item: PreviewItem) {
    if (item.isCollection || item.type === 'collection') {
      // For collections, we need to fetch items first
      try {
        const data = await collectionService.getCollectionWithItems(item.id)
        if (data && data.items.length > 0) {
          // Flatten items into songs
          const songs: ISong[] = []
          for (const collectionItem of data.items) {
            if (collectionItem.content_type === 'song') {
              const song = await subsonic.songs.getSong(
                collectionItem.content_id,
              )
              if (song) songs.push(song)
            } else {
              const album = await subsonic.albums.getOne(
                collectionItem.content_id,
              )
              if (album && album.song) songs.push(...album.song)
            }
          }
          if (songs.length > 0) {
            setSongList(songs, 0)
          }
        }
      } catch (error) {
        console.error('Error playing collection:', error)
      }
      return
    }

    if (item.isSong || item.type === 'song') {
      const song = await subsonic.songs.getSong(item.id)
      if (song) {
        setSongList([song], 0)
      }
      return
    }

    const response = await subsonic.albums.getOne(item.id)

    if (response) {
      setSongList(response.song, 0)
    }
  }

  useEffect(() => {
    if (!api) {
      return
    }

    setCanScrollPrev(api.canScrollPrev())
    setCanScrollNext(api.canScrollNext())

    api.on('select', () => {
      setCanScrollPrev(api.canScrollPrev())
      setCanScrollNext(api.canScrollNext())
      if (onSlideChange) {
        onSlideChange(api.selectedScrollSnap())
      }
    })
  }, [api, onSlideChange])

  return (
    <div className="w-full flex flex-col mt-4">
      <div className="my-4 flex justify-between items-center">
        <h3
          className="scroll-m-20 text-2xl font-semibold tracking-tight"
          data-testid="preview-list-title"
        >
          {title}
        </h3>
        <div className="flex items-center gap-4">
          {showMore && moreRoute && (
            <Link to={moreRoute} data-testid="preview-list-show-more">
              <p className="leading-7 text-sm truncate hover:underline text-muted-foreground hover:text-primary">
                {moreTitle}
              </p>
            </Link>
          )}
          <div className="flex gap-2">
            <CarouselButton
              direction="prev"
              disabled={!canScrollPrev}
              onClick={() => api?.scrollPrev()}
              data-testid="preview-list-prev-button"
            />
            <CarouselButton
              direction="next"
              disabled={!canScrollNext}
              onClick={() => api?.scrollNext()}
              data-testid="preview-list-next-button"
            />
          </div>
        </div>
      </div>

      <div className="transform-gpu">
        <Carousel
          opts={{
            align: 'start',
            slidesToScroll: 'auto',
          }}
          setApi={setApi}
          data-testid="preview-list-carousel"
        >
          <CarouselContent>
            {list.map((item: PreviewItem, index) => {
              const isCollection =
                item.type === 'collection' || item.isCollection
              const isSong = item.type === 'song' || item.isSong

              let itemLink = ROUTES.ALBUM.PAGE(item.id)
              if (isCollection) itemLink = ROUTES.COLLECTION.PAGE(item.id)
              if (isSong) itemLink = '#' // Will play song on click

              return (
                <CarouselItem
                  key={item.id}
                  className="basis-1/6 2xl:basis-1/8"
                  data-testid={`preview-list-carousel-item-${index}`}
                >
                  <PreviewCard.Root>
                    <PreviewCard.ImageWrapper link={itemLink}>
                      {item.countdownDate && (
                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-mono text-white z-10">
                          Upcoming
                        </div>
                      )}
                      <PreviewCard.Image
                        src={getCoverArtUrl(
                          item.coverArt,
                          isSong ? 'song' : 'album',
                        )}
                        alt={item.name}
                      />
                      <PreviewCard.PlayButton
                        onClick={() => handlePlayAlbum(item)}
                      />
                    </PreviewCard.ImageWrapper>
                    <PreviewCard.InfoWrapper>
                      <PreviewCard.Title link={itemLink}>
                        {item.name}
                      </PreviewCard.Title>
                      <PreviewCard.Subtitle
                        enableLink={item.artistId !== undefined}
                        link={ROUTES.ARTIST.PAGE(item.artistId ?? '')}
                      >
                        {item.artist}
                      </PreviewCard.Subtitle>
                    </PreviewCard.InfoWrapper>
                  </PreviewCard.Root>
                </CarouselItem>
              )
            })}
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  )
}
