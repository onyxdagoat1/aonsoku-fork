import { useState } from 'react';
import { useYouTubeAuthStore } from '@/store/youtubeAuth.store';
import { youtubeAuthenticatedService } from '@/service/youtubeAuthenticated';
import { Button } from '@/app/components/ui/button';
import { ThumbsUp, ThumbsDown, MessageSquare, ListPlus, Share2 } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog';
import { CommentBox } from './CommentBox';
import { PlaylistSelector } from './PlaylistSelector';

interface VideoActionsProps {
  videoId: string;
  videoTitle: string;
}

export function VideoActions({ videoId, videoTitle }: VideoActionsProps) {
  const { isAuthenticated } = useYouTubeAuthStore();
  const [isLiking, setIsLiking] = useState(false);
  const [isDisliking, setIsDisliking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showPlaylists, setShowPlaylists] = useState(false);

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.info('Connect your YouTube account to like videos');
      return;
    }

    setIsLiking(true);
    const result = await youtubeAuthenticatedService.likeVideo(videoId);
    setIsLiking(false);

    if (result.success) {
      toast.success('Video liked!');
    } else {
      toast.error(result.error || 'Failed to like video');
    }
  };

  const handleDislike = async () => {
    if (!isAuthenticated) {
      toast.info('Connect your YouTube account to dislike videos');
      return;
    }

    setIsDisliking(true);
    const result = await youtubeAuthenticatedService.dislikeVideo(videoId);
    setIsDisliking(false);

    if (result.success) {
      toast.success('Video disliked');
    } else {
      toast.error(result.error || 'Failed to dislike video');
    }
  };

  const handleShare = () => {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    if (navigator.share) {
      navigator.share({
        title: videoTitle,
        url,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        variant="outline"
        size="sm"
        onClick={handleLike}
        disabled={isLiking || !isAuthenticated}
        title={!isAuthenticated ? 'Connect YouTube account to like' : 'Like this video'}
      >
        <ThumbsUp className="w-4 h-4 mr-1" />
        Like
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleDislike}
        disabled={isDisliking || !isAuthenticated}
        title={!isAuthenticated ? 'Connect YouTube account to dislike' : 'Dislike this video'}
      >
        <ThumbsDown className="w-4 h-4 mr-1" />
        Dislike
      </Button>

      <Dialog open={showComments} onOpenChange={setShowComments}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={!isAuthenticated}
            title={!isAuthenticated ? 'Connect YouTube account to comment' : 'Add a comment'}
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            Comment
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Comment</DialogTitle>
            <DialogDescription>
              Share your thoughts on "{videoTitle}"
            </DialogDescription>
          </DialogHeader>
          <CommentBox videoId={videoId} onSuccess={() => setShowComments(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={showPlaylists} onOpenChange={setShowPlaylists}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={!isAuthenticated}
            title={!isAuthenticated ? 'Connect YouTube account to add to playlist' : 'Add to playlist'}
          >
            <ListPlus className="w-4 h-4 mr-1" />
            Save
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save to Playlist</DialogTitle>
            <DialogDescription>
              Add "{videoTitle}" to your playlists
            </DialogDescription>
          </DialogHeader>
          <PlaylistSelector videoId={videoId} onSuccess={() => setShowPlaylists(false)} />
        </DialogContent>
      </Dialog>

      <Button
        variant="outline"
        size="sm"
        onClick={handleShare}
      >
        <Share2 className="w-4 h-4 mr-1" />
        Share
      </Button>

      {!isAuthenticated && (
        <p className="text-xs text-muted-foreground ml-2">
          Connect your account to interact with videos
        </p>
      )}
    </div>
  );
}