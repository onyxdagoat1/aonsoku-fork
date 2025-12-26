import { useState } from 'react';
import { youtubeAuthenticatedService } from '@/service/youtubeAuthenticated';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { toast } from 'react-toastify';

interface CommentBoxProps {
  videoId: string;
  onSuccess?: () => void;
}

export function CommentBox({ videoId, onSuccess }: CommentBoxProps) {
  const [comment, setComment] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!comment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    setIsPosting(true);
    const result = await youtubeAuthenticatedService.commentOnVideo(videoId, comment);
    setIsPosting(false);

    if (result.success) {
      toast.success('Comment posted successfully!');
      setComment('');
      onSuccess?.();
    } else {
      toast.error(result.error || 'Failed to post comment');
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