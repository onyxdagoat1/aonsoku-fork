import { useState, useEffect } from 'react'
import { Clock, Music, Calendar, Sparkles, Timer, Bell, AlertCircle } from 'lucide-react'
import { ScheduledRelease, releasesService } from '@/service/releases.service'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import { Card } from '@/app/components/ui/card'

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

interface ReleaseCardProps {
  release: ScheduledRelease
}

export function ReleaseCard({ release }: ReleaseCardProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [isReminderSet, setIsReminderSet] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const target = new Date(release.scheduled_at).getTime()
      const difference = target - now

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        })
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(interval)
  }, [release.scheduled_at])

  const formatTime = (time: TimeLeft) => {
    const parts: string[] = []
    if (time.days > 0) parts.push(`${time.days}d`)
    if (time.hours > 0) parts.push(`${time.hours}h`)
    if (time.minutes > 0) parts.push(`${time.minutes}m`)
    if (time.seconds > 0) parts.push(`${time.seconds}s`)
    return parts.join(' : ') || 'Released'
  }

  const getTypeIcon = (type: string | null) => {
    switch (type) {
      case 'album':
      case 'single':
      case 'compilation':
      case 'edit':
        return <Music className="w-5 h-5 text-purple-400" />
      case 'event':
        return <Calendar className="w-5 h-5 text-emerald-400" />
      default:
        return <Timer className="w-5 h-5 text-blue-400" />
    }
  }

  const handleReminder = async () => {
    await releasesService.toggleReminder(release.id)
    setIsReminderSet(!isReminderSet)
  }

  const isExpired = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0

  return (
    <Card className={`overflow-hidden transition-all hover:border-primary/50 group ${isExpired ? 'opacity-75' : ''}`}>
      <div className="flex flex-col sm:flex-row h-full">
        {/* Cover Image */}
        <div className="relative w-full sm:w-48 h-48 sm:h-auto flex-shrink-0 bg-muted">
          {release.cover_art_url ? (
             <img 
               src={release.cover_art_url} 
               alt={release.title}
               className="w-full h-full object-cover"
             />
          ) : (
             <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
               {getTypeIcon(release.release_type)}
             </div>
          )}
          {release.release_type && (
            <div className="absolute top-2 left-2">
              <Badge variant="secondary" className="backdrop-blur-md bg-background/50 uppercase text-[10px]">
                {release.release_type}
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col">
          <div className="flex-1">
             <h3 className="text-xl font-bold truncate mb-1">{release.title}</h3>
             {release.artist_name && (
               <p className="text-muted-foreground font-medium mb-2">{release.artist_name}</p>
             )}
             {release.description && (
               <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{release.description}</p>
             )}
          </div>

          <div className="mt-auto pt-4 border-t flex items-center justify-between gap-4">
             <div className="flex items-center gap-2 font-mono text-lg text-primary">
               {isExpired ? (
                 <span className="flex items-center gap-2 text-muted-foreground text-sm font-sans">
                   <AlertCircle className="w-4 h-4" /> Released
                 </span>
               ) : (
                 <>
                   <Clock className="w-4 h-4 animate-pulse" />
                   <span>{formatTime(timeLeft)}</span>
                 </>
               )}
             </div>

             {!isExpired && (
               <Button 
                 size="sm" 
                 variant={isReminderSet ? "secondary" : "outline"}
                 onClick={handleReminder}
               >
                 <Bell className={`w-4 h-4 mr-2 ${isReminderSet ? 'fill-current' : ''}`} />
                 {isReminderSet ? 'Set' : 'Remind Me'}
               </Button>
             )}
          </div>
        </div>
      </div>
    </Card>
  )
}
