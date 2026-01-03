import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import { Actions } from '@/app/components/actions'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { subsonic } from '@/service/subsonic'
import { useAppPages } from '@/store/app.store'
import { usePlayerActions } from '@/store/player.store'
import { SingleAlbum } from '@/types/responses/album'
import { queryKeys } from '@/utils/queryKeys'
import { AlbumOptions } from './options'

interface AlbumButtonsProps {
  album: SingleAlbum
  showInfoButton: boolean
}

export function AlbumButtons({ album, showInfoButton }: AlbumButtonsProps) {
  const { t } = useTranslation()
  const { setSongList } = usePlayerActions()
  const { showInfoPanel, toggleShowInfoPanel } = useAppPages()
  const { user, profile } = useAuth()

  const [starRating, setStarRating] = useState<number | null>(null)
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [thumbsUp, setThumbsUp] = useState<boolean | null>(null)
  const [aggregate, setAggregate] = useState({
    thumbsUpCount: 0,
    thumbsDownCount: 0,
  })

  const isAlbumStarred = album.starred !== undefined

  const queryClient = useQueryClient()

  const starMutation = useMutation({
    mutationFn: subsonic.star.handleStarItem,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.album.single, album.id],
      })
    },
  })

  useEffect(() => {
    loadAggregate()
    if (user && profile) {
      loadUserRating()
    }
  }, [user, profile, album.id])

  const loadAggregate = async () => {
    try {
      const { data: thumbsRatings } = await supabase
        .from('ratings')
        .select('thumbs_up')
        .eq('content_type', 'album')
        .eq('content_id', album.id)
        .eq('rating_type', 'thumbs')

      if (thumbsRatings) {
        const upCount = thumbsRatings.filter((r) => r.thumbs_up).length
        const downCount = thumbsRatings.filter((r) => !r.thumbs_up).length
        setAggregate({
          thumbsUpCount: upCount,
          thumbsDownCount: downCount,
        })
      }
    } catch {
      // Ignore errors
    }
  }

  const loadUserRating = async () => {
    if (!user || !profile) return

    try {
      const { data: starData } = await supabase
        .from('ratings')
        .select('star_rating')
        .eq('user_id', profile.id)
        .eq('content_type', 'album')
        .eq('content_id', album.id)
        .eq('rating_type', 'star')
        .single()

      if (starData) {
        setStarRating(starData.star_rating)
      }

      const { data: thumbsData } = await supabase
        .from('ratings')
        .select('thumbs_up')
        .eq('user_id', profile.id)
        .eq('content_type', 'album')
        .eq('content_id', album.id)
        .eq('rating_type', 'thumbs')
        .single()

      if (thumbsData) {
        setThumbsUp(thumbsData.thumbs_up)
      }
    } catch {
      // No rating found
    }
  }

  const handleStarRating = async (rating: number) => {
    if (!user || !profile) {
      toast.info('Please log in to rate')
      return
    }

    try {
      await supabase.from('ratings').upsert(
        {
          user_id: profile.id,
          content_type: 'album',
          content_id: album.id,
          rating_type: 'star',
          star_rating: rating,
        },
        {
          onConflict: 'user_id,content_type,content_id,rating_type',
        },
      )

      setStarRating(rating)
      toast.success('Rating saved!')
    } catch {
      toast.error('Failed to save rating')
    }
  }

  const handleThumbs = async (up: boolean) => {
    if (!user || !profile) {
      toast.info('Please log in to rate')
      return
    }

    try {
      const newValue = thumbsUp === up ? null : up

      if (newValue === null) {
        await supabase
          .from('ratings')
          .delete()
          .eq('user_id', profile.id)
          .eq('content_type', 'album')
          .eq('content_id', album.id)
          .eq('rating_type', 'thumbs')

        setThumbsUp(null)
      } else {
        await supabase.from('ratings').upsert(
          {
            user_id: profile.id,
            content_type: 'album',
            content_id: album.id,
            rating_type: 'thumbs',
            thumbs_up: newValue,
          },
          {
            onConflict: 'user_id,content_type,content_id,rating_type',
          },
        )

        setThumbsUp(newValue)
      }
      toast.success('Rating saved!')
      loadAggregate()
    } catch {
      toast.error('Failed to save rating')
    }
  }

  function handleLikeButton() {
    if (!album) return

    starMutation.mutate({
      id: album.id,
      starred: isAlbumStarred,
    })
  }

  const buttonsTooltips = {
    play: t('playlist.buttons.play', { name: album.name }),
    shuffle: t('playlist.buttons.shuffle', { name: album.name }),
    options: t('playlist.buttons.options', { name: album.name }),
    like: () => {
      return isAlbumStarred
        ? t('album.buttons.dislike', { name: album.name })
        : t('album.buttons.like', { name: album.name })
    },
    info: () => {
      return showInfoPanel ? t('generic.hideDetails') : t('generic.showDetails')
    },
  }

  const displayRating = hoverRating ?? starRating ?? 0

  const handleStarClick = (starIndex: number, isHalf: boolean) => {
    const rating = isHalf ? starIndex + 0.5 : starIndex + 1
    handleStarRating(rating)
  }

  const handleStarHover = (
    starIndex: number,
    e: React.MouseEvent<HTMLDivElement>,
  ) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const isHalf = x < rect.width / 2
    setHoverRating(isHalf ? starIndex + 0.5 : starIndex + 1)
  }

  const renderStar = (index: number) => {
    const starValue = index + 1
    const isFull = displayRating >= starValue
    const isHalf = displayRating >= starValue - 0.5 && displayRating < starValue

    return (
      <div
        key={index}
        className="relative w-5 h-5 cursor-pointer"
        onMouseMove={(e) => handleStarHover(index, e)}
        onMouseLeave={() => setHoverRating(null)}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const x = e.clientX - rect.left
          const clickedHalf = x < rect.width / 2
          handleStarClick(index, clickedHalf)
        }}
      >
        <Star className="absolute inset-0 w-5 h-5 text-white/20" />

        {isHalf && (
          <div className="absolute inset-0 overflow-hidden w-[50%]">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
          </div>
        )}

        {isFull && (
          <Star className="absolute inset-0 w-5 h-5 text-yellow-400 fill-yellow-400" />
        )}
      </div>
    )
  }

  return (
    <Actions.Container>
      <Actions.Button
        tooltip={buttonsTooltips.play}
        buttonStyle="primary"
        onClick={() => setSongList(album.song, 0)}
      >
        <Actions.PlayIcon />
      </Actions.Button>

      {album.song.length > 1 && (
        <Actions.Button
          tooltip={buttonsTooltips.shuffle}
          onClick={() => setSongList(album.song, 0, true)}
        >
          <Actions.ShuffleIcon />
        </Actions.Button>
      )}

      <Actions.Button
        tooltip={buttonsTooltips.like()}
        onClick={handleLikeButton}
      >
        <Actions.LikeIcon isStarred={isAlbumStarred} />
      </Actions.Button>

      {showInfoButton && (
        <Actions.Button
          tooltip={buttonsTooltips.info()}
          onClick={toggleShowInfoPanel}
        >
          <Actions.InfoIcon />
        </Actions.Button>
      )}

      <Actions.Dropdown
        tooltip={buttonsTooltips.options}
        options={<AlbumOptions album={album} />}
      />

      {/* Inline 5-Star Rating with Half Stars */}
      <div className="flex items-center gap-1.5 ml-4">
        {[0, 1, 2, 3, 4].map((index) => renderStar(index))}
      </div>

      {/* Like Button with Count */}
      <button
        onClick={() => handleThumbs(true)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all ml-2 ${
          thumbsUp === true
            ? 'bg-green-500/20 text-green-400'
            : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
        }`}
        title={thumbsUp === true ? 'You liked this' : 'Like this comp'}
      >
        <span className="text-base">👍</span>
        {aggregate.thumbsUpCount > 0 && (
          <span className="text-xs font-medium">{aggregate.thumbsUpCount}</span>
        )}
      </button>

      {/* Sob Button with Count */}
      <button
        onClick={() => handleThumbs(false)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all ${
          thumbsUp === false
            ? 'bg-blue-500/20 text-blue-400'
            : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
        }`}
        title={thumbsUp === false ? 'You sobbed to this' : 'Sob rating'}
      >
        <span className="text-base">😭</span>
        {aggregate.thumbsDownCount > 0 && (
          <span className="text-xs font-medium">
            {aggregate.thumbsDownCount}
          </span>
        )}
      </button>
    </Actions.Container>
  )
}
