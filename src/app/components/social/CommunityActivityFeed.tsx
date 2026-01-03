import {
  Activity,
  Heart,
  Megaphone,
  MessageSquare,
  PlayCircle,
  Plus,
  Radio,
  Sparkles,
  TrendingUp,
  User,
  Users,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Textarea } from '@/app/components/ui/textarea'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { ROUTES } from '@/routes/routesList'

interface SocialActivity {
  id: string
  user_id: string
  username: string
  user_avatar?: string
  action:
    | 'scrobble'
    | 'favorite'
    | 'playlist_add'
    | 'party_join'
    | 'party_create'
    | 'follow'
  target_type?: 'track' | 'album' | 'artist' | 'playlist' | 'party' | 'user'
  target_title?: string
  target_artist?: string
  target_album?: string
  target_cover?: string
  party_name?: string
  message?: string
  timestamp: string
  metadata?: {
    play_count?: number
    listener_count?: number
    duration?: number
  }
}

type FeedItemType =
  | 'activity'
  | 'comment'
  | 'comment_reaction'
  | 'party_reaction'
  | 'party_queue_add'

interface FeedItem {
  id: string
  type: FeedItemType
  user_id: string
  username: string
  user_avatar?: string
  timestamp: string
  title: string
  subtitle?: string
  message?: string
  target?: {
    type:
      | 'track'
      | 'album'
      | 'artist'
      | 'playlist'
      | 'party'
      | 'user'
      | 'comment'
    id?: string
  }
}

interface Announcement {
  id: string
  title: string
  body: string
  created_by: string
  created_at: string
  author_name: string
}

interface Friend {
  id: string
  username: string
  avatar_url?: string
  is_online: boolean
  last_activity?: string
  current_track?: {
    title: string
    artist: string
  }
}

export function CommunityActivityFeed() {
  const { user, profile } = useAuth()
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [announcementView, setAnnouncementView] = useState<
    'current' | 'archived'
  >('current')
  const [announcementsExpanded, setAnnouncementsExpanded] = useState(false)
  const [announcementTitle, setAnnouncementTitle] = useState('')
  const [announcementBody, setAnnouncementBody] = useState('')
  const [postingAnnouncement, setPostingAnnouncement] = useState(false)
  const [filter, setFilter] = useState<'all' | 'friends' | 'trending'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void loadSocialData()

    const channel = supabase
      .channel('social-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'social_activity' },
        () => void loadSocialData(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments' },
        () => void loadSocialData(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comment_reactions' },
        () => void loadSocialData(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'party_messages' },
        () => void loadSocialData(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'party_queue_items' },
        () => void loadSocialData(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'announcements' },
        () => void loadSocialData(),
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [filter, user?.id, announcementView, announcementsExpanded])

  const loadSocialData = async () => {
    setLoading(true)
    try {
      const followingIds: string[] = []
      if (user?.id) {
        const { data: following } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', user.id)
          .eq('following_type', 'user')

        for (const f of following || []) {
          if (f.following_id) followingIds.push(f.following_id)
        }
      }

      // Load all sources in parallel.
      let activityQuery = supabase
        .from('social_activity')
        .select('id,user_id,action,payload,created_at')
        .order('created_at', { ascending: false })
        .limit(50)

      if (filter === 'friends' && followingIds.length > 0) {
        activityQuery = activityQuery.in('user_id', followingIds)
      }

      const fetchAnnouncements = async () => {
        const base = supabase
          .from('announcements')
          .select('id,title,body,created_by,created_at,is_archived,archived_at')
          .order('created_at', { ascending: false })

        const filtered =
          announcementView === 'archived'
            ? base.eq('is_archived', true)
            : base.eq('is_archived', false)

        const limit =
          announcementView === 'current' && !announcementsExpanded ? 3 : 20

        let res: any = await filtered.limit(limit)
        if (res.error && (res.error as any).code === '42703') {
          res = await supabase
            .from('announcements')
            .select('id,title,body,created_by,created_at')
            .order('created_at', { ascending: false })
            .limit(limit)
        }
        return res
      }

      const [
        activityRes,
        commentsRes,
        commentReactionsRes,
        partyReactionsRes,
        queueAddsRes,
        announcementsRes,
      ] = await Promise.all([
        activityQuery,
        supabase
          .from('comments')
          .select(
            'id,content_type,content_id,user_id,username,user_avatar,text,created_at',
          )
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('comment_reactions')
          .select('id,comment_id,user_id,reaction_type,created_at')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('party_messages')
          .select('id,party_id,user_id,message,created_at')
          .ilike('message', 'reacted with %')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('party_queue_items')
          .select('id,party_id,track_id,title,artist,requested_by,created_at')
          .order('created_at', { ascending: false })
          .limit(20),
        fetchAnnouncements(),
      ])

      if (activityRes.error)
        console.error('Error loading social activity:', activityRes.error)
      if (commentsRes.error)
        console.error('Error loading comments:', commentsRes.error)
      if (commentReactionsRes.error)
        console.error(
          'Error loading comment reactions:',
          commentReactionsRes.error,
        )
      if (partyReactionsRes.error)
        console.error('Error loading party reactions:', partyReactionsRes.error)
      if (queueAddsRes.error)
        console.error('Error loading queue adds:', queueAddsRes.error)
      if (announcementsRes.error)
        console.error('Error loading announcements:', announcementsRes.error)

      const activityRows = activityRes.data || []
      const commentRows = commentsRes.data || []
      const commentReactionRows = commentReactionsRes.data || []
      const partyReactionRows = partyReactionsRes.data || []
      const queueAddRows = queueAddsRes.data || []
      const announcementRows = announcementsRes.data || []

      const profileIds = new Set<string>()
      for (const r of activityRows) profileIds.add(r.user_id)
      for (const r of commentReactionRows) profileIds.add(r.user_id)
      for (const r of partyReactionRows) profileIds.add(r.user_id)
      for (const r of queueAddRows) profileIds.add(r.requested_by)
      for (const r of announcementRows) profileIds.add(r.created_by)

      const ids = Array.from(profileIds)
      const { data: profiles } = ids.length
        ? await supabase
            .from('profiles')
            .select('id,username,display_name,avatar_url')
            .in('id', ids)
        : { data: [] as any[] }

      const profileMap = new Map(
        (profiles || []).map((p: any) => [p.id, p] as const),
      )
      const nameFor = (id: string, fallback?: string) => {
        const p = profileMap.get(id)
        return p?.display_name || p?.username || fallback || 'Unknown'
      }
      const avatarFor = (id: string) => {
        const p = profileMap.get(id)
        return p?.avatar_url || undefined
      }

      const activityItems: FeedItem[] = activityRows.map((r: any) => {
        const payload = (r.payload || {}) as any
        const action = r.action as SocialActivity['action']

        let title = ''
        let subtitle: string | undefined
        if (action === 'scrobble') {
          title = `listening to ${payload.target_title || 'a track'}`
          subtitle = payload.target_artist
            ? `by ${payload.target_artist}`
            : undefined
        } else if (action === 'favorite') {
          title = `favorited ${payload.target_title || 'a track'}`
          subtitle = payload.target_artist
            ? `by ${payload.target_artist}`
            : undefined
        } else if (action === 'playlist_add') {
          title = `added ${payload.target_title || 'a track'} to a playlist`
          subtitle = payload.target_artist
            ? `by ${payload.target_artist}`
            : undefined
        } else if (action === 'party_create') {
          title = `created a new party: ${payload.party_name || 'party'}`
        } else if (action === 'party_join') {
          title = `joined ${payload.party_name || 'a party'}`
        } else if (action === 'follow') {
          title = `started following ${payload.target_title || 'someone'}`
        } else {
          title = action
        }

        return {
          id: `activity:${r.id}`,
          type: 'activity',
          user_id: r.user_id,
          username: nameFor(r.user_id),
          user_avatar: avatarFor(r.user_id),
          timestamp: r.created_at,
          title,
          subtitle,
          message: payload.message,
          target: payload.target_type
            ? { type: payload.target_type, id: payload.target_id }
            : undefined,
        }
      })

      const commentItems: FeedItem[] = commentRows.map((c: any) => ({
        id: `comment:${c.id}`,
        type: 'comment',
        user_id: c.user_id,
        username: nameFor(c.user_id, c.username),
        user_avatar: c.user_avatar || avatarFor(c.user_id),
        timestamp: c.created_at,
        title: `commented on ${c.content_type}`,
        subtitle: c.text,
        target: { type: 'comment', id: c.id },
      }))

      const commentReactionItems: FeedItem[] = commentReactionRows.map(
        (r: any) => ({
          id: `comment_reaction:${r.id}`,
          type: 'comment_reaction',
          user_id: r.user_id,
          username: nameFor(r.user_id),
          user_avatar: avatarFor(r.user_id),
          timestamp: r.created_at,
          title: `reacted to a comment (${r.reaction_type})`,
          target: { type: 'comment', id: r.comment_id },
        }),
      )

      const partyReactionItems: FeedItem[] = partyReactionRows.map((r: any) => {
        const msg = String(r.message || '')
        const emoji = msg.replace('reacted with', '').trim()
        return {
          id: `party_reaction:${r.id}`,
          type: 'party_reaction',
          user_id: r.user_id,
          username: nameFor(r.user_id),
          user_avatar: avatarFor(r.user_id),
          timestamp: r.created_at,
          title: `reacted in a party`,
          subtitle: emoji ? `with ${emoji}` : undefined,
          target: { type: 'party', id: r.party_id },
        }
      })

      const queueAddItems: FeedItem[] = queueAddRows.map((r: any) => ({
        id: `party_queue_add:${r.id}`,
        type: 'party_queue_add',
        user_id: r.requested_by,
        username: nameFor(r.requested_by),
        user_avatar: avatarFor(r.requested_by),
        timestamp: r.created_at,
        title: `added a track to the party queue`,
        subtitle:
          r.title || r.artist
            ? `${r.title || 'Unknown'}${r.artist ? ` — ${r.artist}` : ''}`
            : `Track ID: ${r.track_id}`,
        target: { type: 'party', id: r.party_id },
      }))

      let merged = [
        ...activityItems,
        ...commentItems,
        ...commentReactionItems,
        ...partyReactionItems,
        ...queueAddItems,
      ]

      if (filter === 'friends' && followingIds.length > 0) {
        const allow = new Set(followingIds)
        merged = merged.filter((i) => allow.has(i.user_id))
      }

      merged.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      setFeed(merged.slice(0, 60))

      const mappedAnnouncements: Announcement[] = announcementRows.map(
        (a: any) => ({
          id: a.id,
          title: a.title,
          body: a.body,
          created_by: a.created_by,
          created_at: a.created_at,
          author_name: nameFor(a.created_by),
        }),
      )
      setAnnouncements(mappedAnnouncements)

      // Friends list is derived from follows + most recent activity timestamps.
      if (followingIds.length > 0) {
        const { data: friendProfiles } = await supabase
          .from('profiles')
          .select('id,username,display_name,avatar_url')
          .in('id', followingIds)

        const byUserLatest = new Map<string, any>()
        for (const act of merged) {
          if (!byUserLatest.has(act.user_id)) byUserLatest.set(act.user_id, act)
        }

        const now = Date.now()
        const mappedFriends: Friend[] = (friendProfiles || []).map(
          (fp: any) => {
            const latest = byUserLatest.get(fp.id) as FeedItem | undefined
            const last = latest?.timestamp
            const isOnline = last
              ? now - new Date(last).getTime() < 5 * 60 * 1000
              : false
            const currentTrack =
              latest?.type === 'activity' &&
              latest.title.startsWith('listening to ')
                ? {
                    title: latest.title.replace('listening to ', ''),
                    artist: latest.subtitle?.replace('by ', '') || '',
                  }
                : undefined

            return {
              id: fp.id,
              username: fp.display_name || fp.username || 'Unknown',
              avatar_url: fp.avatar_url || undefined,
              is_online: isOnline,
              last_activity: last || undefined,
              current_track: currentTrack,
            }
          },
        )

        setFriends(mappedFriends)
      } else {
        setFriends([])
      }
    } catch (error) {
      console.error('Error loading social data:', error)
    } finally {
      setLoading(false)
    }
  }

  const postAnnouncement = async () => {
    if (!profile?.is_admin) return
    const title = announcementTitle.trim()
    const body = announcementBody.trim()
    if (!title || !body) return

    setPostingAnnouncement(true)
    try {
      const { error } = await supabase.from('announcements').insert({
        title,
        body,
        created_by: profile.id,
      })
      if (error) throw error
      setAnnouncementTitle('')
      setAnnouncementBody('')
      toast.success('Announcement posted')
    } catch (e) {
      console.error('Error posting announcement:', e)
      toast.error('Failed to post announcement')
    } finally {
      setPostingAnnouncement(false)
    }
  }

  const getFeedIcon = (item: FeedItem) => {
    if (item.type === 'comment')
      return <MessageSquare className="w-4 h-4 text-sky-400" />
    if (item.type === 'comment_reaction')
      return <Heart className="w-4 h-4 text-red-400" />
    if (item.type === 'party_reaction')
      return <Sparkles className="w-4 h-4 text-yellow-400" />
    if (item.type === 'party_queue_add')
      return <Plus className="w-4 h-4 text-green-400" />

    // activity
    if (item.title.startsWith('listening to '))
      return <PlayCircle className="w-4 h-4 text-blue-400" />
    if (item.title.startsWith('favorited '))
      return <Heart className="w-4 h-4 text-red-400" />
    if (item.title.startsWith('added ') && item.title.includes('playlist'))
      return <Plus className="w-4 h-4 text-green-400" />
    if (item.title.startsWith('created a new party'))
      return <Radio className="w-4 h-4 text-purple-400" />
    if (item.title.startsWith('joined '))
      return <Users className="w-4 h-4 text-emerald-400" />
    if (item.title.startsWith('started following '))
      return <User className="w-4 h-4 text-orange-400" />
    return <Activity className="w-4 h-4 text-muted-foreground" />
  }

  const formatTimestamp = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diff = now.getTime() - time.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)

    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return time.toLocaleDateString()
  }

  const navigate = useNavigate()

  const handleItemClick = (item: FeedItem) => {
    if (!item.target?.id) return
    const { type, id } = item.target

    switch (type) {
      case 'artist':
        navigate(`/artist/${id}`)
        break
      case 'album':
        navigate(`/album/${id}`)
        break
      case 'track':
        // For tracks, maybe just play? For now go to album if possible or do nothing
        // Or navigate to album hash
        break
      case 'user':
        navigate(ROUTES.PROFILE.replace(':id?', id))
        break
      case 'party':
        // Join party logic or navigate to party page
        break
      default:
        break
    }
  }

  const ActivityItem = ({ item }: { item: FeedItem }) => (
    <div
      className="flex items-start gap-3 p-3 bg-card/30 rounded-lg hover:bg-card/50 transition-colors cursor-pointer group relative"
      onClick={() => handleItemClick(item)}
    >
      <div className="flex-shrink-0">{getFeedIcon(item)}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Link
            to={ROUTES.PROFILE.replace(':id?', item.user_id)}
            onClick={(e) => e.stopPropagation()}
            className="font-medium text-foreground text-sm hover:underline hover:text-primary transition-colors"
          >
            {item.username}
          </Link>
          <span className="text-xs text-muted-foreground">
            {formatTimestamp(item.timestamp)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground group-hover:text-white transition-colors">
          {item.title}{' '}
          {item.subtitle ? (
            <span className="text-muted-foreground group-hover:text-white/70">
              {item.subtitle}
            </span>
          ) : null}
        </p>
        {item.message && (
          <p className="text-xs text-muted-foreground mt-1 bg-black/10 p-2 rounded">
            {item.message}
          </p>
        )}
      </div>
    </div>
  )

  const OnlineFriend = ({ friend }: { friend: Friend }) => (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-card/30 transition-colors">
      <div className="relative">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white">
          {friend.username[0]?.toUpperCase()}
        </div>
        {friend.is_online && (
          <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background"></div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {friend.username}
        </p>
        {friend.current_track ? (
          <p className="text-xs text-muted-foreground truncate">
            🎵 {friend.current_track.title} - {friend.current_track.artist}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {friend.is_online
              ? 'Online'
              : `Last seen ${formatTimestamp(friend.last_activity!)}`}
          </p>
        )}
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const hasMoreCurrentAnnouncements =
    announcementView === 'current' && announcements.length > 2
  const visibleAnnouncements =
    announcementView === 'current' && !announcementsExpanded
      ? announcements.slice(0, 2)
      : announcements

  return (
    <div className="space-y-6">
      {/* Announcements */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">Announcements</h3>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={announcementView === 'current' ? 'default' : 'outline'}
              onClick={() => {
                setAnnouncementView('current')
                setAnnouncementsExpanded(false)
              }}
              className="text-xs"
            >
              Current
            </Button>
            <Button
              size="sm"
              variant={announcementView === 'archived' ? 'default' : 'outline'}
              onClick={() => {
                setAnnouncementView('archived')
                setAnnouncementsExpanded(false)
              }}
              className="text-xs"
            >
              Archived
            </Button>
          </div>
        </div>

        {profile?.is_admin && announcementView === 'current' && (
          <div className="bg-card/50 border border-border rounded-xl p-4 space-y-3">
            <div className="text-sm font-medium">Post announcement</div>
            <Input
              value={announcementTitle}
              onChange={(e) => setAnnouncementTitle(e.target.value)}
              placeholder="Title"
            />
            <Textarea
              value={announcementBody}
              onChange={(e) => setAnnouncementBody(e.target.value)}
              placeholder="Write an announcement visible to everyone..."
              className="resize-none"
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={postAnnouncement}
                disabled={
                  postingAnnouncement ||
                  !announcementTitle.trim() ||
                  !announcementBody.trim()
                }
              >
                {postingAnnouncement ? 'Posting…' : 'Post'}
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {visibleAnnouncements.map((a) => (
            <div
              key={a.id}
              className="bg-card/30 border border-border rounded-xl p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium text-foreground">{a.title}</div>
                <div className="text-xs text-muted-foreground">
                  {formatTimestamp(a.created_at)}
                </div>
              </div>
              <div className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                {a.body}
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                By {a.author_name}
              </div>
            </div>
          ))}
          {announcements.length === 0 && (
            <div className="text-sm text-muted-foreground bg-card/20 border border-border rounded-xl p-4">
              No announcements yet
            </div>
          )}

          {announcementView === 'current' &&
            hasMoreCurrentAnnouncements &&
            !announcementsExpanded && (
              <div className="flex justify-center">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => setAnnouncementsExpanded(true)}
                >
                  Show all
                </Button>
              </div>
            )}

          {announcementView === 'current' && announcementsExpanded && (
            <div className="flex justify-center">
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => setAnnouncementsExpanded(false)}
              >
                Show less
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Header with Title */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Community Activity
        </h2>
      </div>

      <div className="space-y-4">
        {/* Main Activity Feed */}
        <div className="space-y-4">
          {feed.map((item) => (
            <ActivityItem key={item.id} item={item} />
          ))}
          {feed.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
