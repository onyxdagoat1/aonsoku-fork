import {
  CheckCircle,
  Disc3,
  ExternalLink,
  Heart,
  ImagePlus,
  Info,
  Lock,
  MapPin,
  MessageSquare,
  Music,
  Pin,
  Reply,
  Star,
  User,
  Users,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  RiCameraFill,
  RiEdit2Fill,
  RiLoader4Fill,
  RiSave3Fill,
  RiUser3Fill,
} from 'react-icons/ri'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { getCoverArtUrl } from '@/api/httpClient'
import { LastFmIntegration } from '@/app/components/profile/LastFmIntegration'
import { PostsFeed } from '@/app/components/social/PostsFeed'
import { AnimatedBackground } from '@/app/components/ui/animated-background'
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs'
import { Textarea } from '@/app/components/ui/textarea'
import { VerifiedBadge } from '@/app/components/ui/VerifiedBadge'
import { getEraColor, getEraLabel } from '@/config/eras'
import { useAuth } from '@/contexts/AuthContext'
import type { Database } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'
import { eraService } from '@/service/eraService'
import { followService } from '@/service/followService'
import { subsonic } from '@/service/subsonic'
import {
  type ContentYeditor,
  type Yeditor,
  type YeditorStats,
  yeditorService,
} from '@/service/yeditorService'
import {
  usePlayerActions,
  usePlayerMediaType,
  usePlayerVolume,
  useReplayGainActions,
  useReplayGainState,
} from '@/store/player.store'

type VerificationType =
  | 'artist'
  | 'label'
  | 'contributor'
  | 'staff'
  | 'admin'
  | null

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  is_verified?: boolean
  verification_type?: VerificationType
}

interface ContentItem {
  id: string
  type: 'song' | 'album' | 'single' | 'compilation'
  name?: string
  artist?: string
  artistId?: string
  coverArt?: string
  era?: string
  year?: number
  yeditorId?: string
  yeditorName?: string
}

interface ProfileComment {
  id: string
  profile_id: string
  author_id: string
  content: string
  parent_id: string | null
  reply_count: number
  created_at: string
  author?: {
    id: string
    username: string | null
    display_name: string | null
    avatar_url: string | null
  }
  profile?: {
    id: string
    username: string | null
    display_name: string | null
  }
}

interface UserBadge {
  name: string
  icon?: string
}

function ContentCard({
  item,
  onPin,
  isSpotlight,
  onFavorite,
  isOwnProfile,
}: {
  item: ContentItem
  onPin?: (item: ContentItem) => void
  isSpotlight?: boolean
  onFavorite?: (item: ContentItem) => void
  isOwnProfile?: boolean
}) {
  const navigate = useNavigate()

  const handleYearClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (item.year) {
      navigate(`/library/advanced-search?year=${item.year}`)
    }
  }

  const handleArtistClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (item.artistId) {
      navigate(`/library/artists/${item.artistId}`)
    }
  }

  const handleYeditorClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (item.yeditorId) {
      navigate(`/yeditor/${item.yeditorId}`)
    }
  }

  const handleEraClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (item.era) {
      navigate(`/library/advanced-search?era=${item.era}`)
    }
  }

  const getTypeLabel = () => {
    switch (item.type) {
      case 'compilation':
        return 'Comp'
      case 'album':
        return 'Album'
      case 'single':
        return 'Single'
      default:
        return item.type
    }
  }

  return (
    <div className="group block relative">
      <Link to={`/library/albums/${item.id}`}>
        <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-2 relative">
          {item.coverArt ? (
            <img
              src={getCoverArtUrl(item.coverArt, 'album', '300')}
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Disc3 className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
          <div className="absolute top-2 right-2 flex gap-1">
            {onPin && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  onPin(item)
                }}
                className="bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full transition-colors"
                title={
                  isSpotlight ? 'Unpin from spotlight' : 'Pin to spotlight'
                }
              >
                <Pin
                  className={`w-3 h-3 ${isSpotlight ? 'fill-primary' : ''}`}
                />
              </button>
            )}
            {onFavorite && isOwnProfile && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  onFavorite(item)
                }}
                className="bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full transition-colors"
                title="Toggle favorite"
              >
                <Heart className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </Link>

      <h4 className="font-medium truncate group-hover:text-primary transition-colors">
        {item.name}
      </h4>

      {/* Clickable metadata row */}
      <div className="text-sm text-muted-foreground flex items-center gap-1.5 flex-wrap">
        {item.year && (
          <>
            <button
              onClick={handleYearClick}
              className="hover:text-primary hover:underline transition-colors cursor-pointer"
              title={`Search year ${item.year}`}
            >
              {item.year}
            </button>
            <span>•</span>
          </>
        )}
        <span
          className="hover:text-primary hover:underline transition-colors cursor-pointer"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            navigate(`/library/albums/${item.id}`)
          }}
          title="View album"
        >
          {getTypeLabel()}
        </span>
        {item.artist && (
          <>
            <span>•</span>
            <button
              onClick={handleArtistClick}
              className="hover:text-primary hover:underline transition-colors cursor-pointer truncate"
              title={`View ${item.artist}`}
            >
              {item.artist}
            </button>
          </>
        )}
      </div>

      {/* Yeditor badge */}
      {item.yeditorName && (
        <button
          onClick={handleYeditorClick}
          className="mt-1 inline-flex items-center gap-1 text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full hover:bg-blue-500/30 transition-colors"
          title={`View ${item.yeditorName}'s profile`}
        >
          <User className="w-3 h-3" />
          {item.yeditorName}
        </button>
      )}

      {/* Era tag */}
      {item.era && (
        <button
          onClick={handleEraClick}
          className="mt-1 inline-block"
          title={`Search ${getEraLabel(item.era)} era`}
        >
          <Badge
            variant="secondary"
            className="text-xs text-white hover:opacity-80 transition-opacity cursor-pointer"
            style={{ backgroundColor: getEraColor(item.era) }}
          >
            {getEraLabel(item.era)}
          </Badge>
        </button>
      )}
    </div>
  )
}

function SongRow({ item }: { item: ContentItem }) {
  const { playSong } = usePlayerActions()
  const [isPlaying, setIsPlaying] = useState(false)

  const handlePlay = async () => {
    if (item.id) {
      setIsPlaying(true)
      try {
        const songNode = await subsonic.songs.getSong(item.id)
        if (songNode) {
          playSong(songNode)
        }
      } catch {
        toast.error('Failed to play song')
      } finally {
        setIsPlaying(false)
      }
    }
  }

  return (
    <div
      onClick={handlePlay}
      className="flex items-center gap-3 p-3 rounded-xl bg-card border hover:bg-muted/50 transition-all group relative cursor-pointer"
    >
      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
        {isPlaying ? (
          <RiLoader4Fill className="w-6 h-6 animate-spin text-primary" />
        ) : item.coverArt ? (
          <img
            src={getCoverArtUrl(item.coverArt, 'song', '100')}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Music className="w-6 h-6 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium truncate group-hover:text-primary transition-colors">
          {item.name}
        </h4>
        <p className="text-sm text-muted-foreground truncate">{item.artist}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {item.era && (
          <Badge
            variant="secondary"
            className="text-[10px] uppercase font-bold text-white px-2 py-0.5"
            style={{ backgroundColor: getEraColor(item.era) }}
          >
            {getEraLabel(item.era)}
          </Badge>
        )}
      </div>
    </div>
  )
}

export const ProfilePage = () => {
  const { id: profileId } = useParams<{ id: string }>()
  const {
    profile: myProfile,
    user: myUser,
    updateProfile,
    isAuthenticated,
  } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const [targetId, setTargetId] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const [isEditing, setIsEditing] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [pronouns, setPronouns] = useState('')
  const [badges, setBadges] = useState<UserBadge[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isUploadingBanner, setIsUploadingBanner] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  // New state for profile enhancements
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({
    youtube: '',
    discord: '',
    instagram: '',
    soundcloud: '',
    spotify: '',
  })
  const [comments, setComments] = useState<ProfileComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [userRating, setUserRating] = useState<number | null>(null)
  const [favorites, setFavorites] = useState<ContentItem[]>([])
  const [spotlight, setSpotlight] = useState<ContentItem | null>(null)
  const [globalStats, setGlobalStats] = useState({
    likesReceived: 0,
    commentsMade: 0,
  })
  const [userComments, setUserComments] = useState<ProfileComment[]>([])
  const [commentCount, setCommentCount] = useState(0)
  const [averageRating, setAverageRating] = useState(0)

  // Yeditor integration state
  const [yeditor, setYeditor] = useState<Yeditor | null>(null)
  const [stats, setStats] = useState<YeditorStats | null>(null)
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [followerCount, setFollowerCount] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)

  const isOwnProfile = !profileId || profileId === myUser?.id
  const fullName = myUser?.user_metadata?.full_name || ''

  useEffect(() => {
    if (!isAuthenticated && !profileId) {
      navigate('/login')
    }
  }, [isAuthenticated, profileId, navigate])

  const loadProfile = useCallback(async () => {
    const effectiveId = profileId || myUser?.id
    if (!effectiveId) return

    setLoading(true)
    try {
      // If it's my profile, use the one from context
      if (isOwnProfile && myProfile) {
        setProfile(myProfile as Profile)
        setDisplayName(myProfile.display_name || fullName || '')
        setBio(myProfile.bio || '')
        setPronouns(myProfile.pronouns || '')
        setAverageRating(myProfile.average_rating || 0)
        setCommentCount(myProfile.comment_count || 0)
        setLocation(myProfile.location || '')
        setBadges((myProfile.badges as UserBadge[]) || [])
      } else {
        // Fetch external profile
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', effectiveId)
          .single()

        if (error) throw error
        setProfile(data as Profile)
        setDisplayName(data.display_name || data.username || '')
        setBio(data.bio || '')
        setPronouns(data.pronouns || '')
        setAverageRating(data.average_rating || 0)
        setCommentCount(data.comment_count || 0)
        setLocation(data.location || '')
        setBadges((data.badges as UserBadge[]) || [])
      }
      setTargetId(effectiveId)
    } catch (error) {
      console.error('Error loading profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [profileId, myUser?.id, isOwnProfile, myProfile, fullName])

  // Load social links
  const loadSocialLinks = useCallback(async () => {
    if (!targetId) return
    try {
      const { data } = await supabase
        .from('profile_social_links')
        .select('*')
        .eq('profile_id', targetId)
        .single()
      if (data) {
        setSocialLinks({
          youtube: data.youtube_url || '',
          discord: data.discord_url || '',
          instagram: data.instagram_url || '',
          soundcloud: data.soundcloud_url || '',
          spotify: data.spotify_url || '',
        })
      }
    } catch {
      // Social links are optional
    }
  }, [targetId])

  // Load comments
  const loadComments = useCallback(async () => {
    if (!targetId) return
    try {
      const { data } = await supabase
        .from('profile_comments')
        .select('*, author:profiles(*) ')
        .eq('profile_id', targetId)
        .order('created_at', { ascending: false })
        .limit(20)
      setComments(data || [])
    } catch (error) {
      console.error('Error loading comments:', error)
    }
  }, [targetId])

  // Load user's rating
  const loadUserRating = useCallback(async () => {
    if (!targetId || !myUser?.id || targetId === myUser.id) return
    try {
      const { data } = await supabase
        .from('profile_ratings')
        .select('rating')
        .eq('profile_id', targetId)
        .eq('rater_id', myUser.id)
        .single()
      setUserRating(data?.rating || null)
    } catch {
      // No rating yet
    }
  }, [targetId, myUser?.id])

  const checkFollowStatus = useCallback(async () => {
    if (!targetId || !myUser?.id || targetId === myUser.id) return
    try {
      const status = await followService.isFollowing(
        myUser.id,
        'yeditor',
        targetId,
      )
      setIsFollowing(status)
    } catch (error) {
      console.error('Error checking follow status:', error)
    }
  }, [targetId, myUser?.id])

  useEffect(() => {
    if (targetId) {
      checkFollowStatus()
    }
  }, [targetId, checkFollowStatus])

  const handleFollowToggle = async () => {
    if (!targetId || !myUser?.id || targetId === myUser.id) return
    try {
      if (isFollowing) {
        await followService.unfollow(myUser.id, 'yeditor', targetId)
        setFollowerCount((prev) => Math.max(0, prev - 1))
      } else {
        await followService.follow(myUser.id, 'yeditor', targetId)
        setFollowerCount((prev) => prev + 1)
      }
      setIsFollowing(!isFollowing)
      toast.success(isFollowing ? 'Unfollowed' : 'Following')
    } catch {
      toast.error('Failed to update follow status')
    }
  }

  // Load favorites
  const loadFavorites = useCallback(async () => {
    if (!targetId) return
    try {
      const { data, error } = await supabase
        .from('profile_favorites')
        .select('*')
        .eq('profile_id', targetId)
        .order('created_at', { ascending: false })
        .limit(12)

      if (error) throw error

      if (data) {
        const items: ContentItem[] = []
        for (const fav of data) {
          try {
            if (
              fav.content_type === 'album' ||
              fav.content_type === 'compilation' ||
              fav.content_type === 'single'
            ) {
              const album = await subsonic.albums.getOne(fav.content_id)
              if (album) {
                const era = await eraService.getEra(fav.content_id, 'album')
                const yeditorData = await yeditorService.getContentYeditor(
                  fav.content_id,
                  'album',
                )
                items.push({
                  id: fav.content_id,
                  type: fav.content_type,
                  name: album.name,
                  artist: album.artist,
                  artistId: album.artistId,
                  coverArt: album.coverArt,
                  era: era || undefined,
                  year: album.year,
                  yeditorId: yeditorData?.yeditor_id,
                  yeditorName: yeditorData?.yeditor_name,
                })
              }
            } else if (fav.content_type === 'song') {
              const song = await subsonic.songs.getSong(fav.content_id)
              if (song) {
                const era = await eraService.getEra(fav.content_id, 'song')
                const yeditorData = await yeditorService.getContentYeditor(
                  song.albumId,
                  'album',
                )
                items.push({
                  id: fav.content_id,
                  type: fav.content_type,
                  name: song.title,
                  artist: song.artist,
                  artistId: song.artistId,
                  coverArt: song.coverArt,
                  era: era || undefined,
                  year: song.year,
                  yeditorId: yeditorData?.yeditor_id,
                  yeditorName: yeditorData?.yeditor_name,
                })
              }
            }
          } catch {
            // Silently skip failed items
          }
        }
        setFavorites(items)
      }
    } catch (error) {
      console.error('Error loading favorites:', error)
    }
  }, [targetId])

  // Load spotlight
  const loadSpotlight = useCallback(async () => {
    if (!targetId || !profile?.spotlight_content_id) return
    try {
      const { spotlight_content_id, spotlight_content_type } = profile
      let item: ContentItem | null = null

      if (
        spotlight_content_type === 'album' ||
        spotlight_content_type === 'compilation' ||
        spotlight_content_type === 'single'
      ) {
        const album = await subsonic.albums.getOne(spotlight_content_id)
        if (album) {
          const era = await eraService.getEra(spotlight_content_id, 'album')
          const yeditorData = await yeditorService.getContentYeditor(
            spotlight_content_id,
            'album',
          )
          item = {
            id: spotlight_content_id,
            type: spotlight_content_type,
            name: album.name,
            artist: album.artist,
            artistId: album.artistId,
            coverArt: album.coverArt,
            era: era || undefined,
            year: album.year,
            yeditorId: yeditorData?.yeditor_id,
            yeditorName: yeditorData?.yeditor_name,
          }
        }
      } else if (spotlight_content_type === 'song') {
        const song = await subsonic.songs.getSong(spotlight_content_id)
        if (song) {
          const era = await eraService.getEra(spotlight_content_id, 'song')
          item = {
            id: spotlight_content_id,
            type: spotlight_content_type,
            name: song.title,
            artist: song.artist,
            coverArt: song.coverArt,
            era: era || undefined,
          }
        }
      }
      setSpotlight(item)
    } catch (error) {
      console.error('Error loading spotlight:', error)
    }
  }, [targetId, profile?.spotlight_content_id, profile?.spotlight_content_type])

  // Load global stats
  const loadGlobalStats = useCallback(async () => {
    if (!targetId) return
    try {
      // Count likes received on user's content
      const { count: likesCount } = await supabase
        .from('profile_favorites')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', targetId)

      // Count comments made by user
      const { count: commentsCount } = await supabase
        .from('profile_comments')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', targetId)

      setGlobalStats({
        likesReceived: likesCount || 0,
        commentsMade: commentsCount || 0,
      })
    } catch (error) {
      console.error('Error loading global stats:', error)
    }
  }, [targetId])

  // Load user's comments on other profiles
  const loadUserComments = useCallback(async () => {
    if (!targetId) return
    try {
      const { data } = await supabase
        .from('profile_comments')
        .select('*, profile:profiles(*)')
        .eq('author_id', targetId)
        .order('created_at', { ascending: false })
        .limit(10)
      setUserComments(data || [])
    } catch (error) {
      console.error('Error loading user comments:', error)
    }
  }, [targetId])

  // Post comment
  const handlePostComment = async () => {
    if (!newComment.trim() || !targetId || !myUser?.id || isOwnProfile) return
    try {
      const { error } = await supabase.from('profile_comments').insert({
        profile_id: targetId,
        author_id: myUser.id,
        content: newComment.trim(),
      })
      if (error) throw error
      setNewComment('')
      loadComments()
      // Refresh stats if commenting on own profile
      if (targetId === myUser.id) {
        loadGlobalStats()
        loadUserComments()
      }
      toast.success('Comment posted')
    } catch (error) {
      console.error('Error posting comment:', error)
      toast.error('Failed to post comment')
    }
  }

  // Rate profile
  const handleRateProfile = async (rating: number) => {
    if (!targetId || !myUser?.id || targetId === myUser.id) return
    try {
      const { error } = await supabase.from('profile_ratings').upsert({
        profile_id: targetId,
        rater_id: myUser.id,
        rating,
      })
      if (error) throw error
      setUserRating(rating)
      loadProfile() // Refresh average rating
      toast.success('Profile rated')
    } catch (error) {
      console.error('Error rating profile:', error)
      toast.error('Failed to rate profile')
    }
  }

  // Toggle favorite
  const handleToggleFavorite = async (item: ContentItem) => {
    if (!targetId || !myUser?.id || !isOwnProfile) return
    try {
      const { error } = await supabase
        .from('profile_favorites')
        .delete()
        .eq('profile_id', targetId)
        .eq('content_id', item.id)
        .eq('content_type', item.type)
      if (error) {
        // Try inserting instead
        await supabase.from('profile_favorites').insert({
          profile_id: targetId,
          content_id: item.id,
          content_type: item.type,
        })
        toast.success('Added to favorites')
      } else {
        toast.success('Removed from favorites')
      }
      loadFavorites()
    } catch (error) {
      console.error('Error toggling favorite:', error)
      toast.error('Failed to update favorites')
    }
  }

  // Pin/unpin spotlight
  const handlePinSpotlight = async (item: ContentItem) => {
    if (!targetId || !myUser?.id || !isOwnProfile) return
    try {
      const isCurrentlySpotlight = spotlight?.id === item.id
      if (isCurrentlySpotlight) {
        // Unpin
        await supabase
          .from('profiles')
          .update({
            spotlight_content_id: null,
            spotlight_content_type: null,
          })
          .eq('id', targetId)
        setSpotlight(null)
        toast.success('Removed from spotlight')
      } else {
        // Pin
        await supabase
          .from('profiles')
          .update({
            spotlight_content_id: item.id,
            spotlight_content_type: item.type,
          })
          .eq('id', targetId)
        setSpotlight(item)
        toast.success('Pinned to spotlight')
      }
      loadProfile()
    } catch (error) {
      console.error('Error pinning spotlight:', error)
      toast.error('Failed to update spotlight')
    }
  }

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  useEffect(() => {
    if (targetId) {
      loadSocialLinks()
      loadUserRating()
      loadSpotlight()
      loadComments()
      loadFavorites()
      loadGlobalStats()
      loadUserComments()
    }
  }, [
    targetId,
    loadSocialLinks,
    loadUserRating,
    loadSpotlight,
    loadComments,
    loadFavorites,
    loadGlobalStats,
    loadUserComments,
  ])

  const loadContentDetails = useCallback(
    async (workItems: ContentYeditor[]) => {
      const items: ContentItem[] = []
      for (const workItem of workItems) {
        try {
          if (
            workItem.content_type === 'album' ||
            workItem.content_type === 'compilation' ||
            workItem.content_type === 'single'
          ) {
            const album = await subsonic.albums.getOne(workItem.content_id)
            if (album) {
              const era = await eraService.getEra(workItem.content_id, 'album')
              items.push({
                id: workItem.content_id,
                type: workItem.content_type,
                name: album.name,
                artist: album.artist,
                coverArt: album.coverArt,
                era: era || undefined,
              })
            }
          } else if (workItem.content_type === 'song') {
            const song = await subsonic.songs.getSong(workItem.content_id)
            if (song) {
              const era = await eraService.getEra(workItem.content_id, 'song')
              items.push({
                id: workItem.content_id,
                type: 'song',
                name: song.title,
                artist: song.artist,
                coverArt: song.coverArt,
                era: era || undefined,
              })
            }
          }
        } catch (_error) {
          // Silently skip failed items
        }
      }
      setContentItems(items)
    },
    [],
  )

  const loadYeditorData = useCallback(async () => {
    if (!targetId) return
    try {
      const yeditorData = await yeditorService.getYeditorByUserId(targetId)
      if (yeditorData) {
        setYeditor(yeditorData)
        // Load additional data for verified yeditors
        const [statsData, workData, followers] = await Promise.all([
          yeditorService.getYeditorStats(yeditorData.id),
          yeditorService.getYeditorWork(yeditorData.id),
          followService.getFollowerCount('yeditor', yeditorData.id),
        ])

        setStats(statsData)
        setFollowerCount(followers)
        await loadContentDetails(workData)
      } else {
        setYeditor(null)
        setStats(null)
        setContentItems([])
      }
    } catch (error) {
      console.error('Error loading yeditor data:', error)
    }
  }, [targetId, loadContentDetails])

  useEffect(() => {
    if (targetId) {
      loadYeditorData()
    }
  }, [targetId, loadYeditorData])

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          bio: bio,
          pronouns: pronouns,
          location: location,
        })
        .eq('id', targetId!)

      if (profileError) throw profileError

      // Check if social links record exists
      const { data: existing } = await supabase
        .from('profile_social_links')
        .select('id')
        .eq('profile_id', targetId!)
        .maybeSingle()

      if (existing) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('profile_social_links')
          .update({
            youtube_url: socialLinks.youtube || null,
            discord_url: socialLinks.discord || null,
            instagram_url: socialLinks.instagram || null,
            soundcloud_url: socialLinks.soundcloud || null,
            spotify_url: socialLinks.spotify || null,
          })
          .eq('id', existing.id)

        if (updateError) throw updateError
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('profile_social_links')
          .insert({
            profile_id: targetId!,
            platform: 'youtube',
            url: socialLinks.youtube || '',
            youtube_url: socialLinks.youtube || null,
            discord_url: socialLinks.discord || null,
            instagram_url: socialLinks.instagram || null,
            soundcloud_url: socialLinks.soundcloud || null,
            spotify_url: socialLinks.spotify || null,
          })

        if (insertError) throw insertError
      }

      setIsEditing(false)
      toast.success('Profile updated successfully')
      loadProfile()
      loadSocialLinks()
    } catch (error) {
      console.error('Failed to update profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarClick = () => {
    if (isEditing && isOwnProfile) {
      fileInputRef.current?.click()
    }
  }

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (!file || !profile || !isOwnProfile) return

    setIsUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${profile.id}-${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath)

      await updateProfile({ avatar_url: publicUrl })
      toast.success('Avatar updated!')
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error uploading avatar'
      console.error('Error uploading avatar:', error)
      toast.error(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  const handleBannerChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (!file || !profile || !isOwnProfile) return

    setIsUploadingBanner(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${profile.id}/banner-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('banners')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from('banners').getPublicUrl(fileName)

      await supabase
        .from('profiles')
        .update({ banner_url: publicUrl })
        .eq('id', profile.id)

      setProfile((prev) => (prev ? { ...prev, banner_url: publicUrl } : prev))
      toast.success('Banner updated!')
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error uploading banner'
      console.error('Error uploading banner:', error)
      toast.error(errorMessage)
    } finally {
      setIsUploadingBanner(false)
    }
  }

  const handleReplyComment = async (parentId: string) => {
    if (!replyText.trim() || !targetId || !myUser?.id) return
    try {
      const { error } = await supabase.from('profile_comments').insert({
        profile_id: targetId,
        author_id: myUser.id,
        content: replyText.trim(),
        parent_id: parentId,
      })
      if (error) throw error
      setReplyText('')
      setReplyingTo(null)
      loadComments()
      toast.success('Reply posted')
    } catch (error) {
      console.error('Error posting reply:', error)
      toast.error('Failed to post reply')
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <RiLoader4Fill className="text-3xl animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-foreground">
        Profile not found
      </div>
    )
  }

  const compilations = contentItems.filter(
    (i) => i.type === 'album' || i.type === 'compilation',
  )
  const singles = contentItems.filter((i) => i.type === 'single')
  const songs = contentItems.filter((i) => i.type === 'song')

  return (
    <div className="relative min-h-[calc(100vh-var(--header-height))] w-full overflow-hidden bg-background mb-24">
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Main Container */}
      <div className="relative z-10 w-full">
        {/* Header Banner */}
        <div className="h-72 w-full relative group overflow-hidden">
          {profile.banner_url ? (
            <img
              src={profile.banner_url}
              alt="Profile Banner"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 via-purple-600/20 to-blue-600/20" />
          )}
          {/* Gradient fade to content */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

          {/* Banner Actions */}
          <div className="absolute top-4 right-4 z-20 flex gap-2">
            {isOwnProfile && isEditing && (
              <div className="flex flex-col items-end gap-1">
                <Button
                  onClick={() => bannerInputRef.current?.click()}
                  variant="ghost"
                  className="bg-background/30 hover:bg-background/50 backdrop-blur-md border border-white/10 rounded-full h-10 px-4 gap-2 text-white"
                >
                  {isUploadingBanner ? (
                    <RiLoader4Fill className="animate-spin" />
                  ) : (
                    <ImagePlus className="w-4 h-4" />
                  )}
                  Change Banner
                </Button>
                <div className="flex items-center gap-1.5 px-2 text-[10px] text-white/50 font-bold uppercase tracking-wider">
                  <Info className="w-3 h-3" />
                  Recommended: 1920x480 (Max 5MB)
                </div>
              </div>
            )}
            {isOwnProfile && (
              <Button
                onClick={isEditing ? handleSave : () => setIsEditing(true)}
                disabled={isLoading}
                variant="ghost"
                className={`backdrop-blur-md border border-white/10 rounded-full h-10 px-6 transition-all duration-300 ${
                  isEditing
                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20'
                    : 'bg-background/20 hover:bg-background/40 text-white'
                }`}
              >
                {isLoading ? (
                  <RiLoader4Fill className="animate-spin mr-2" />
                ) : isEditing ? (
                  <>
                    <RiSave3Fill className="mr-2" /> Save
                  </>
                ) : (
                  <>
                    <RiEdit2Fill className="mr-2" /> Edit Profile
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        <div className="container mx-auto px-6 relative z-10 -mt-32">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />
          <input
            type="file"
            ref={bannerInputRef}
            onChange={handleBannerChange}
            className="hidden"
            accept="image/*"
          />

          <div className="flex flex-col md:flex-row gap-8 items-end md:items-end mb-8">
            {/* Avatar */}
            <div
              onClick={handleAvatarClick}
              className={`w-48 h-48 rounded-full border-[8px] border-background shadow-2xl relative group overflow-hidden bg-muted ${isEditing && isOwnProfile ? 'cursor-pointer' : ''}`}
            >
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.username || 'Avatar'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="text-6xl font-black text-white uppercase">
                    {profile.username?.[0] || 'U'}
                  </span>
                </div>
              )}

              {/* Upload Overlay */}
              {isEditing && isOwnProfile && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 backdrop-blur-sm">
                  {isUploading ? (
                    <RiLoader4Fill className="text-white text-3xl animate-spin" />
                  ) : (
                    <RiCameraFill className="text-white text-3xl" />
                  )}
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    {isEditing ? (
                      <input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="text-5xl font-black tracking-tighter bg-transparent border-b-2 border-primary/20 focus:border-primary focus:outline-none w-full max-w-md text-foreground"
                        placeholder="Display Name"
                      />
                    ) : (
                      <h1 className="text-5xl font-black tracking-tighter text-foreground flex items-center gap-3">
                        {displayName}
                        <div className="flex items-center gap-2">
                          {/* Admin Shield (Gold) */}
                          {profile.is_admin && (
                            <VerifiedBadge type="admin" className="w-8 h-8" />
                          )}

                          {/* Blue Verified Wavy Check */}
                          {(profile.verification_type ||
                            badges.some(
                              (b) => b.name.toUpperCase() === 'VERIFIED',
                            )) && (
                            <VerifiedBadge
                              type="verified"
                              className="w-8 h-8"
                            />
                          )}

                          {/* Other Custom Badges (Homepage Style) */}
                          {badges
                            .filter((b) => b.name.toUpperCase() !== 'VERIFIED')
                            .map((badge, idx) => (
                              <Badge
                                key={idx}
                                variant="neutral"
                                className="border text-xs font-semibold px-2.5 py-0.5 h-6 flex items-center shadow-sm"
                              >
                                {badge.name}
                              </Badge>
                            ))}
                        </div>
                      </h1>
                    )}
                    {/* Remove manual verified badge div as it is now handled by VerifiedBadge next to name */}
                  </div>
                  <p className="text-xl text-muted-foreground font-medium">
                    @{profile.username}
                  </p>
                  {pronouns && (
                    <p className="text-sm text-muted-foreground italic">
                      {pronouns}
                    </p>
                  )}
                  {location && !isEditing && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                      <MapPin className="w-3.5 h-3.5 text-primary/60" />
                      <span>{location}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {!isOwnProfile && isAuthenticated && (
                    <>
                      <Button
                        onClick={handleFollowToggle}
                        className={`rounded-full h-11 px-8 font-black shadow-xl transition-all duration-300 ${
                          isFollowing
                            ? 'bg-accent/40 hover:bg-accent/60 text-foreground border border-white/10'
                            : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20 scale-105 active:scale-95'
                        }`}
                      >
                        {isFollowing ? 'Following' : 'Follow'}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => navigate('/messages')}
                        className="bg-white/10 hover:bg-white/20 text-white rounded-full h-11 w-11 p-0 border border-white/10 backdrop-blur-md"
                      >
                        <MessageSquare className="w-5 h-5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Layout: Sidebar + Main */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="space-y-6">
              {/* About Card */}
              <div className="bg-black/20 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-4 flex items-center gap-2">
                  <RiUser3Fill className="text-primary w-3 h-3" />
                  About
                </h2>
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Pronouns (optional)
                      </label>
                      <Input
                        value={pronouns}
                        onChange={(e) => setPronouns(e.target.value)}
                        placeholder="they/them"
                        className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-foreground focus:border-primary focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Location (optional)
                      </label>
                      <Input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. San Francisco, CA"
                        className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-foreground focus:border-primary focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Bio
                      </label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full h-32 bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-foreground focus:border-primary focus:outline-none resize-none transition-colors"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Social Links
                      </label>
                      <Input
                        value={socialLinks.youtube || ''}
                        onChange={(e) =>
                          setSocialLinks((prev) => ({
                            ...prev,
                            youtube: e.target.value,
                          }))
                        }
                        placeholder="YouTube URL"
                        className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-foreground focus:border-primary focus:outline-none transition-colors"
                      />
                      <Input
                        value={socialLinks.discord || ''}
                        onChange={(e) =>
                          setSocialLinks((prev) => ({
                            ...prev,
                            discord: e.target.value,
                          }))
                        }
                        placeholder="Discord URL"
                        className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-foreground focus:border-primary focus:outline-none transition-colors"
                      />
                      <Input
                        value={socialLinks.instagram || ''}
                        onChange={(e) =>
                          setSocialLinks((prev) => ({
                            ...prev,
                            instagram: e.target.value,
                          }))
                        }
                        placeholder="Instagram URL"
                        className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-foreground focus:border-primary focus:outline-none transition-colors"
                      />
                      <Input
                        value={socialLinks.soundcloud || ''}
                        onChange={(e) =>
                          setSocialLinks((prev) => ({
                            ...prev,
                            soundcloud: e.target.value,
                          }))
                        }
                        placeholder="SoundCloud URL"
                        className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-foreground focus:border-primary focus:outline-none transition-colors"
                      />
                      <Input
                        value={socialLinks.spotify || ''}
                        onChange={(e) =>
                          setSocialLinks((prev) => ({
                            ...prev,
                            spotify: e.target.value,
                          }))
                        }
                        placeholder="Spotify URL"
                        className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-foreground focus:border-primary focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-foreground/80 leading-relaxed text-sm whitespace-pre-wrap font-medium">
                      {bio || 'No bio yet.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Stats Card */}
              <div className="bg-black/20 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 grid grid-cols-2 gap-4 shadow-2xl text-left">
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-primary tracking-tighter">
                    {yeditor ? followerCount : '0'}
                  </span>
                  <span className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">
                    Followers
                  </span>
                </div>
                <div className="flex flex-col border-l border-white/10 pl-4">
                  <span className="text-2xl font-black text-primary tracking-tighter">
                    {yeditor ? stats?.total_works || 0 : '0'}
                  </span>
                  <span className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">
                    Creations
                  </span>
                </div>
                <div className="flex flex-col pt-2">
                  <span className="text-2xl font-black text-primary tracking-tighter">
                    {commentCount}
                  </span>
                  <span className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">
                    Comments
                  </span>
                </div>
                <div className="flex flex-col border-l border-white/10 pl-4 pt-2">
                  <span className="text-2xl font-black text-primary tracking-tighter flex items-center gap-1">
                    {averageRating.toFixed(1)}
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  </span>
                  <span className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">
                    Rating
                  </span>
                </div>
              </div>

              {/* Social Links */}
              {(socialLinks.youtube ||
                socialLinks.discord ||
                socialLinks.instagram ||
                socialLinks.soundcloud ||
                socialLinks.spotify) && (
                <div className="bg-black/20 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-4">
                    Links
                  </h3>
                  <div className="space-y-2">
                    {socialLinks.youtube && (
                      <a
                        href={socialLinks.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        YouTube
                      </a>
                    )}
                    {socialLinks.discord && (
                      <a
                        href={socialLinks.discord}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Discord
                      </a>
                    )}
                    {socialLinks.instagram && (
                      <a
                        href={socialLinks.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Instagram
                      </a>
                    )}
                    {socialLinks.soundcloud && (
                      <a
                        href={socialLinks.soundcloud}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        SoundCloud
                      </a>
                    )}
                    {socialLinks.spotify && (
                      <a
                        href={socialLinks.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Spotify
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Rating */}
              {!isOwnProfile && isAuthenticated && (
                <div className="bg-black/20 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-4">
                    Rate Profile
                  </h3>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRateProfile(star)}
                        className="transition-colors"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= (userRating || 0)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-muted-foreground hover:text-yellow-400'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-sm text-muted-foreground ml-2">
                      {userRating
                        ? `Your rating: ${userRating}`
                        : 'Click to rate'}
                    </span>
                  </div>
                </div>
              )}

              {/* Spotlight - Pinned Creation */}
              {spotlight && (
                <div className="bg-black/20 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-4 flex items-center gap-2">
                    <Pin className="w-3 h-3" />
                    Pinned Creation
                  </h3>
                  <div className="relative group">
                    <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                      {spotlight.coverArt ? (
                        <img
                          src={getCoverArtUrl(
                            spotlight.coverArt,
                            'album',
                            '400',
                          )}
                          alt={spotlight.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Disc3 className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-white font-medium text-sm truncate">
                        {spotlight.name}
                      </p>
                      <p className="text-white/80 text-xs truncate">
                        {spotlight.artist}
                      </p>
                    </div>
                    <a
                      href={`/library/albums/${spotlight.id}`}
                      className="absolute inset-0"
                      aria-label={`View ${spotlight.name}`}
                    />
                  </div>
                </div>
              )}

              {/* Favorite Creations */}
              {isOwnProfile && favorites.length > 0 && (
                <div className="bg-black/20 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-4 flex items-center gap-2">
                    <Heart className="w-3 h-3" />
                    Your Favorite Creations
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {favorites.slice(0, 6).map((item) => (
                      <div key={item.id} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                          {item.coverArt ? (
                            <img
                              src={getCoverArtUrl(
                                item.coverArt,
                                'album',
                                '150',
                              )}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Disc3 className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <a
                            href={`/library/albums/${item.id}`}
                            className="text-white text-xs bg-primary/80 px-2 py-1 rounded"
                          >
                            View
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                  {favorites.length > 6 && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      +{favorites.length - 6} more in your favorites
                    </p>
                  )}
                </div>
              )}

              {/* Last.fm Integration */}
              {isOwnProfile && <LastFmIntegration />}

              {/* Global Stats */}
              <div className="bg-black/20 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-4 flex items-center gap-2">
                  <Users className="w-3 h-3" />
                  Global Activity
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Likes Received
                    </span>
                    <span className="text-sm font-bold text-primary">
                      {globalStats.likesReceived}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Comments Made
                    </span>
                    <span className="text-sm font-bold text-primary">
                      {globalStats.commentsMade}
                    </span>
                  </div>
                </div>
              </div>

              {/* User's Recent Comments */}
              {userComments.length > 0 && (
                <div className="bg-black/20 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-4 flex items-center gap-2">
                    <MessageSquare className="w-3 h-3" />
                    Recent Comments
                  </h3>
                  <div className="space-y-3">
                    {userComments.slice(0, 3).map((comment) => (
                      <div
                        key={comment.id}
                        className="p-3 bg-black/10 rounded-lg"
                      >
                        <p className="text-xs text-muted-foreground mb-1">
                          On{' '}
                          {comment.profile?.display_name ||
                            comment.profile?.username}
                          's profile
                        </p>
                        <p className="text-sm text-foreground/80 line-clamp-2">
                          {comment.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                    {userComments.length > 3 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{userComments.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3">
              {/* Comments Section */}
              <div className="bg-black/20 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl mb-8">
                <h3 className="text-lg font-black tracking-tighter mb-4 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Comments ({commentCount})
                </h3>

                {/* Comment Input */}
                {isAuthenticated && !isOwnProfile && (
                  <div className="mb-6">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Leave a comment..."
                      className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-foreground focus:border-primary focus:outline-none resize-none transition-colors"
                      rows={3}
                    />
                    <Button
                      onClick={handlePostComment}
                      disabled={!newComment.trim()}
                      className="mt-2 rounded-full h-9 px-6 text-xs font-bold"
                    >
                      Post Comment
                    </Button>
                  </div>
                )}

                {/* Comments List */}
                <div className="space-y-4">
                  {comments.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-8">
                      No comments yet.
                    </p>
                  ) : (
                    comments
                      .filter((c) => !c.parent_id) // Only show top-level comments
                      .map((comment) => (
                        <div key={comment.id} className="space-y-2">
                          <div className="flex gap-3 p-4 bg-black/10 rounded-xl hover:bg-black/15 transition-colors">
                            <Avatar className="w-8 h-8 shrink-0">
                              <AvatarImage
                                src={comment.author?.avatar_url ?? undefined}
                              />
                              <AvatarFallback>
                                {(comment.author?.display_name ||
                                  comment.author?.username ||
                                  'U')?.[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium">
                                  {comment.author?.display_name ||
                                    comment.author?.username}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(
                                    comment.created_at,
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-foreground/80 break-words">
                                {comment.content}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                {isAuthenticated && !isOwnProfile && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs text-muted-foreground hover:text-foreground h-6 px-2 gap-1"
                                    onClick={() =>
                                      setReplyingTo(
                                        replyingTo === comment.id
                                          ? null
                                          : comment.id,
                                      )
                                    }
                                  >
                                    <Reply className="w-3 h-3" />
                                    Reply
                                  </Button>
                                )}
                                {(myUser?.id === comment.author_id ||
                                  isOwnProfile) && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs text-red-400 hover:text-red-300 h-6 px-2"
                                    onClick={async () => {
                                      try {
                                        await supabase
                                          .from('profile_comments')
                                          .delete()
                                          .eq('id', comment.id)
                                        loadComments()
                                        toast.success('Comment deleted')
                                      } catch {
                                        toast.error('Failed to delete comment')
                                      }
                                    }}
                                  >
                                    Delete
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Reply Input */}
                          {replyingTo === comment.id && (
                            <div className="ml-11 p-3 bg-black/5 rounded-xl border border-white/5">
                              <Textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Write a reply..."
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-foreground focus:border-primary focus:outline-none resize-none min-h-[60px]"
                                rows={2}
                              />
                              <div className="flex gap-2 mt-2">
                                <Button
                                  size="sm"
                                  className="h-7 px-4 text-xs"
                                  onClick={() => handleReplyComment(comment.id)}
                                  disabled={!replyText.trim()}
                                >
                                  Reply
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-3 text-xs"
                                  onClick={() => {
                                    setReplyingTo(null)
                                    setReplyText('')
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Nested Replies */}
                          {comments
                            .filter((r) => r.parent_id === comment.id)
                            .map((reply) => (
                              <div
                                key={reply.id}
                                className="flex gap-3 p-3 ml-11 bg-black/5 rounded-xl border-l-2 border-primary/20"
                              >
                                <Avatar className="w-6 h-6 shrink-0">
                                  <AvatarImage
                                    src={reply.author?.avatar_url ?? undefined}
                                  />
                                  <AvatarFallback className="text-[10px]">
                                    {(reply.author?.display_name ||
                                      reply.author?.username ||
                                      'U')?.[0]?.toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-xs font-medium">
                                      {reply.author?.display_name ||
                                        reply.author?.username}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                      {new Date(
                                        reply.created_at,
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-xs text-foreground/80 break-words">
                                    {reply.content}
                                  </p>
                                  {(myUser?.id === reply.author_id ||
                                    isOwnProfile) && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-[10px] text-red-400 hover:text-red-300 h-5 px-1 mt-1"
                                      onClick={async () => {
                                        try {
                                          await supabase
                                            .from('profile_comments')
                                            .delete()
                                            .eq('id', reply.id)
                                          loadComments()
                                          toast.success('Reply deleted')
                                        } catch {
                                          toast.error('Failed to delete reply')
                                        }
                                      }}
                                    >
                                      Delete
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      ))
                  )}
                </div>
              </div>
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 text-left">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-black tracking-tighter uppercase italic">
                    {isOwnProfile ? 'Your Activity' : 'Activity'}
                  </h2>
                </div>

                <Tabs defaultValue="posts" className="w-full">
                  <TabsList className="mb-8 bg-accent/40 p-1 rounded-2xl border w-full md:w-auto h-12">
                    <TabsTrigger
                      value="posts"
                      className="rounded-xl px-6 h-full data-[state=active]:bg-background data-[state=active]:shadow-lg font-bold text-xs"
                    >
                      Posts
                    </TabsTrigger>
                    {yeditor?.is_verified && (
                      <>
                        <TabsTrigger
                          value="compilations"
                          className="rounded-xl px-6 h-full data-[state=active]:bg-background data-[state=active]:shadow-lg font-bold text-xs"
                        >
                          Comps
                        </TabsTrigger>
                        <TabsTrigger
                          value="singles"
                          className="rounded-xl px-6 h-full data-[state=active]:bg-background data-[state=active]:shadow-lg font-bold text-xs"
                        >
                          Singles
                        </TabsTrigger>
                        <TabsTrigger
                          value="songs"
                          className="rounded-xl px-6 h-full data-[state=active]:bg-background data-[state=active]:shadow-lg font-bold text-xs"
                        >
                          Songs
                        </TabsTrigger>
                      </>
                    )}
                  </TabsList>

                  <TabsContent
                    value="posts"
                    className="animate-in fade-in duration-500 mt-0"
                  >
                    <PostsFeed userId={targetId || undefined} />
                  </TabsContent>

                  {yeditor?.is_verified ? (
                    <>
                      <TabsContent
                        value="compilations"
                        className="animate-in fade-in duration-500 mt-0"
                      >
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                          {compilations.map((item) => (
                            <ContentCard
                              key={item.id}
                              item={item}
                              onPin={
                                isOwnProfile ? handlePinSpotlight : undefined
                              }
                              isSpotlight={spotlight?.id === item.id}
                              onFavorite={
                                isOwnProfile ? handleToggleFavorite : undefined
                              }
                              isOwnProfile={isOwnProfile}
                            />
                          ))}
                          {compilations.length === 0 && (
                            <div className="col-span-full py-16 bg-accent/10 rounded-3xl border border-dashed flex flex-col items-center">
                              <Disc3 className="w-10 h-10 text-muted-foreground/20 mb-4" />
                              <p className="text-muted-foreground text-sm font-medium">
                                No comps yet
                              </p>
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent
                        value="singles"
                        className="animate-in fade-in duration-500 mt-0"
                      >
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                          {singles.map((item) => (
                            <ContentCard
                              key={item.id}
                              item={item}
                              onPin={
                                isOwnProfile ? handlePinSpotlight : undefined
                              }
                              isSpotlight={spotlight?.id === item.id}
                              onFavorite={
                                isOwnProfile ? handleToggleFavorite : undefined
                              }
                              isOwnProfile={isOwnProfile}
                            />
                          ))}
                          {singles.length === 0 && (
                            <div className="col-span-full py-16 bg-accent/10 rounded-3xl border border-dashed flex flex-col items-center">
                              <Info className="w-10 h-10 text-muted-foreground/20 mb-4" />
                              <p className="text-muted-foreground text-sm font-medium">
                                No singles yet
                              </p>
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent
                        value="songs"
                        className="animate-in fade-in duration-500 mt-0"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {songs.map((item) => (
                            <SongRow key={item.id} item={item} />
                          ))}
                          {songs.length === 0 && (
                            <div className="col-span-full py-16 bg-accent/10 rounded-3xl border border-dashed flex flex-col items-center">
                              <Music className="w-10 h-10 text-muted-foreground/20 mb-4" />
                              <p className="text-muted-foreground text-sm font-medium">
                                No songs curated yet
                              </p>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </>
                  ) : (
                    <div className="mt-8 bg-black/20 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 text-center shadow-2xl animate-in fade-in duration-1000">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-6 h-6 text-primary/40" />
                      </div>
                      <h3 className="text-xl font-black tracking-tighter mb-2">
                        Start Creating
                      </h3>
                      <p className="text-muted-foreground max-w-sm mx-auto text-sm">
                        Become a verified creator to showcase your own
                        compilations and singles here.
                      </p>
                    </div>
                  )}
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
