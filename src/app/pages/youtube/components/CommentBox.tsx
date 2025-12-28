import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { commentsService } from '@/service/comments.service';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { toast } from 'react-toastify';

interface CommentBoxProps {
  videoId: string;
  onSuccess?: () => void;
}

export function CommentBox({ videoId, onSuccess }: CommentBoxProps) {
  const { user, profile } = useAuth();
  const [comment, setComment] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !profile) {
      toast.error('Please log in to comment');
      return;
    }

    if (!comment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    setIsPosting(true);
    try {
      await commentsService.createComment(
        {
          content_type: 'youtube_video',
          content_id: videoId,
          text: comment.trim(),
        },
        profile.id,
        profile.username,
        profile.avatar_url || undefined
      );

      toast.success('Comment posted successfully!');
      setComment('');
      onSuccess?.();
    } catch (error: any) {
      console.error('Error posting comment:', error);
      toast.error(error.message || 'Failed to post comment');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        placeholder="Add a public comment..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={4}
        disabled={isPosting}
        className="resize-none"
      />
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setComment('')}
          disabled={isPosting}
        >
          Clear
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={isPosting || !comment.trim()}
        >
          {isPosting ? 'Posting...' : 'Comment'}
        </Button>
      </div>
    </form>
  );
}