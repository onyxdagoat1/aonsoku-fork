import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import {
  Users,
  Music,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Plus,
  Send,
  Lock,
  Radio,
  Heart,
  Volume2,
  Play,
  Sparkles,
  Flame,
  Laugh,
  Frown,
} from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { subsonic } from '@/service/subsonic'

interface PartyRoom {
  id: string
  name: string
  description: string
  host_id: string
  host_name: string
  is_live: boolean
  is_private: boolean
  current_track?: {
    id: string
    title: string
    artist: string
    album: string
    duration: number
    cover_art?: string
  }
  attendees: Array<{
    id: string
    username: string
    avatar_url?: string
    is_host: boolean
  }>
  queue: Array<{
    id: string
    track_id: string
    title: string
    artist: string
    requested_by: string
    votes_up: number
    votes_down: number
  }>
  chat_messages: Array<{
    id: string
    user_id: string
    username: string
    message: string
    timestamp: string
  }>
  created_at: string
}

interface Reaction {
  emoji: string
  icon: React.ReactNode
  count: number
}

export function LivePartyRoom({ partyId }: { partyId: string }) {
  const { user } = useAuth()
  const [party, setParty] = useState<PartyRoom | null>(null)
  const [chatMessage, setChatMessage] = useState('')
  const [showEmojis, setShowEmojis] = useState(false)
  const [reactions, setReactions] = useState<Reaction[]>([
    { emoji: '❤️', icon: <Heart className="w-4 h-4" />, count: 0 },
    { emoji: '🔥', icon: <Flame className="w-4 h-4" />, count: 0 },
    { emoji: '✨', icon: <Sparkles className="w-4 h-4" />, count: 0 },
    { emoji: '😂', icon: <Laugh className="w-4 h-4" />, count: 0 },
    { emoji: '😮', icon: <Frown className="w-4 h-4" />, count: 0 },
  ])
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void ensureJoinedAndLoad()

    const channel = supabase
      .channel(`party-${partyId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'parties', filter: `id=eq.${partyId}` },
        () => void loadPartyData(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'party_members', filter: `party_id=eq.${partyId}` },
        () => void loadPartyData(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'party_messages', filter: `party_id=eq.${partyId}` },
        () => void loadPartyData(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'party_queue_items', filter: `party_id=eq.${partyId}` },
        () => void loadPartyData(),
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [partyId])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [party?.chat_messages])

  const ensureJoinedAndLoad = async () => {
    try {
      // Attempt to auto-join (public party or already member). For private parties,
      // the user should have joined from the lobby.
      const { data: member, error: memberError } = await supabase
        .from('party_members')
        .select('id')
        .eq('party_id', partyId)
        .eq('user_id', user?.id)
        .maybeSingle()

      if (memberError) {
        console.error('Error checking membership:', memberError)
      }

      if (!member && user?.id) {
        await supabase.rpc('join_party', { p_party_id: partyId, p_password: null })
      }
    } catch (error) {
      // Ignore auto-join failures here; party may be private.
    } finally {
      await loadPartyData()
    }
  }

  const loadPartyData = async () => {
    try {
      const { data: partyRow, error: partyError } = await supabase
        .from('parties')
        .select('id,name,description,host_id,is_live,is_private,current_track,created_at')
        .eq('id', partyId)
        .single()

      if (partyError) throw partyError

      const { data: hostProfile } = await supabase
        .from('profiles')
        .select('id,username,display_name,avatar_url')
        .eq('id', partyRow.host_id)
        .maybeSingle()

      const { data: members } = await supabase
        .from('party_members')
        .select('user_id,role')
        .eq('party_id', partyId)

      const memberIds = Array.from(new Set((members || []).map((m: any) => m.user_id)))
      const { data: memberProfiles } = memberIds.length
        ? await supabase
            .from('profiles')
            .select('id,username,display_name,avatar_url')
            .in('id', memberIds)
        : { data: [] as any[] }

      const profileMap = new Map(
        (memberProfiles || []).map((p: any) => [p.id, p] as const),
      )

      const attendees = (members || []).map((m: any) => {
        const p = profileMap.get(m.user_id)
        return {
          id: m.user_id,
          username: p?.display_name || p?.username || 'Unknown',
          avatar_url: p?.avatar_url || undefined,
          is_host: m.role === 'host',
        }
      })

      const { data: queueItems } = await supabase
        .from('party_queue_items')
        .select('id,track_id,title,artist,requested_by,created_at,status')
        .eq('party_id', partyId)
        .eq('status', 'queued')
        .order('created_at', { ascending: true })

      const queueItemIds = (queueItems || []).map((q: any) => q.id)
      const { data: votes } = queueItemIds.length
        ? await supabase
            .from('party_queue_votes')
            .select('queue_item_id,vote')
            .in('queue_item_id', queueItemIds)
        : { data: [] as any[] }

      const voteAgg = (votes || []).reduce(
        (acc: Record<string, { up: number; down: number }>, v: any) => {
          acc[v.queue_item_id] = acc[v.queue_item_id] || { up: 0, down: 0 }
          if (v.vote === 1) acc[v.queue_item_id].up += 1
          if (v.vote === -1) acc[v.queue_item_id].down += 1
          return acc
        },
        {},
      )

      const queue = (queueItems || []).map((q: any) => {
        const requester = profileMap.get(q.requested_by)
        const counts = voteAgg[q.id] || { up: 0, down: 0 }
        return {
          id: q.id,
          track_id: q.track_id,
          title: q.title || 'Unknown',
          artist: q.artist || 'Unknown',
          requested_by: requester?.display_name || requester?.username || 'Unknown',
          votes_up: counts.up,
          votes_down: counts.down,
        }
      })

      const { data: messages } = await supabase
        .from('party_messages')
        .select('id,user_id,message,created_at')
        .eq('party_id', partyId)
        .order('created_at', { ascending: true })
        .limit(100)

      const messageUserIds = Array.from(
        new Set((messages || []).map((m: any) => m.user_id)),
      )

      const { data: messageProfiles } = messageUserIds.length
        ? await supabase
            .from('profiles')
            .select('id,username,display_name')
            .in('id', messageUserIds)
        : { data: [] as any[] }

      const msgProfileMap = new Map(
        (messageProfiles || []).map((p: any) => [p.id, p] as const),
      )

      const chat_messages = (messages || []).map((m: any) => {
        const p = msgProfileMap.get(m.user_id)
        return {
          id: m.id,
          user_id: m.user_id,
          username: p?.display_name || p?.username || 'Unknown',
          message: m.message,
          timestamp: m.created_at,
        }
      })

      const hostName =
        hostProfile?.display_name || hostProfile?.username || 'Unknown'

      const current = partyRow.current_track as any
      const current_track =
        current && typeof current === 'object'
          ? {
              id: current.id || '',
              title: current.title || 'Unknown',
              artist: current.artist || 'Unknown',
              album: current.album || '',
              duration: Number(current.duration || 0),
              cover_art: current.cover_art || undefined,
            }
          : undefined

      setParty({
        id: partyRow.id,
        name: partyRow.name,
        description: partyRow.description || '',
        host_id: partyRow.host_id,
        host_name: hostName,
        is_live: !!partyRow.is_live,
        is_private: !!partyRow.is_private,
        current_track,
        attendees,
        queue,
        chat_messages,
        created_at: partyRow.created_at,
      })
    } catch (error) {
      console.error('Error loading party data:', error)
      toast.error('Failed to load party')
    }
  }

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !party || !user?.id) return
    try {
      const { error } = await supabase.from('party_messages').insert({
        party_id: partyId,
        user_id: user.id,
        message: chatMessage.trim(),
      })

      if (error) throw error
      setChatMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    }
  }

  const handleVote = async (queueItemId: string, voteType: 'up' | 'down') => {
    if (!user?.id) return
    try {
      const vote = voteType === 'up' ? 1 : -1
      const { error } = await supabase
        .from('party_queue_votes')
        .upsert(
          {
            queue_item_id: queueItemId,
            user_id: user.id,
            vote,
          },
          { onConflict: 'queue_item_id,user_id' },
        )

      if (error) throw error
      await loadPartyData()
    } catch (error) {
      console.error('Error voting:', error)
      toast.error('Failed to vote')
    }
  }

  const handleReaction = (emoji: string) => {
    setReactions(prev => prev.map(r => 
      r.emoji === emoji ? { ...r, count: r.count + 1 } : r
    ))
    setShowEmojis(false)
    
    // Store reaction as a chat message (no mock, persisted)
    void (async () => {
      if (!user?.id) return
      try {
        await supabase.from('party_messages').insert({
          party_id: partyId,
          user_id: user.id,
          message: `reacted with ${emoji}`,
        })
      } catch {
        // ignore
      }
    })()
  }

  const handleProposeTrack = async () => {
    if (!user?.id) return
    const trackId = window.prompt('Enter a Navidrome track ID to queue:')
    if (!trackId) return

    try {
      let title: string | undefined
      let artist: string | undefined
      try {
        const song = await subsonic.songs.getSong(trackId)
        if (song) {
          title = song.title
          artist = song.artist
        }
      } catch {
        // If song lookup fails, still insert with raw ID
      }

      const { error } = await supabase.from('party_queue_items').insert({
        party_id: partyId,
        track_id: trackId,
        title: title || null,
        artist: artist || null,
        requested_by: user.id,
      })

      if (error) throw error
      toast.success('Track added to queue')
    } catch (error) {
      console.error('Error adding track to queue:', error)
      toast.error('Failed to add track')
    }
  }

  if (!party) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Party Header */}
      <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Radio className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  {party.name}
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 mr-1 animate-pulse"></div>
                    LIVE
                  </Badge>
                </h1>
                <p className="text-muted-foreground">{party.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                {party.attendees.length} listeners
              </div>
              {party.is_private && (
                <Badge variant="outline" className="text-xs">
                  <Lock className="w-3 h-3 mr-1" />
                  Private
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Party Layout */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Now Playing & Queue */}
          <div className="lg:col-span-2 space-y-6">
            {/* Now Playing */}
            {party.current_track && (
              <div className="bg-card/50 border border-border rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-primary" />
                  Now Playing
                </h2>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                    <Music className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground">{party.current_track.title}</h3>
                    <p className="text-muted-foreground">{party.current_track.artist}</p>
                    <p className="text-sm text-muted-foreground">{party.current_track.album}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <Button size="sm" className="text-xs">
                        <Play className="w-3 h-3 mr-1" />
                        Sync
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        Hosted by {party.host_name}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Live Reactions Overlay */}
                <div className="mt-4 flex items-center gap-2">
                  {reactions.map((reaction) => (
                    <button
                      key={reaction.emoji}
                      onClick={() => handleReaction(reaction.emoji)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/20 hover:bg-black/30 transition-colors text-sm"
                    >
                      <span>{reaction.emoji}</span>
                      {reaction.count > 0 && (
                        <span className="text-xs text-muted-foreground">{reaction.count}</span>
                      )}
                    </button>
                  ))}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowEmojis(!showEmojis)}
                    className="text-xs"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}

            {/* Democratic Queue */}
            <div className="bg-card/50 border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Queue (Democratic)
                </h2>
                <Button size="sm" variant="outline" onClick={handleProposeTrack} className="text-xs">
                  <Plus className="w-3 h-3 mr-1" />
                  Propose Track
                </Button>
              </div>
              <div className="space-y-3">
                {party.queue.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 bg-black/20 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.artist}</p>
                      <p className="text-xs text-muted-foreground">Requested by {item.requested_by}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleVote(item.id, 'up')}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors text-sm"
                      >
                        <ThumbsUp className="w-3 h-3" />
                        {item.votes_up}
                      </button>
                      <button
                        onClick={() => handleVote(item.id, 'down')}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm"
                      >
                        <ThumbsDown className="w-3 h-3" />
                        {item.votes_down}
                      </button>
                    </div>
                  </div>
                ))}
                {party.queue.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Queue is empty. Add a track to get started!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Chat & Attendees */}
          <div className="space-y-6">
            {/* Live Chat */}
            <div className="bg-card/50 border border-border rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Live Chat
              </h2>
              <div className="space-y-3 mb-4 h-64 overflow-y-auto">
                {party.chat_messages.map((message) => (
                  <div key={message.id} className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs">
                      {message.username[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{message.username}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{message.message}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-black/20 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
                <Button size="sm" onClick={handleSendMessage} disabled={!chatMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Attendees */}
            <div className="bg-card/50 border border-border rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Attendees ({party.attendees.length})
              </h2>
              <div className="space-y-2">
                {party.attendees.map((attendee) => (
                  <div key={attendee.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs">
                      {attendee.username[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground flex items-center gap-2">
                        {attendee.username}
                        {attendee.is_host && (
                          <Badge variant="secondary" className="text-xs">
                            Host
                          </Badge>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
