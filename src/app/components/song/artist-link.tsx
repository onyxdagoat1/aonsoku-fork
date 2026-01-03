import clsx from 'clsx'
import { RefAttributes } from 'react'
import { Link, LinkProps } from 'react-router-dom'
import { Dot } from '@/app/components/dot'
import {
  VerificationType,
  VerifiedBadge,
} from '@/app/components/ui/VerifiedBadge'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/routes/routesList'
import { IFeaturedArtist } from '@/types/responses/artist'
import { TABLE_ARTISTS_MAX_NUMBER } from '@/utils/multipleArtists'

interface ArtistLinkProps {
  artistId: string
  className?: string
  children: React.ReactNode
  onClick?: (e: React.MouseEvent) => void
  verificationType?: VerificationType | null
}

export const ArtistLink = ({
  artistId,
  className,
  children,
  onClick,
  verificationType,
}: ArtistLinkProps) => {
  return (
    <Link
      to={ROUTES.ARTIST.PAGE(artistId)}
      className={`hover:underline hover:text-primary transition-colors inline-flex items-center gap-1 ${className}`}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.(e)
      }}
    >
      {children}
      {verificationType && (
        <VerifiedBadge type={verificationType} className="w-3.5 h-3.5" />
      )}
    </Link>
  )
}

type ArtistsLinksProps = {
  artists: IFeaturedArtist[]
  onClickLink?: () => void
}

export function ArtistsLinks({ artists, onClickLink }: ArtistsLinksProps) {
  const data = artists.slice(0, TABLE_ARTISTS_MAX_NUMBER)
  const showThreeDots = artists.length > TABLE_ARTISTS_MAX_NUMBER

  function showDot(index: number) {
    return index < artists.length - 1
  }

  function showTitle(index: number, name: string) {
    return index > 0 ? name : undefined
  }

  return (
    <div className="flex items-center truncate">
      {data.map(({ id, name }, index) => (
        <div
          key={id}
          className={clsx('flex items-center', index > 0 && 'truncate')}
        >
          <ArtistLink
            artistId={id}
            title={showTitle(index, name)}
            onClick={() => {
              if (onClickLink) onClickLink()
            }}
          >
            {name}
          </ArtistLink>
          {showDot(index) && <Dot />}
        </div>
      ))}
      {showThreeDots && <span>...</span>}
    </div>
  )
}
