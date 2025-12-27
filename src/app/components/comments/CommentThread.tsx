import { useState } from 'react';
import { CommentItem } from './CommentItem';
import { CommentForm } from './CommentForm';
import { useComments } from '@/hooks/useComments';
import type { CommentWithReactions, ContentType } from '@/types/comments';
import { Button } from '../ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CommentThreadProps {
  comment: CommentWithReactions;
  contentType: ContentType;
  contentId: string;
  currentUserId?: string;
  currentUsername?: string;
  currentUserAvatar?: string;
  depth?: number;
}

export function CommentThread({
  comment,
  contentType,
  contentId,
  currentUserId,
  currentUsername,
  currentUserAvatar,
  depth = 0,
}: CommentThreadProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const { createComment, isCreating } = useComments({
    contentType,
    contentId,
    userId: currentUserId,
  });

  const handleReply = (text: string) => {
    if (!currentUserId || !currentUsername) return;

    createComment(
      {
        content_type: contentType,
        content_id: contentId,
        text,
        parent_id: comment.id,
        username: currentUsername,
        userAvatar: currentUserAvatar,
      },
      {
        onSuccess: () => {
          setShowReplyForm(false);
        },
      }
    );
  };

  const hasReplies = comment.replies && comment.replies.length > 0;
  const maxDepth = 3; // Maximum nesting level
  const canReply = depth < maxDepth;

  return (
    <div className="space-y-3">
      {/* Main comment */}
      <CommentItem
        comment={comment}
        currentUserId={currentUserId}
        onReply={canReply ? () => setShowReplyForm(!showReplyForm) : undefined}
      />

      {/* Reply form */}
      {showReplyForm && currentUserId && (
        <div className="ml-12 mt-3">
          <CommentForm
            placeholder={`Reply to ${comment.username}...`}
            onSubmit={handleReply}
            onCancel={() => setShowReplyForm(false)}
            isSubmitting={isCreating}
            username={currentUsername || 'Anonymous'}
            userAvatar={currentUserAvatar}
            compact
          />
        </div>
      )}

      {/* Replies */}
      {hasReplies && (
        <div className="ml-12 space-y-3">
          {/* Toggle replies button */}
          {comment.reply_count > 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReplies(!showReplies)}
              className="text-muted-foreground"
            >
              {showReplies ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Hide {comment.reply_count} replies
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Show {comment.reply_count} replies
                </>
              )}
            </Button>
          )}

          {/* Render replies */}
          {showReplies &&
            comment.replies?.map((reply) => (
              <CommentThread
                key={reply.id}
                comment={reply}
                contentType={contentType}
                contentId={contentId}
                currentUserId={currentUserId}
                currentUsername={currentUsername}
                currentUserAvatar={currentUserAvatar}
                depth={depth + 1}
              />
            ))}
        </div>
      )}
    </div>
  );
}
