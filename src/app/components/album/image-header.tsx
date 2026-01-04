import randomCSSHexColor from '@chriscodesthings/random-css-hex-color'
import clsx from 'clsx'
import { Info } from 'lucide-react'
import { useState } from 'react'
import { LazyLoadImage } from 'react-lazy-load-image-component'

import { getCoverArtUrl } from '@/api/httpClient'
import { AlbumComment } from '@/app/components/album/comment'
import { AlbumHeaderFallback } from '@/app/components/fallbacks/album-fallbacks'
import { BadgesData, HeaderInfoGenerator } from '@/app/components/header-info'
import { CustomLightBox } from '@/app/components/lightbox'
import { Button } from '@/app/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import { ScrollArea } from '@/app/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { CoverArt } from '@/types/coverArtType'
import { IFeaturedArtist } from '@/types/responses/artist'
import { getAverageColor } from '@/utils/getAverageColor'
import { getTextSizeClass } from '@/utils/getTextSizeClass'
import { AlbumArtistInfo, AlbumMultipleArtistsInfo } from './artists'

interface ImageHeaderProps {
  type: string
  title: string
  subtitle?: string
  artistId?: string
  artists?: IFeaturedArtist[]
  coverArtId?: string
  coverArtType: CoverArt
  coverArtSize: string
  coverArtAlt: string
  badges: BadgesData
  isPlaylist?: boolean
  description?: string
  onColorExtracted?: (color: string) => void
}

export default function ImageHeader({
  type,
  title,
  subtitle,
  artistId,
  artists,
  coverArtId,
  coverArtType,
  coverArtSize,
  coverArtAlt,
  badges,
  isPlaylist = false,
  description,
  onColorExtracted,
}: ImageHeaderProps) {
  const [loaded, setLoaded] = useState(false)
  const [open, setOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const [bgColor, setBgColor] = useState('')

  function getImage() {
    return document.getElementById('cover-art-image') as HTMLImageElement
  }

  async function handleLoadImage() {
    const img = getImage()
    if (!img) return

    let color = randomCSSHexColor(true)

    try {
      color = (await getAverageColor(img)).hex
    } catch (_) {
      console.warn(
        'handleLoadImage: unable to get image color. Using a random color.',
      )
    }

    setBgColor(color)
    onColorExtracted?.(color)
    setLoaded(true)
  }

  function handleError() {
    const img = getImage()
    if (!img) return

    img.crossOrigin = null

    setLoaded(true)
  }

  const hasMultipleArtists = artists ? artists.length > 1 : false
  const coverArtUrl = getCoverArtUrl(coverArtId, coverArtType, coverArtSize)

  return (
    <div
      className="flex relative w-full h-[calc(3rem+220px)] 2xl:h-[calc(3rem+280px)]"
      key={`header-${coverArtId}`}
    >
      {!loaded && (
        <div className="absolute inset-0 z-20">
          <AlbumHeaderFallback />
        </div>
      )}

      {/* Blurred Background Layer */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-[-20%] z-0"
          style={{
            backgroundImage: `url(${coverArtUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(80px) saturate(150%) brightness(0.5)',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.5s ease-in-out',
          }}
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-background/70 to-background z-10" />
      </div>

      {/* Content Container */}
      <div className={cn('w-full px-8 py-6 flex gap-6 relative z-20')}>
        {/* Album Art */}
        <div
          className={cn(
            'w-[200px] h-[200px] min-w-[200px] min-h-[200px]',
            '2xl:w-[250px] 2xl:h-[250px] 2xl:min-w-[250px] 2xl:min-h-[250px]',
            'bg-skeleton aspect-square bg-cover bg-center rounded-lg',
            'shadow-2xl overflow-hidden',
            'hover:scale-[1.02] ease-linear duration-200 transition-transform',
            'ring-1 ring-white/10',
          )}
        >
          <LazyLoadImage
            key={coverArtId}
            effect="opacity"
            crossOrigin="anonymous"
            id="cover-art-image"
            src={coverArtUrl}
            alt={coverArtAlt}
            className="aspect-square object-cover w-full h-full cursor-pointer"
            width="100%"
            height="100%"
            onLoad={handleLoadImage}
            onError={handleError}
            onClick={() => setOpen(true)}
          />
        </div>

        {/* Text Content */}
        <div className="flex w-full max-w-[calc(100%-232px)] 2xl:max-w-[calc(100%-282px)] flex-col justify-end z-10">
          <p className="text-xs 2xl:text-sm font-medium text-white/70 uppercase tracking-wider mb-1">
            {type}
          </p>
          <h1
            className={clsx(
              'max-w-full scroll-m-20 font-bold tracking-tight antialiased text-white break-words line-clamp-2 mb-3',
              getTextSizeClass(title),
            )}
          >
            {title}
          </h1>

          {!isPlaylist && artists && hasMultipleArtists && (
            <div className="flex items-center flex-wrap gap-2">
              <AlbumMultipleArtistsInfo artists={artists} />
              <HeaderInfoGenerator badges={badges} />
            </div>
          )}

          {!isPlaylist && subtitle && !hasMultipleArtists && (
            <>
              {artistId ? (
                <div className="flex items-center flex-wrap gap-2">
                  <AlbumArtistInfo id={artistId} name={subtitle} />
                  <HeaderInfoGenerator badges={badges} />
                </div>
              ) : (
                <p className="opacity-80 text-sm font-medium">{subtitle}</p>
              )}
            </>
          )}

          {isPlaylist && subtitle && (
            <>
              <p className="text-sm text-white/70 line-clamp-2 mt-1 mb-2">
                {subtitle}
              </p>
              <HeaderInfoGenerator badges={badges} showFirstDot={false} />
            </>
          )}

          {!subtitle && (
            <div className="mt-1">
              <HeaderInfoGenerator badges={badges} showFirstDot={false} />
            </div>
          )}

          {description && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="mt-2 text-white/70 hover:text-white hover:bg-white/10"
                onClick={() => setInfoOpen(true)}
              >
                <Info className="w-5 h-5" />
              </Button>

              <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
                <DialogContent className="max-w-xl max-h-[80vh] flex flex-col z-50 bg-background/95 backdrop-blur-xl border-white/10">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold">
                      About {title}
                    </DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="flex-1 pr-4">
                    <AlbumComment comment={description} />
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      <CustomLightBox
        open={open}
        close={setOpen}
        src={coverArtUrl}
        alt={coverArtAlt}
      />
    </div>
  )
}
