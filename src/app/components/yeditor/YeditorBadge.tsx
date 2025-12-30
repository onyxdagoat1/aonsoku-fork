import { Check, User } from 'lucide-react'
import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/app/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/app/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { type Yeditor } from '@/service/yeditorService'

interface YeditorBadgeProps {
  yeditor:
    | Yeditor
    | {
        id: string
        name: string
        is_verified?: boolean
        avatar_url?: string | null
      }
  showAvatar?: boolean
  linkToProfile?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function YeditorBadge({
  yeditor,
  showAvatar = true,
  linkToProfile = true,
  size = 'sm',
  className,
}: YeditorBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  const avatarSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  const content = (
    <Badge
      variant="secondary"
      className={cn(
        'inline-flex items-center gap-1.5 font-normal',
        sizeClasses[size],
        linkToProfile && 'hover:bg-secondary/80 cursor-pointer',
        className,
      )}
    >
      {showAvatar &&
        (yeditor.avatar_url ? (
          <img
            src={yeditor.avatar_url}
            alt=""
            className={cn('rounded-full', avatarSizes[size])}
          />
        ) : (
          <User className={cn('text-muted-foreground', avatarSizes[size])} />
        ))}
      <span>{yeditor.name}</span>
      {yeditor.is_verified && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Check className="w-3 h-3 text-primary" />
          </TooltipTrigger>
          <TooltipContent>Verified Editor</TooltipContent>
        </Tooltip>
      )}
    </Badge>
  )

  if (linkToProfile) {
    return (
      <Link to={`/yeditor/${yeditor.id}`} className="inline-block">
        {content}
      </Link>
    )
  }

  return content
}

// Inline version for displaying next to artist name
interface YeditorInlineProps {
  yeditor: Yeditor | { id: string; name: string; is_verified?: boolean }
  linkToProfile?: boolean
  className?: string
}

export function YeditorInline({
  yeditor,
  linkToProfile = true,
  className,
}: YeditorInlineProps) {
  const content = (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-muted-foreground',
        linkToProfile && 'hover:text-foreground hover:underline cursor-pointer',
        className,
      )}
    >
      <span>by</span>
      <span className="font-medium">{yeditor.name}</span>
      {yeditor.is_verified && <Check className="w-3 h-3 text-primary" />}
    </span>
  )

  if (linkToProfile) {
    return <Link to={`/yeditor/${yeditor.id}`}>{content}</Link>
  }

  return content
}

// Combined artist and yeditor display
interface ArtistYeditorDisplayProps {
  artist: ReactNode
  yeditor?: Yeditor | { id: string; name: string; is_verified?: boolean } | null
  className?: string
  inline?: boolean
}

export function ArtistYeditorDisplay({
  artist,
  yeditor,
  className,
  inline = false,
}: ArtistYeditorDisplayProps) {
  return (
    <div
      className={cn('flex items-center gap-2', !inline && 'text-sm', className)}
    >
      {artist}
      {yeditor && (
        <>
          <span className="text-muted-foreground">•</span>
          <YeditorInline yeditor={yeditor} />
        </>
      )}
    </div>
  )
}
