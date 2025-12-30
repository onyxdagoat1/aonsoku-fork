import { Heart, Loader2, UserMinus, UserPlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { Button } from '@/app/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { type FollowType, followService } from '@/service/followService'

interface FollowButtonProps {
  type: FollowType
  id: string
  name?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
  showLabel?: boolean
  className?: string
  onFollowChange?: (isFollowing: boolean) => void
}

export function FollowButton({
  type,
  id,
  name,
  variant = 'outline',
  size = 'sm',
  showLabel = true,
  className,
  onFollowChange,
}: FollowButtonProps) {
  const { user } = useAuth()
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    if (user) {
      loadFollowStatus()
    } else {
      setLoading(false)
    }
  }, [user, type, id])

  const loadFollowStatus = async () => {
    setLoading(true)
    try {
      const following = await followService.isFollowing(type, id)
      setIsFollowing(following)
    } catch (error) {
      console.error('Error loading follow status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleFollow = async () => {
    if (!user) {
      toast.info('Please log in to follow')
      return
    }

    setToggling(true)
    try {
      const success = await followService.toggleFollow(type, id)
      if (success) {
        const newStatus = !isFollowing
        setIsFollowing(newStatus)
        onFollowChange?.(newStatus)

        const entityName =
          name || (type === 'yeditor' ? 'this editor' : 'this user')
        toast.success(
          newStatus ? `Following ${entityName}` : `Unfollowed ${entityName}`,
        )
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
      toast.error('Failed to update follow status')
    } finally {
      setToggling(false)
    }
  }

  if (loading) {
    return (
      <Button variant={variant} size={size} disabled className={className}>
        <Loader2 className="w-4 h-4 animate-spin" />
      </Button>
    )
  }

  // Don't show button if not logged in
  if (!user) {
    return null
  }

  return (
    <Button
      variant={isFollowing ? 'default' : variant}
      size={size}
      onClick={handleToggleFollow}
      disabled={toggling}
      className={cn(
        isFollowing &&
          'bg-primary/10 text-primary hover:bg-destructive hover:text-destructive-foreground',
        className,
      )}
    >
      {toggling ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserMinus className="w-4 h-4" />
          {showLabel && <span className="ml-2">Following</span>}
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          {showLabel && <span className="ml-2">Follow</span>}
        </>
      )}
    </Button>
  )
}

// Simpler heart-style follow button
interface FollowHeartButtonProps {
  type: FollowType
  id: string
  className?: string
  onFollowChange?: (isFollowing: boolean) => void
}

export function FollowHeartButton({
  type,
  id,
  className,
  onFollowChange,
}: FollowHeartButtonProps) {
  const { user } = useAuth()
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    if (user) {
      loadFollowStatus()
    } else {
      setLoading(false)
    }
  }, [user, type, id])

  const loadFollowStatus = async () => {
    setLoading(true)
    try {
      const following = await followService.isFollowing(type, id)
      setIsFollowing(following)
    } catch (error) {
      console.error('Error loading follow status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleFollow = async () => {
    if (!user) {
      toast.info('Please log in to follow')
      return
    }

    setToggling(true)
    try {
      const success = await followService.toggleFollow(type, id)
      if (success) {
        const newStatus = !isFollowing
        setIsFollowing(newStatus)
        onFollowChange?.(newStatus)
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
      toast.error('Failed to update follow status')
    } finally {
      setToggling(false)
    }
  }

  if (!user) return null

  return (
    <button
      onClick={handleToggleFollow}
      disabled={loading || toggling}
      className={cn(
        'p-2 rounded-full transition-colors',
        isFollowing
          ? 'text-red-500 hover:text-red-600'
          : 'text-muted-foreground hover:text-foreground',
        className,
      )}
    >
      {toggling || loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <Heart className={cn('w-5 h-5', isFollowing && 'fill-current')} />
      )}
    </button>
  )
}
