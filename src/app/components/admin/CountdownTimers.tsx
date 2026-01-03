import { useState, useEffect } from 'react'
import { Clock, Calendar, Music, Bell, Sparkles, Timer, AlertCircle } from 'lucide-react'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import { supabase } from '@/lib/supabase'

interface CountdownTimer {
  id: string
  title: string
  description: string
  target_date: string
  type: 'album_release' | 'party_start' | 'event' | 'countdown'
  cover_image?: string
  artist?: string
  album?: string
  party_name?: string
  is_active: boolean
  notification_sent: boolean
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function CountdownTimers() {
  const [timers, setTimers] = useState<CountdownTimer[]>([])
  const [timeLeft, setTimeLeft] = useState<Record<string, TimeLeft>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTimers()
    const interval = setInterval(updateCountdowns, 1000)
    return () => clearInterval(interval)
  }, [])

  const loadTimers = async () => {
    setLoading(true)
    try {
      const nowIso = new Date().toISOString()

      const [{ data: highlights }, { data: parties }] = await Promise.all([
        supabase
          .from('highlights')
          .select('id,title,subtitle,description,image_url,countdown_date,metadata,type,content_type,content_id')
          .not('countdown_date', 'is', null)
          .eq('is_active', true)
          .gt('countdown_date', nowIso)
          .order('countdown_date', { ascending: true })
          .limit(50),
        supabase
          .from('parties')
          .select('id,name,description,scheduled_for,is_private,is_live')
          .not('scheduled_for', 'is', null)
          .gt('scheduled_for', nowIso)
          .order('scheduled_for', { ascending: true })
          .limit(50),
      ])

      const highlightTimers: CountdownTimer[] = (highlights || []).map((h: any) => ({
        id: `highlight-${h.id}`,
        title: h.title,
        description: h.description || h.subtitle || '',
        target_date: h.countdown_date,
        type: 'countdown',
        cover_image: h.image_url || undefined,
        artist: undefined,
        album: undefined,
        party_name: undefined,
        is_active: true,
        notification_sent: false,
      }))

      const partyTimers: CountdownTimer[] = (parties || []).map((p: any) => ({
        id: `party-${p.id}`,
        title: p.name,
        description: p.description || '',
        target_date: p.scheduled_for,
        type: 'party_start',
        cover_image: undefined,
        artist: undefined,
        album: undefined,
        party_name: p.name,
        is_active: true,
        notification_sent: false,
      }))

      setTimers([...partyTimers, ...highlightTimers])
    } catch (error) {
      console.error('Error loading timers:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateCountdowns = () => {
    const newTimeLeft: Record<string, TimeLeft> = {}
    
    timers.forEach((timer) => {
      const now = new Date().getTime()
      const target = new Date(timer.target_date).getTime()
      const difference = target - now

      if (difference > 0) {
        newTimeLeft[timer.id] = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        }
      } else {
        newTimeLeft[timer.id] = { days: 0, hours: 0, minutes: 0, seconds: 0 }
      }
    })
    
    setTimeLeft(newTimeLeft)
  }

  const formatTime = (time: TimeLeft) => {
    const parts: string[] = []
    if (time.days > 0) parts.push(`${time.days}d`)
    if (time.hours > 0) parts.push(`${time.hours}h`)
    if (time.minutes > 0) parts.push(`${time.minutes}m`)
    if (time.seconds > 0 && parts.length < 3) parts.push(`${time.seconds}s`)
    return parts.join(' : ')
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'album_release':
        return <Music className="w-5 h-5 text-purple-400" />
      case 'party_start':
        return <Calendar className="w-5 h-5 text-emerald-400" />
      case 'event':
        return <Sparkles className="w-5 h-5 text-orange-400" />
      case 'countdown':
        return <Timer className="w-5 h-5 text-blue-400" />
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'album_release':
        return <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">Album Release</Badge>
      case 'party_start':
        return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Party Start</Badge>
      case 'event':
        return <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20">Event</Badge>
      case 'countdown':
        return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Countdown</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const isExpired = (timer: CountdownTimer) => {
    const time = timeLeft[timer.id]
    return !time || (time.days === 0 && time.hours === 0 && time.minutes === 0 && time.seconds === 0)
  }

  const handleSetReminder = (timerId: string) => {
    // In a real implementation, this would set up browser notifications
    alert(`Reminder set for ${timerId}! You will be notified when this event starts.`)
  }

  const TimerCard = ({ timer }: { timer: CountdownTimer }) => {
    const time = timeLeft[timer.id]
    const expired = isExpired(timer)

    return (
      <div className={`bg-card/50 border border-border rounded-xl p-4 transition-all ${
        expired ? 'opacity-50' : 'hover:border-primary/50'
      }`}>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {timer.cover_image ? (
              <div className="w-16 h-16 rounded-lg overflow-hidden">
                <img
                  src={timer.cover_image}
                  alt={timer.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                {getTypeIcon(timer.type)}
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-foreground truncate">{timer.title}</h3>
              {getTypeBadge(timer.type)}
              {expired && (
                <Badge variant="outline" className="text-xs">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Ended
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mb-2">{timer.description}</p>
            
            {(timer.artist || timer.album || timer.party_name) && (
              <div className="text-xs text-muted-foreground mb-3">
                {timer.artist && <span>{timer.artist}</span>}
                {timer.artist && timer.album && <span> • </span>}
                {timer.album && <span>{timer.album}</span>}
                {timer.party_name && <span>{timer.party_name}</span>}
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className={`font-mono text-sm ${
                  expired ? 'text-muted-foreground' : 'text-foreground'
                }`}>
                  {time ? formatTime(time) : 'Loading...'}
                </span>
              </div>
              
              {!expired && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSetReminder(timer.id)}
                  className="text-xs"
                >
                  <Bell className="w-3 h-3 mr-1" />
                  Remind
                </Button>
              )}
            </div>
            
            {expired && (
              <div className="mt-2 text-xs text-muted-foreground">
                This event has ended
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const activeTimers = timers.filter(t => !isExpired(t))
  const expiredTimers = timers.filter(t => isExpired(t))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Timer className="w-5 h-5 text-primary" />
          Countdown Timers
        </h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{activeTimers.length} active</span>
          <span>•</span>
          <span>{expiredTimers.length} ended</span>
        </div>
      </div>

      {/* Active Timers */}
      {activeTimers.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Active Countdowns
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeTimers.map((timer) => (
              <TimerCard key={timer.id} timer={timer} />
            ))}
          </div>
        </div>
      )}

      {/* Expired Timers */}
      {expiredTimers.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Recently Ended
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60">
            {expiredTimers.map((timer) => (
              <TimerCard key={timer.id} timer={timer} />
            ))}
          </div>
        </div>
      )}

      {timers.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Timer className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No countdown timers</h3>
          <p>No upcoming events or releases scheduled</p>
        </div>
      )}
    </div>
  )
}
