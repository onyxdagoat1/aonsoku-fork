import { useState } from 'react';
import { useComments } from '@/hooks/useComments';
import { CommentReactions } from './CommentReactions';
import { CommentForm } from './CommentForm';
import type { CommentWithReactions } from '@/types/comments';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { Edit, Flag, MoreVertical, Pin, Reply, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommentItemProps {
  comment: CommentWithReactions;
  currentUserId?: string;
  onReply?: () => void;
}

export function CommentItem({ comment, currentUserId, onReply }: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { updateComment, deleteComment, addReaction, removeReaction } = useComments({
    contentType: comment.content_type,
    contentId: comment.content_id,
    userId: currentUserId,
  });

  const isOwner = currentUserId === comment.user_id;
  const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true });

  const handleEdit = (text: string) => {
    updateComment(
      { id: comment.id, input: { text } },
      {
        onSuccess: () => setIsEditing(false),
      }
    );
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      deleteComment(comment.id);
    }
  };

  const handleReaction = (reactionType: string) => {
    if (!currentUserId) return;

    if (comment.user_reaction === reactionType) {
      removeReaction(comment.id);
    } else {
      addReaction({ commentId: comment.id, reactionType: reactionType as any });
    }
  };

  if (isEditing) {
    return (
      <div className="flex gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={comment.user_avatar || undefined} />
          <AvatarFallback>{comment.username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CommentForm
            initialValue={comment.text}
            onSubmit={handleEdit}
            onCancel={() => setIsEditing(false)}
            username={comment.username}
            compact
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 group">
      {/* Avatar */}
      <Avatar className="h-10 w-10">
        <AvatarImage src={comment.user_avatar || undefined} />
        <AvatarFallback>{comment.username.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>

      {/* Comment content */}
      <div className="flex-1 space-y-2">
        {/* Header */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{comment.username}</span>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
          {comment.edited && (
            <span className="text-xs text-muted-foreground">(edited)</span>
          )}
          {comment.pinned && (
            <Pin className="h-3 w-3 text-primary" />
          )}
        </div>

        {/* Comment text */}
        <div className={cn(
          "text-sm whitespace-pre-wrap break-words",
          comment.deleted && "text-muted-foreground italic"
        )}>
          {comment.text}
        </div>

        {/* Actions */}
        {!comment.deleted && (
          <div className="flex items-center gap-3">
            {/* Reactions */}
            <CommentReactions
              comment={comment}
              currentUserId={currentUserId}
              onReact={handleReaction}
            />

            {/* Reply button */}
            {onReply && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReply}
                className="h-7 text-xs"
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>
            )}

            {/* More menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOwner && (
                  <>
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem>
                  <Flag className="h-4 w-4 mr-2" />
                  Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
}
