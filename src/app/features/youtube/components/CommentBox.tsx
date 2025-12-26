import { useState } from 'react';
import { useYouTubeOAuthStore } from '@/store/useYouTubeOAuthStore';
import { youtubeOAuthService } from '@/service/youtube-oauth.service';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Loader2, Send } from 'lucide-react';
import { toast } from 'react-toastify';

interface CommentBoxProps {
  videoId: string;
  parentId?: string;
  placeholder?: string;
  onCommentPosted?: () => void;
  onCancel?: () => void;
}

export function CommentBox({
  videoId,
  parentId,
  placeholder = 'Add a comment...',
  onCommentPosted,
  onCancel,
}: CommentBoxProps) {
  const { isAuthenticated, userInfo } = useYouTubeOAuthStore();
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);

  const handlePost = async () => {
    if (!comment.trim() || !isAuthenticated) return;

    setPosting(true);
    try {
      if (parentId) {
        await youtubeOAuthService.replyToComment(parentId, comment);
      } else {
        await youtubeOAuthService.postComment(videoId, comment);
      }
      
      toast.success('Comment posted successfully!');
      setComment('');
      onCommentPosted?.();
    } catch (error) {
      console.error('Failed to post comment:', error);
      toast.error('Failed to post comment');
    } finally {
      setPosting(false);
    }
  };

  if (!isAuthenticated || !userInfo) {
    return null;
  }

  return (
    <div className="flex gap-3">
      <Avatar className="h-10 w-10">
        <AvatarImage src={userInfo.picture} alt={userInfo.name} />
        <AvatarFallback>{userInfo.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2">
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={placeholder}
          className="resize-none"
          rows={3}
          disabled={posting}
        />
        <div className="flex gap-2 justify-end">
          {onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={posting}
            >
              Cancel
            </Button>
          )}
          <Button
            size="sm"
            onClick={handlePost}
            disabled={!comment.trim() || posting}
            className="gap-2"
          >
            {posting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {posting ? 'Posting...' : 'Comment'}
          </Button>
        </div>
      </div>
    </div>
  );
}
