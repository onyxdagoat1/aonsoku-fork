import { Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Button } from '@/app/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface RatingWidgetProps {
  contentType: 'track' | 'album'
  contentId: string
  showAggregate?: boolean
}

export function RatingWidget({
  contentType,
  contentId,
  showAggregate = true,
}: RatingWidgetProps) {
  const { user, profile } = useAuth()
  const [starRating, setStarRating] = useState<number | null>(null)
  const [thumbsUp, setThumbsUp] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [hoverStar, setHoverStar] = useState<number | null>(null)
  const [aggregate, setAggregate] = useState({
    avgStars: 0,
    totalStars: 0,
    thumbsUpCount: 0,
    thumbsDownCount: 0,
  })

  const location = useLocation()
  const isCompPage = location.pathname.includes('/library/albums')

  useEffect(() => {
    if (user && profile) {
      loadUserRating()
    }
    if (showAggregate) {
      loadAggregate()
    }
  }, [user, profile, contentType, contentId])

  const loadUserRating = async () => {
    if (!user || !profile) return

    try {
      const { data: starData } = await supabase
        .from('ratings')
        .select('star_rating')
        .eq('user_id', profile.id)
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .eq('rating_type', 'star')
        .single()

      if (starData) {
        setStarRating(starData.star_rating)
      }

      const { data: thumbsData } = await supabase
        .from('ratings')
        .select('thumbs_up')
        .eq('user_id', profile.id)
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .eq('rating_type', 'thumbs')
        .single()

      if (thumbsData) {
        setThumbsUp(thumbsData.thumbs_up)
      }
    } catch (error) {
      // No rating found, that's okay
    }
  }

  const loadAggregate = async () => {
    try {
      const { data: starRatings } = await supabase
        .from('ratings')
        .select('star_rating')
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .eq('rating_type', 'star')

      if (starRatings && starRatings.length > 0) {
        const total = starRatings.reduce(
          (sum, r) => sum + (r.star_rating || 0),
          0,
        )
        setAggregate((prev) => ({
          ...prev,
          avgStars: total / starRatings.length,
          totalStars: starRatings.length,
        }))
      }

      const { data: thumbsRatings } = await supabase
        .from('ratings')
        .select('thumbs_up')
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .eq('rating_type', 'thumbs')

      if (thumbsRatings) {
        const upCount = thumbsRatings.filter((r) => r.thumbs_up).length
        const downCount = thumbsRatings.filter((r) => !r.thumbs_up).length
        setAggregate((prev) => ({
          ...prev,
          thumbsUpCount: upCount,
          thumbsDownCount: downCount,
        }))
      }
    } catch (error) {
      console.error('Error loading aggregate ratings:', error)
    }
  }

  const handleStarRating = async (rating: number) => {
    if (!user || !profile) {
      toast.info('Please log in to rate')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from('ratings').upsert(
        {
          user_id: profile.id,
          content_type: contentType,
          content_id: contentId,
          rating_type: 'star',
          star_rating: rating,
        },
        {
          onConflict: 'user_id,content_type,content_id,rating_type',
        },
      )

      if (error) throw error

      setStarRating(rating)
      toast.success('Rating saved!')
      loadAggregate()
    } catch (error: any) {
      console.error('Error saving rating:', error)
      toast.error(
        'Failed to save rating: ' + (error.message || 'Unknown error'),
      )
    } finally {
      setLoading(false)
    }
  }

  const handleThumbs = async (up: boolean) => {
    if (!user || !profile) {
      toast.info('Please log in to rate')
      return
    }

    setLoading(true)
    try {
      const newValue = thumbsUp === up ? null : up

      if (newValue === null) {
        const { error } = await supabase
          .from('ratings')
          .delete()
          .eq('user_id', profile.id)
          .eq('content_type', contentType)
          .eq('content_id', contentId)
          .eq('rating_type', 'thumbs')

        if (error) throw error
        setThumbsUp(null)
      } else {
        const { error } = await supabase.from('ratings').upsert(
          {
            user_id: profile.id,
            content_type: contentType,
            content_id: contentId,
            rating_type: 'thumbs',
            thumbs_up: newValue,
          },
          {
            onConflict: 'user_id,content_type,content_id,rating_type',
          },
        )

        if (error) throw error
        setThumbsUp(newValue)
      }

      toast.success('Rating saved!')
      loadAggregate()
    } catch (error: any) {
      console.error('Error saving rating:', error)
      toast.error(
        'Failed to save rating: ' + (error.message || 'Unknown error'),
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-6 p-5 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
      {/* Star Rating Section */}
      <div className="flex-1">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Star Rating
        </h4>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleStarRating(star)}
                onMouseEnter={() => setHoverStar(star)}
                onMouseLeave={() => setHoverStar(null)}
                disabled={loading || !user}
                className={cn(
                  'p-1 transition-all duration-200 transform hover:scale-110',
                  (
                    hoverStar !== null
                      ? star <= hoverStar
                      : starRating !== null && star <= starRating
                  )
                    ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]'
                    : 'text-white/20 hover:text-yellow-300/60',
                )}
              >
                <Star
                  className={cn(
                    'w-6 h-6 transition-all',
                    (
                      hoverStar !== null
                        ? star <= hoverStar
                        : starRating !== null && star <= starRating
                    )
                      ? 'fill-yellow-400'
                      : '',
                  )}
                />
              </button>
            ))}
          </div>
          {showAggregate && aggregate.totalStars > 0 && (
            <div className="flex items-center gap-2 ml-3 px-3 py-1 rounded-full bg-white/5 border border-white/10">
              <span className="text-yellow-400 font-semibold">
                {aggregate.avgStars.toFixed(1)}
              </span>
              <span className="text-xs text-muted-foreground">
                / {aggregate.totalStars} ratings
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Thumbs/Sob Rating Section */}
      <div>
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          {isCompPage ? 'Sob Rating' : 'Thumbs Rating'}
        </h4>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleThumbs(true)}
            disabled={loading || !user}
            className={cn(
              'h-10 px-4 rounded-xl transition-all border',
              thumbsUp === true
                ? 'bg-green-500/20 border-green-500/40 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-white',
            )}
          >
            <span className="text-lg mr-1">{isCompPage ? '👍' : '👍'}</span>
            {showAggregate && aggregate.thumbsUpCount > 0 && (
              <span className="font-semibold">{aggregate.thumbsUpCount}</span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleThumbs(false)}
            disabled={loading || !user}
            className={cn(
              'h-10 px-4 rounded-xl transition-all border',
              thumbsUp === false
                ? 'bg-blue-500/20 border-blue-500/40 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-white',
            )}
          >
            <span className="text-lg mr-1">{isCompPage ? '😭' : '👎'}</span>
            {showAggregate && aggregate.thumbsDownCount > 0 && (
              <span className="font-semibold">{aggregate.thumbsDownCount}</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
