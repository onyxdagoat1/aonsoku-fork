import { useState } from 'react';
import { useYouTubeOAuthStore } from '@/store/useYouTubeOAuthStore';
import { youtubeOAuthService } from '@/service/youtube-oauth.service';
import { Button } from '@/app/components/ui/button';
import { ThumbsUp } from 'lucide-react';
import { toast } from 'react-toastify';
import { cn } from '@/lib/utils';

interface LikeButtonProps {
  videoId: string;
  initialLiked?: boolean;
  likeCount?: number;
  onLikeChange?: (liked: boolean) => void;
}

export function LikeButton({
  videoId,
  initialLiked = false,
  likeCount,
  onLikeChange,
}: LikeButtonProps) {
  const { isAuthenticated } = useYouTubeOAuthStore();
  const [liked, setLiked] = useState(initialLiked);
  const [loading, setLoading] = useState(false);

  const handleToggleLike = async () => {
    if (!isAuthenticated) {
      toast.info('Please connect your Google account to like videos');
      return;
    }

    setLoading(true);
    try {
      if (liked) {
        await youtubeOAuthService.unlikeVideo(videoId);
        setLiked(false);
        toast.success('Removed like');
        onLikeChange?.(false);
      } else {
        await youtubeOAuthService.likeVideo(videoId);
        setLiked(true);
        toast.success('Video liked!');
        onLikeChange?.(true);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
      toast.error('Failed to update like');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={liked ? 'default' : 'outline'}
      size="sm"
      onClick={handleToggleLike}
      disabled={loading || !isAuthenticated}
      className={cn('gap-2', liked && 'bg-blue-600 hover:bg-blue-700')}
    >
      <ThumbsUp className={cn('h-4 w-4', liked && 'fill-current')} />
      {likeCount !== undefined && (
        <span>{likeCount.toLocaleString()}</span>
      )}
    </Button>
  );
}
