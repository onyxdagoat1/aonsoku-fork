import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import {
  Users,
  Calendar,
  Music,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Lock,
  PlayCircle,
  Settings,
  Eye,
  Radio,
  Activity,
} from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { CountdownTimers } from './CountdownTimers'

interface Party {
  id: string
  name: string
  description: string
  host_id: string
  host_name: string
  is_live: boolean
  is_private: boolean
  password?: string
  current_track?: string
  attendee_count: number
  max_attendees: number
  created_at: string
  scheduled_for?: string
  queue_locked: boolean
}

interface PartyActivity {
  id: string
  party_id: string
  user_id: string
  username: string
  action: 'join' | 'leave' | 'track_request' | 'vote' | 'chat'
  message?: string
  track_name?: string
  vote_type?: 'up' | 'down'
  created_at: string
}

export function PartySystemManagement() {
  useAuth()
  const [activeTab, setActiveTab] = useState<'live' | 'scheduled' | 'activity' | 'countdowns'>('live')
  const [parties, setParties] = useState<Party[]>([])
  const [activities, setActivities] = useState<PartyActivity[]>([])
  const [stats, setStats] = useState({
    totalParties: 0,
    liveParties: 0,
    totalAttendees: 0,
    scheduledEvents: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPartyData()
  }, [])

  const loadPartyData = async () => {
    setLoading(true)
    try {
      const { data: partyRows, error } = await supabase
        .from('parties')
        .select('id,name,description,host_id,is_live,is_private,max_attendees,created_at,scheduled_for,queue_locked,current_track')
        .order('created_at', { ascending: false })

      if (error) throw error

      const partyIds = (partyRows || []).map((p: any) => p.id)
      const hostIds = Array.from(new Set((partyRows || []).map((p: any) => p.host_id)))

      const [{ data: members }, { data: hosts }] = await Promise.all([
        partyIds.length
          ? supabase.from('party_members').select('party_id').in('party_id', partyIds)
          : Promise.resolve({ data: [] as any[] }),
        hostIds.length
          ? supabase
              .from('profiles')
              .select('id,username,display_name')
              .in('id', hostIds)
          : Promise.resolve({ data: [] as any[] }),
      ])

      const hostMap = new Map((hosts || []).map((h: any) => [h.id, h] as const))
      const attendeeCounts = (members || []).reduce((acc: Record<string, number>, r: any) => {
        acc[r.party_id] = (acc[r.party_id] || 0) + 1
        return acc
      }, {})

      const mappedParties: Party[] = (partyRows || []).map((p: any) => {
        const host = hostMap.get(p.host_id)
        const hostName = host?.display_name || host?.username || 'Unknown'
        const current = p.current_track as any
        const currentTrackText =
          current && typeof current === 'object'
            ? `${current.title || 'Unknown'}${current.artist ? ` - ${current.artist}` : ''}`
            : null

        return {
          id: p.id,
          name: p.name,
          description: p.description || '',
          host_id: p.host_id,
          host_name: hostName,
          is_live: !!p.is_live,
          is_private: !!p.is_private,
          current_track: currentTrackText || undefined,
          attendee_count: attendeeCounts[p.id] || 0,
          max_attendees: p.max_attendees,
          created_at: p.created_at,
          scheduled_for: p.scheduled_for || undefined,
          queue_locked: !!p.queue_locked,
        }
      })

      setParties(mappedParties)

      // Activity feed from real tables
      const [{ data: messages }, { data: queueItems }] = await Promise.all([
        supabase
          .from('party_messages')
          .select('id,party_id,user_id,message,created_at')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('party_queue_items')
          .select('id,party_id,requested_by,title,artist,created_at')
          .order('created_at', { ascending: false })
          .limit(20),
      ])

      const actorIds = Array.from(
        new Set([
          ...(messages || []).map((m: any) => m.user_id),
          ...(queueItems || []).map((q: any) => q.requested_by),
        ]),
      )

      const { data: actorProfiles } = actorIds.length
        ? await supabase
            .from('profiles')
            .select('id,username,display_name')
            .in('id', actorIds)
        : { data: [] as any[] }

      const actorMap = new Map(
        (actorProfiles || []).map((a: any) => [a.id, a] as const),
      )

      const msgActivities: PartyActivity[] = (messages || []).map((m: any) => {
        const a = actorMap.get(m.user_id)
        return {
          id: m.id,
          party_id: m.party_id,
          user_id: m.user_id,
          username: a?.display_name || a?.username || 'Unknown',
          action: 'chat',
          message: m.message,
          created_at: m.created_at,
        }
      })

      const queueActivities: PartyActivity[] = (queueItems || []).map((q: any) => {
        const a = actorMap.get(q.requested_by)
        return {
          id: q.id,
          party_id: q.party_id,
          user_id: q.requested_by,
          username: a?.display_name || a?.username || 'Unknown',
          action: 'track_request',
          track_name: `${q.title || 'Unknown'}${q.artist ? ` - ${q.artist}` : ''}`,
          created_at: q.created_at,
        }
      })

      const merged = [...msgActivities, ...queueActivities]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 30)

      setActivities(merged)

      const liveParties = mappedParties.filter((p) => p.is_live).length
      const totalAttendees = mappedParties.reduce((sum, p) => sum + p.attendee_count, 0)
      const scheduledEvents = mappedParties.filter((p) => !p.is_live && p.scheduled_for).length

      setStats({
        totalParties: mappedParties.length,
        liveParties,
        totalAttendees,
        scheduledEvents,
      })
    } catch (error) {
      console.error('Error loading party data:', error)
      toast.error('Failed to load party data')
    } finally {
      setLoading(false)
    }
  }

  const handleEndParty = async (partyId: string) => {
    if (!window.confirm('Are you sure you want to end this party?')) return

    try {
      const { error } = await supabase.from('parties').delete().eq('id', partyId)
      if (error) throw error
      await loadPartyData()
      toast.success('Party ended successfully')
    } catch (error) {
      console.error('Error ending party:', error)
      toast.error('Failed to end party')
    }
  }

  const handleToggleQueue = async (partyId: string) => {
    try {
      const party = parties.find((p) => p.id === partyId)
      if (!party) return

      const { error } = await supabase
        .from('parties')
        .update({ queue_locked: !party.queue_locked })
        .eq('id', partyId)

      if (error) throw error
      await loadPartyData()
      toast.success('Queue settings updated')
    } catch (error) {
      console.error('Error toggling queue:', error)
      toast.error('Failed to update queue settings')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Party System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card/50 border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Radio className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Parties</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalParties}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-card/50 border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <PlayCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Live Now</p>
              <p className="text-2xl font-bold text-foreground">{stats.liveParties}</p>
            </div>
          </div>
        </div>

        <div className="bg-card/50 border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Attendees</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalAttendees}</p>
            </div>
          </div>
        </div>

        <div className="bg-card/50 border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Scheduled</p>
              <p className="text-2xl font-bold text-foreground">{stats.scheduledEvents}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Party Tabs */}
      <div className="bg-card/50 border border-border rounded-2xl">
        <div className="border-b border-border">
          <div className="flex items-center gap-1 p-1">
            <button
              onClick={() => setActiveTab('live')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'live'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <PlayCircle className="w-4 h-4 inline mr-2" />
              Live Parties ({stats.liveParties})
            </button>
            <button
              onClick={() => setActiveTab('scheduled')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'scheduled'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              Scheduled ({stats.scheduledEvents})
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'activity'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <Activity className="w-4 h-4 inline mr-2" />
              Activity Feed
            </button>
            <button
              onClick={() => setActiveTab('countdowns')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'countdowns'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-2" />
              Countdowns
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'live' && (
            <div className="space-y-4">
              {parties.filter(p => p.is_live).map((party) => (
                <div key={party.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-foreground">{party.name}</h3>
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400">
                          <div className="w-2 h-2 rounded-full bg-emerald-400 mr-1 animate-pulse"></div>
                          LIVE
                        </Badge>
                        {party.is_private && (
                          <Badge variant="outline" className="text-xs">
                            <Lock className="w-3 h-3 mr-1" />
                            Private
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{party.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Host: {party.host_name}</span>
                        <span>•</span>
                        <span>{party.attendee_count}/{party.max_attendees} attendees</span>
                      </div>
                      {party.current_track && (
                        <div className="mt-3 p-2 bg-black/20 rounded-lg flex items-center gap-2">
                          <Music className="w-4 h-4 text-primary" />
                          <span className="text-sm text-foreground">Now Playing: {party.current_track}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleQueue(party.id)}
                        className="text-xs"
                      >
                        {party.queue_locked ? 'Unlock Queue' : 'Lock Queue'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleEndParty(party.id)}
                        className="text-xs"
                      >
                        End Party
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {stats.liveParties === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <PlayCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No live parties right now</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'scheduled' && (
            <div className="space-y-4">
              {parties.filter(p => !p.is_live && p.scheduled_for).map((party) => (
                <div key={party.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-foreground">{party.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          Scheduled
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{party.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Host: {party.host_name}</span>
                        <span>•</span>
                        <span>Max {party.max_attendees} attendees</span>
                        <span>•</span>
                        <span>
                          Starts {new Date(party.scheduled_for!).toLocaleDateString()} at{' '}
                          {new Date(party.scheduled_for!).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button size="sm" variant="outline" className="text-xs">
                        <Eye className="w-3 h-3 mr-1" />
                        Preview
                      </Button>
                      <Button size="sm" className="text-xs">
                        <Settings className="w-3 h-3 mr-1" />
                        Manage
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {stats.scheduledEvents === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No scheduled parties</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-3 bg-card/50 rounded-lg">
                  <div className="flex-shrink-0">
                    {activity.action === 'join' && <Users className="w-4 h-4 text-emerald-400" />}
                    {activity.action === 'leave' && <Users className="w-4 h-4 text-red-400" />}
                    {activity.action === 'track_request' && <Music className="w-4 h-4 text-blue-400" />}
                    {activity.action === 'vote' && (
                      activity.vote_type === 'up' ? 
                        <ThumbsUp className="w-4 h-4 text-emerald-400" /> : 
                        <ThumbsDown className="w-4 h-4 text-red-400" />
                    )}
                    {activity.action === 'chat' && <MessageSquare className="w-4 h-4 text-purple-400" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{activity.username}</span>
                      {activity.action === 'join' && ' joined the party'}
                      {activity.action === 'leave' && ' left the party'}
                      {activity.action === 'track_request' && ` requested "${activity.track_name}"`}
                      {activity.action === 'vote' && ` voted ${activity.vote_type} on a track`}
                      {activity.action === 'chat' && ` said: "${activity.message}"`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {activities.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'countdowns' && <CountdownTimers />}
        </div>
      </div>
    </div>
  )
}
