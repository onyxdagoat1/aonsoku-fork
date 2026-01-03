import { BadgeCheck, ShieldCheck, Star } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/components/ui/tooltip'
import { cn } from '@/lib/utils'

export type VerificationType =
  | 'artist'
  | 'contributor'
  | 'staff'
  | 'admin'
  | 'verified'
  | 'yeditor'

interface VerifiedBadgeProps {
  type?: VerificationType | null
  className?: string
  showLabel?: boolean
}

export function VerifiedBadge({
  type,
  className,
  showLabel = false,
}: VerifiedBadgeProps) {
  if (!type) return null

  const config = {
    artist: {
      icon: BadgeCheck,
      color: 'text-purple-500',
      fill: 'fill-purple-500/20',
      label: 'Verified Artist',
      description: 'Official Artist Profile',
    },
    staff: {
      icon: ShieldCheck,
      color: 'text-yellow-500',
      fill: 'fill-yellow-500/20',
      label: 'Staff',
      description: 'Official Staff',
    },
    contributor: {
      icon: Star,
      color: 'text-blue-500',
      fill: 'fill-blue-500/20',
      label: 'Contributor',
      description: 'Top Contributor',
    },
    admin: {
      icon: ShieldCheck,
      color: 'text-amber-500',
      fill: 'fill-amber-500/20',
      label: 'Admin',
      description: '',
    },
    verified: {
      icon: BadgeCheck,
      color: 'text-blue-500',
      fill: 'fill-blue-500/20',
      label: 'Verified',
      description: '',
    },
    yeditor: {
      icon: BadgeCheck,
      color: 'text-blue-500',
      fill: 'fill-blue-500/20',
      label: 'Verified Yeditor',
      description: '',
    },
  }

  const badge = config[type as keyof typeof config]
  if (!badge) return null
  const Icon = badge.icon

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'inline-flex items-center gap-1.5 cursor-help',
              className,
            )}
          >
            <Icon
              className={cn('w-5 h-5 drop-shadow-sm', badge.color, badge.fill)}
            />
            {showLabel && (
              <span className={cn('text-xs font-semibold', badge.color)}>
                {badge.label}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-semibold">{badge.label}</p>
          {badge.description && (
            <p className="text-xs text-muted-foreground">{badge.description}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
